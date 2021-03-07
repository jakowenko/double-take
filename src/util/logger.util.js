const fs = require('fs');
const { LOGS, STORAGE_PATH } = require('../constants');

let logStream = false;

module.exports.log = (message, config = {}) => {
  if (!logStream) logStream = fs.createWriteStream(`${STORAGE_PATH}/messages.log`, { flags: 'a' });
  logStream.write(`${JSON.stringify(message)}\n`);

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
