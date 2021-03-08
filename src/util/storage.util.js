const fs = require('fs');
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const logger = require('./logger.util');
const time = require('./time.util');
const { STORAGE_PATH } = require('../constants');

module.exports.purge = async () => {
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      let purged = 0;
      const files = await fs.promises.readdir(`${STORAGE_PATH}/matches`, { withFileTypes: true });
      const images = files.filter((file) => file.isFile()).map((file) => file.name);
      const folders = files.filter((file) => file.isDirectory()).map((file) => file.name);

      purged += await this.delete('matches', images);

      for (const folder of folders) {
        const folderFiles = await fs.promises.readdir(`${STORAGE_PATH}/matches/${folder}`, {
          withFileTypes: true,
        });
        const folderImages = folderFiles.filter((file) => file.isFile()).map((file) => file.name);
        purged += await this.delete(`matches/${folder}`, folderImages);
      }

      if (purged > 0) logger.log(`${time.current()}\npurged ${purged} matched file(s)`);
    } catch (error) {
      logger.log(`purge error: ${error.message}`);
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

module.exports.delete = async (path, images) => {
  const purged = [];
  for (const image of images) {
    const { birthtime } = await fs.promises.stat(`${STORAGE_PATH}/${path}/${image}`);
    const duration = moment.duration(moment().diff(birthtime));
    const hours = duration.asHours();
    if (hours > 48) {
      try {
        await fs.promises.unlink(`${STORAGE_PATH}/${path}/${image}`);
        purged.push(image);
      } catch (error) {
        logger.log(`delete error: ${error.message}`);
      }
    }
  }
  return purged.length;
};
