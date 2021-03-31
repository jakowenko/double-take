const fs = require('fs');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const { createCanvas, loadImage, registerFont } = require('canvas');
const md5File = require('md5-file');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger.util');
const { STORAGE_PATH } = require('../constants');

module.exports.folders = () => {
  return {
    matches: async () => {
      let folders = await fs.promises.readdir(`${STORAGE_PATH}/matches`, { withFileTypes: true });
      folders = folders
        .filter((file) => file.isDirectory() && file.name !== 'unknown')
        .map((file) => file.name);
      return folders;
    },
    train: async () => {
      let folders = await fs.promises.readdir(`${STORAGE_PATH}/train`, { withFileTypes: true });
      folders = folders.filter((file) => file.isDirectory()).map((file) => file.name);
      return folders;
    },
  };
};

module.exports.files = () => {
  return {
    traverse: async (path) => {
      const output = [];
      let folders = await fs.promises.readdir(`${STORAGE_PATH}/${path}`, { withFileTypes: true });
      folders = folders.filter((file) => file.isDirectory()).map((file) => file.name);

      for (const folder of folders) {
        let images = await fs.promises.readdir(`${STORAGE_PATH}/${path}/${folder}`, {
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
          output.push({ name: folder, filename, key: `${path}/${folder}/${filename}` });
        });
      }
      return output;
    },
    train: async () => {
      return this.files().traverse('train');
    },
    matches: async () => {
      return this.files().traverse('matches');
    },
  };
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

module.exports.copy = (source, destination) => {
  fs.copyFile(source, destination, (error) => {
    if (error) {
      logger.log(`copy file error: ${error.message}`);
    }
  });
};

module.exports.delete = (destination) => {
  try {
    if (fs.existsSync(destination)) {
      fs.unlinkSync(destination);
    }
  } catch (error) {
    logger.log(`delete error: ${error.message}`);
  }
};

module.exports.move = (source, destination) => {
  try {
    if (fs.existsSync(source)) {
      fs.renameSync(source, destination);
    }
  } catch (error) {
    logger.log(`move error: ${error.message}`);
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

module.exports.save = () => {
  return {
    matches: async (id, matches) => {
      const filenames = [];
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const { width, height } = match.box;
        const tmp = `/tmp/{${uuidv4()}}.jpg`;
        await this.writer(fs.createReadStream(match.tmp), tmp);
        await this.drawBox(match, tmp);
        const filename = `${id}-${match.type}-${width}x${height}.jpg`;
        const destination = `${STORAGE_PATH}/matches/${match.name}/${filename}`;
        this.writeMatches(match.name, tmp, destination);
        filenames.push(filename);
      }
      return filenames;
    },
    unknown: (results) => {
      const md5Misses = [];
      const unknown = results.reduce((array, result) => {
        const tmps = [];
        result.misses.forEach((miss) => {
          const md5 = md5File.sync(miss.tmp);
          if (!md5Misses.includes(md5)) {
            md5Misses.push(md5);
            tmps.push(miss.tmp);
          }
        });
        array.push(...tmps);
        return array;
      }, []);
      for (let i = 0; i < unknown.length; i++) {
        this.copy(unknown[i], `${STORAGE_PATH}/matches/unknown/${uuidv4()}.jpg`);
      }
    },
  };
};
