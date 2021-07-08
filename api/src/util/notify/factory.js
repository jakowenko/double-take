const services = require('.');

module.exports.get = (service) => {
  try {
    return services[service];
  } catch (error) {
    console.error(`${service} factory error: ${error.message}`);
  }
};
