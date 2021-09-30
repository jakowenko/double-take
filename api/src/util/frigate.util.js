const axios = require('axios');
const sleep = require('./sleep.util');

const { FRIGATE, MQTT } = require('../constants')();

const frigate = this;

module.exports.checks = async ({
  id,
  frigateEventType: type,
  topic,
  label,
  camera,
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

    if (PROCESSING && type !== 'start') {
      return `${id} - still processing previous request`;
    }

    if (type === 'end') {
      return `${id} - skip processing on ${type} events`;
    }

    if (!FRIGATE.LABELS.includes(label)) {
      return `${id} - ${label} label not in (${FRIGATE.LABELS.join(', ')})`;
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

module.exports.snapshotReady = async (id) => {
  let loop = true;
  let ready = false;
  setTimeout(() => {
    loop = false;
  }, 15000);

  while (loop) {
    try {
      const request = await axios({
        method: 'get',
        url: `${FRIGATE.URL}/api/events/${id}`,
      });
      if (request.data.has_snapshot) {
        ready = true;
        break;
      }
      // eslint-disable-next-line no-empty
    } catch (error) {}
    await sleep(0.05);
  }
  if (!ready) {
    console.error('frigate snapshot ready error');
  }
  return ready;
};
