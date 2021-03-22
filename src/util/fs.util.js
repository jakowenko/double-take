const fs = require('fs');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const { createCanvas, loadImage, registerFont } = require('canvas');
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

module.exports.drawBox = async (match, source) => {
  const { box } = match;

  const text = `${match.name} - ${match.confidence}%`;
  const fontSize = 18;
  const textPadding = 10;
  const lineWidth = 4;

  const { width, height } = await sizeOf(source);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = await loadImage(source);
  registerFont('./src/static/fonts/Roboto/Roboto-Medium.ttf', { family: 'Roboto-Medium' });
  ctx.drawImage(image, 0, 0);
  ctx.font = `${fontSize}px Roboto-Medium`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#4caf50';
  const textWidth = ctx.measureText(text).width + textPadding;
  const textHeight = fontSize + textPadding;
  ctx.fillRect(box.left - lineWidth / 2, box.top - textHeight, textWidth, textHeight);
  ctx.fillStyle = '#fff';
  ctx.fillText(
    text,
    box.left + textPadding / 2 - lineWidth / 2,
    box.top - textHeight + textPadding / 2
  );

  ctx.strokeStyle = '#4caf50';
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  ctx.rect(box.left, box.top, box.width, box.height);
  ctx.stroke();

  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(source, buffer);
};
