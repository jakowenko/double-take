const axios = require('axios');
const sleep = require('./sleep.util');

const { FRIGATE } = require('../constants');

const frigate = this;

module.exports.checks = async ({
  id,
  frigateEventType: type,
  label,
  camera,
  zones,
  PROCESSING,
  IDS,
}) => {
  try {
    if (!FRIGATE.URL) {
      return `Frigate URL not configured`;
    }

    if (FRIGATE.CAMERAS && !FRIGATE.CAMERAS.includes(camera)) {
      return `${id} - ${camera} not on approved list`;
    }

    if (FRIGATE.ZONES) {
      const [cameraMatch] = FRIGATE.ZONES.filter(({ CAMERA }) => camera === CAMERA);

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

    if (label !== 'person') {
      return `${id} - label not a person, ${label} found`;
    }

    if (IDS.includes(id)) {
      return `already processed ${id}`;
    }

    await frigate.status();

    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports.status = async () => {
  try {
    const request = await axios({
      method: 'get',
      url: `${FRIGATE.URL}/api/version`,
    });
    return request.data;
  } catch (error) {
    throw new Error(`frigate status error: ${error.message}`);
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
