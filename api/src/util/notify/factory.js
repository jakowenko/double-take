const logger = require('../logger.util');

const services = require('.');

module.exports.get = (service) => {
  try {
    return services[service];
  } catch (error) {
    logger.log(`${service} factory error: ${error.message}`);
  }
};
