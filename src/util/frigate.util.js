const axios = require('axios');

const { FRIGATE_URL } = require('../constants');

const frigate = this;

module.exports.checks = async ({ id, type, label, camera, PROCESSING, LAST_CAMERA, IDS }) => {
  try {
    await frigate.status();

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
