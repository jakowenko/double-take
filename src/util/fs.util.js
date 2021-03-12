const fs = require('fs');
const logger = require('./logger.util');
const { STORAGE_PATH } = require('../constants');

module.exports.files = async () => {
  const output = [];
  let folders = await fs.promises.readdir(`${STORAGE_PATH}/train`, { withFileTypes: true });
  folders = folders.filter((file) => file.isDirectory()).map((file) => file.name);

  for (const folder of folders) {
    let images = await fs.promises.readdir(`${STORAGE_PATH}/train/${folder}`, {
      withFileTypes: true,
    });
    images = images
      .filter((file) => file.isFile())
      .map((file) => file.name)
      .filter(
        (file) =>
          file.toLowerCase().includes('.jpeg') ||
          file.toLowerCase().includes('.jpg') ||
          file.toLowerCase().includes('.png')
      );
    images.forEach((filename) => {
      output.push({ name: folder, filename });
    });
  }

  return output;
};

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
  if (fs.existsSync(destination)) {
    fs.unlink(destination, (error) => {
      if (error) {
        logger.log(`delete error: ${error.message}`);
      }
    });
  }
};
