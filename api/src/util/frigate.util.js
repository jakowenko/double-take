const axios = require('axios');

const { FRIGATE_URL, FRIGATE_CAMERAS, FRIGATE_ZONES } = require('../constants');

const frigate = this;

module.exports.checks = async ({
  id,
  type,
  label,
  camera,
  zones,
  PROCESSING,
  LAST_CAMERA,
  IDS,
}) => {
  try {
    await frigate.status();

    if (FRIGATE_CAMERAS && !FRIGATE_CAMERAS.includes(camera)) {
      return `${id} - ${camera} not on approved list`;
    }

    if (FRIGATE_ZONES) {
      const frigateZones = FRIGATE_ZONES.map((obj) => {
        const [cameraName, zoneName] = obj.split(':');
        return { camera: cameraName, zone: zoneName };
      });

      const [cameraMatch] = frigateZones.filter((obj) => camera === obj.camera);

      if (cameraMatch) {
        const [match] = frigateZones.filter(
          (obj) => camera === obj.camera && zones.includes(obj.zone)
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

    if (LAST_CAMERA === camera) {
      return `${id} - paused processing ${camera}, recent match found`;
    }

    if (IDS.includes(id)) {
      return `already processed ${id}`;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports.status = async () => {
  try {
    const request = await axios({
      method: 'get',
      url: `${FRIGATE_URL}/api/version`,
    });
    return request.data;
  } catch (error) {
    throw new Error(`frigate status error: ${error.message}`);
  }
};
