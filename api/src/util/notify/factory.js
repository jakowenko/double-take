const services = require('.');

module.exports.get = (service) => {
  try {
    return services[service];
  } catch (error) {
    error.message = `${service} factory error: ${error.message}`;
    console.error(error);
  }
};
