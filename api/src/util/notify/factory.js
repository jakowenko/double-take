const logger = require('../logger.util');
const constants = require('../../constants');

const services = require('.');

module.exports.get = (service) => {
  try {
    return services[service];
  } catch (error) {
    logger.log(`${service} factory error: ${error.message}`);
  }
};

module.exports.checks = (service, { camera, zones }) => {
  const { CAMERAS, ZONES } = constants.NOTIFY[service.toUpperCase()];
  if (CAMERAS && !CAMERAS.includes(camera)) {
    return `${camera} not on approved list`;
  }

  if (ZONES) {
    const [cameraMatch] = ZONES.filter(({ CAMERA }) => camera === CAMERA);

    if (cameraMatch) {
      const [match] = ZONES.filter(({ CAMERA, ZONE }) => camera === CAMERA && zones.includes(ZONE));

      if (!match) {
        return `${camera} zone not on approved list`;
      }
    }
  }

  return true;
};
