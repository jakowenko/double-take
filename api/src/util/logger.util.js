const os = require('os');
const fs = require('fs');
const { LOGS, STORAGE_PATH } = require('../constants');

let logStream = false;

module.exports.log = (message, config = {}) => {
  try {
    if (!logStream)
      logStream = fs.createWriteStream(`${STORAGE_PATH}/messages.log`, { flags: 'a' });

    const logMessage =
      typeof message === 'string'
        ? message.replace(/\n/g, os.EOL)
        : JSON.stringify(message, null, '\t');
    logStream.write(logMessage + os.EOL);

    if (config.verbose) {
      if (LOGS === 'verbose') {
        console.log(message);
        // if (config.dashes) this.dashes(message);
      }
      return;
    }

    console.log(message);
    // if (config.dashes) this.dashes(message);
  } catch (error) {
    console.log('logger error');
    console.log(error);
  }
};

module.exports.dashes = (message) => {
  this.log('-'.repeat(message.length));
};
