const axios = require('axios');
const logger = require('./logger.util');
const { HOME_ASSISTANT } = require('../constants');

const formatName = (input) => input.replace(/-/g, '_');

module.exports.publish = async (data) => {
  try {
    if (!HOME_ASSISTANT || !HOME_ASSISTANT.URL || !HOME_ASSISTANT.TOKEN) {
      return;
    }
    const { matches, unknown, camera } = data;
    const configData = JSON.parse(JSON.stringify(data));
    delete configData.matches;
    delete configData.unknown;
    delete configData.results;

    const defaultConfig = {
      camera,
      id: configData.id,
      totalDuration: configData.duration,
      attempts: configData.attempts,
      timestamp: configData.timestamp,
    };

    if (unknown && Object.keys(unknown).length) {
      await axios({
        method: 'post',
        url: `${HOME_ASSISTANT.URL}/api/states/sensor.double_take_${formatName(unknown.name)}`,
        headers: {
          Authorization: `Bearer ${HOME_ASSISTANT.TOKEN}`,
        },
        data: {
          state: camera,
          attributes: {
            ...defaultConfig,
            ...unknown,
          },
        },
      });
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      await axios({
        method: 'post',
        url: `${HOME_ASSISTANT.URL}/api/states/sensor.double_take_${formatName(match.name)}`,
        headers: {
          Authorization: `Bearer ${HOME_ASSISTANT.TOKEN}`,
        },
        data: {
          state: camera,
          attributes: {
            ...defaultConfig,
            ...match,
          },
        },
      });
    }

    if (matches.length || (unknown && Object.keys(unknown).length)) {
      await axios({
        method: 'post',
        url: `${HOME_ASSISTANT.URL}/api/states/sensor.double_take_${formatName(camera)}`,
        headers: {
          Authorization: `Bearer ${HOME_ASSISTANT.TOKEN}`,
        },
        data: {
          state: matches.length + (unknown && Object.keys(unknown).length ? 1 : 0),
          attributes: {
            ...defaultConfig,
            matches,
            unknown,
          },
        },
      });
    }
  } catch (error) {
    logger.log(`Home Assistant: publish error: ${error.message}`);
  }
};
