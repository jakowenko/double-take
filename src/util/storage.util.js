const fs = require('fs');
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const logger = require('./logger.util');
const time = require('./time.util');
const { STORAGE_PATH } = require('../constants');

module.exports.purge = () => {
  schedule.scheduleJob('0 * * * *', () => {
    const purged = [];
    try {
      const files = fs.readdirSync(`${STORAGE_PATH}/matches`);
      for (const file of files) {
        const { birthtime } = fs.statSync(`${STORAGE_PATH}/matches/${file}`);
        const duration = moment.duration(moment().diff(birthtime));
        const hours = duration.asHours();
        if (hours > 24) {
          try {
            fs.unlinkSync(`${STORAGE_PATH}/matches/${file}`);
            purged.push(file);
          } catch (error) {
            logger.log(error.message);
          }
        }
      }
      if (purged.length) logger.log(`purged ${purged.length} matched file(s) @ ${time.current()}`);
    } catch (error) {
      logger.log(error.message);
    }
  });
};

module.exports.setup = () => {
  if (!fs.existsSync(`${STORAGE_PATH}/matches`)) {
    fs.mkdirSync(`${STORAGE_PATH}/matches`, { recursive: true });
  }
  if (!fs.existsSync(`${STORAGE_PATH}/names`)) {
    fs.mkdirSync(`${STORAGE_PATH}/names`, { recursive: true });
  }
};
