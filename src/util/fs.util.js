const fs = require('fs');
const logger = require('./logger.util');
const { STORAGE_PATH } = require('../constants');

module.exports.writer = async (stream, file) => {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(file);
    stream.pipe(out);
    out
      .on('finish', () => {
        resolve();
      })
      .on('error', (error) => {
        logger.log(`writer error: ${error.message}`);
      });
  });
};

module.exports.writeMatches = (name, source, destination) => {
  try {
    if (!fs.existsSync(`${STORAGE_PATH}/matches/${name}`)) {
      fs.mkdirSync(`${STORAGE_PATH}/matches/${name}`);
    }
    fs.copyFile(source, destination, (error) => {
      if (error) {
        logger.log(`write match error: ${error.message}`);
      }
    });
  } catch (error) {
    logger.log(`create match folder error: ${error.message}`);
  }
};

module.exports.delete = (destination) => {
  fs.unlink(destination, (error) => {
    if (error) {
      logger.log(`delete error: ${error.message}`);
    }
  });
};
