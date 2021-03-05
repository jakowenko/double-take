const { LOGS } = require('../constants');

module.exports.log = (message, config = {}) => {
  if (config.verbose) {
    if (LOGS === 'verbose') {
      console.log(message);
      // if (config.dashes) this.dashes(message);
    }
    return;
  }

  console.log(message);
  // if (config.dashes) this.dashes(message);
};

module.exports.dashes = (message) => {
  this.log('-'.repeat(message.length));
};
