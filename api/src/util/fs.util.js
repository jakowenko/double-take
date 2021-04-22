const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { ExifTool } = require('exiftool-vendored');
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
          const { birthtime } = fs.statSync(`${STORAGE_PATH}/${path}/${folder}/${filename}`);
          output.push({ name: folder, filename, key: `${path}/${folder}/${filename}`, birthtime });
        });
      }
      return output.sort((a, b) => (a.birthtime < b.birthtime ? 1 : -1));
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

module.exports.save = () => {
  return {
    matches: async (id, matches) => {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const tmp = `/tmp/{${uuidv4()}}.jpg`;
        await this.writer(fs.createReadStream(match.tmp), tmp);
        const destination = `${STORAGE_PATH}/matches/${match.name}/${match.filename}`;
        this.writeMatches(match.name, tmp, destination);
        // await this.writeExif(destination, match);
      }
    },
    unknown: async (results) => {
      const files = [];
      for (let i = 0; i < results.length; i++) {
        const group = results[i];
        for (let j = 0; j < group.results.length; j++) {
          const attempt = group.results[j];
          if (attempt.misses.length && !files.filter((obj) => attempt.tmp === obj.tmp).length) {
            files.push({ tmp: attempt.tmp, filename: attempt.filename });
          }
        }
      }
      for (let i = 0; i < files.length; i++) {
        const destination = `${STORAGE_PATH}/matches/unknown/${files[i].filename}`;
        this.copy(files[i].tmp, destination);
        // await this.writeExif(destination, files[i]);
      }
    },
  };
};

module.exports.writeExif = async (destination, data) => {
  const exiftool = new ExifTool({ taskTimeoutMillis: 1000 });
  const exif = data;
  delete exif.tmp;
  await exiftool.write(destination, { UserComment: JSON.stringify({ ...exif }) }, [
    '-overwrite_original',
  ]);
  exiftool.end();
};
