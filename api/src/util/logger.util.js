const os = require('os');
const fs = require('fs');
const { STORAGE } = require('../constants');

let logStream = false;

module.exports.log = (message) => {
  try {
    if (!logStream)
      logStream = fs.createWriteStream(`${STORAGE.PATH}/messages.log`, { flags: 'a' });

    const logMessage =
      typeof message === 'string'
        ? message.replace(/\n/g, os.EOL)
        : JSON.stringify(message, null, '\t');
    logStream.write(logMessage + os.EOL);

    if (typeof message === 'object') console.dir(message, { depth: null });
    else console.log(message);
  } catch (error) {
    console.log('logger error');
    console.log(error);
  }
};

module.exports.dashes = (message) => {
  this.log('-'.repeat(message.length));
};
