const axios = require('axios');
const logger = require('./logger.util');

const { FRIGATE_URL } = require('../constants');

module.exports.status = async () => {
  try {
    const request = await axios({
      method: 'get',
      url: `${FRIGATE_URL}/api/version`,
    });
    return request.data;
  } catch (error) {
    logger.log(`frigate status error: ${error.message}`);
    return false;
  }
};
