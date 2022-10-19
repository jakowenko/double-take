const axios = require('axios');
const { FRIGATE, MQTT } = require('../constants')();

const frigate = this;

module.exports.subLabel = async (topic, id, best) => {
  if (!FRIGATE.URL || !FRIGATE.UPDATE_SUB_LABELS || !best.length) return;
  const names = best
    .map(({ name }) => name)
    .sort()
    .join(', ');
  await axios({
    method: 'post',
    url: `${this.topicURL(topic)}/api/events/${id}/sub_label`,
    data: { subLabel: names },
  }).catch((error) => console.error(`sublabel error: ${error.message}`));
};

module.exports.checks = async ({
  id,
  frigateEventType: type,
  topic,
  label,
  camera,
  area,
  zones,
  PROCESSING,
  IDS,
}) => {
  try {
    if (!FRIGATE.URL) throw Error('Frigate URL not configured');

    const cameraMatch = FRIGATE.ZONES
      ? FRIGATE.ZONES.filter(({ CAMERA }) => camera === CAMERA).length
        ? FRIGATE.ZONES.filter(({ CAMERA }) => camera === CAMERA)[0]
        : false
      : false;

    if (FRIGATE.CAMERAS && !FRIGATE.CAMERAS.includes(camera) && !cameraMatch) {
      return `${id} - ${camera} not on approved list`;
    }

    if (FRIGATE.ZONES) {
      if (cameraMatch) {
        const [match] = FRIGATE.ZONES.filter(
          ({ CAMERA, ZONE }) => camera === CAMERA && zones.includes(ZONE)
        );

        if (!match) {
          return `${id} - ${camera} zone not on approved list`;
        }
      }
    }

    if (PROCESSING && type === 'update') {
      return `${id} - still processing previous request`;
    }

    if (type === 'end') {
      return `${id} - skip processing on ${type} events`;
    }

    if (!FRIGATE.LABELS.includes(label)) {
      return `${id} - ${label} label not in (${FRIGATE.LABELS.join(', ')})`;
    }

    if (FRIGATE.MIN_AREA > area) {
      return `skipping object area smaller than ${FRIGATE.MIN_AREA} (${area})`;
    }

    if (IDS.includes(id)) {
      return `already processed ${id}`;
    }

    await frigate.status(topic);

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports.status = async (topic) => {
  try {
    const request = await axios({
      method: 'get',
      url: `${this.topicURL(topic)}/api/version`,
      timeout: 5 * 1000,
    });
    return request.data;
  } catch (error) {
    throw new Error(`frigate status error: ${error.message}`);
  }
};

module.exports.topicURL = (topic) => {
  try {
    if (typeof FRIGATE.URL === 'string') return FRIGATE.URL;
    return FRIGATE.URL[MQTT.TOPICS.FRIGATE.indexOf(topic)];
  } catch (error) {
    error.message = `frigate topic url error: ${error.message}`;
    throw error;
  }
};
