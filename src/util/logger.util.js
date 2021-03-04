const { LOGS } = require('../constants');

module.exports.log = (message, config = {}) => {
  if (config.verbose) {
    if (LOGS === 'verbose') {
      console.log(message);
    }
    return;
  }

  console.log(message);
};
