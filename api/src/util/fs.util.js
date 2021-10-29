const fs = require('fs');
const axios = require('axios');
const time = require('./time.util');
const { jwt } = require('./auth.util');
const { AUTH, STORAGE } = require('../constants')();

module.exports.folders = () => {
  return {
    matches: async () => {
      let folders = await fs.promises.readdir(`${STORAGE.MEDIA.PATH}/matches`, {
        withFileTypes: true,
      });
      folders = folders
        .filter((file) => file.isDirectory() && file.name !== 'unknown')
        .map((file) => file.name);
      return folders;
    },
    train: async () => {
      let folders = await fs.promises.readdir(`${STORAGE.MEDIA.PATH}/train`, {
        withFileTypes: true,
      });
      folders = folders.filter((file) => file.isDirectory()).map((file) => file.name);
      return folders;
    },
  };
};

module.exports.files = {
  traverse: async (path) => {
    const output = [];
    let folders = await fs.promises.readdir(`${STORAGE.MEDIA.PATH}/${path}`, {
      withFileTypes: true,
    });
    folders = folders.filter((file) => file.isDirectory()).map((file) => file.name);

    for (const folder of folders) {
      let images = await fs.promises.readdir(`${STORAGE.MEDIA.PATH}/${path}/${folder}`, {
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
        const { birthtime } = fs.statSync(`${STORAGE.MEDIA.PATH}/${path}/${folder}/${filename}`);
        output.push({ name: folder, filename, key: `${path}/${folder}/${filename}`, birthtime });
      });
    }
    return output.sort((a, b) => (a.birthtime < b.birthtime ? 1 : -1));
  },
  train: async (name) => {
    const files = await this.files.traverse('train');
    return name ? files.filter((obj) => obj.name === name) : files;
  },
  matches: async () => {
    return this.files.traverse('matches');
  },
};

module.exports.writer = async (file, data) => {
  fs.writeFileSync(file, data);
};

module.exports.writerStream = async (stream, file) => {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(file);
    stream.pipe(out);
    out
      .on('finish', () => {
        resolve();
      })
      .on('error', (error) => {
        console.error(`writer error: ${error.message}`);
      });
  });
};

module.exports.writeMatches = (name, source, destination) => {
  try {
    if (!fs.existsSync(`${STORAGE.MEDIA.PATH}/matches/${name}`)) {
      fs.mkdirSync(`${STORAGE.MEDIA.PATH}/matches/${name}`);
    }
    fs.copyFile(source, destination, (error) => {
      if (error) {
        console.error(`write match error: ${error.message}`);
      }
    });
  } catch (error) {
    error.message = `create match folder error: ${error.message}`;
    console.error(error);
  }
};

module.exports.copy = (source, destination) => {
  fs.copyFile(source, destination, (error) => {
    if (error) {
      error.message = `copy file error: ${error.message}`;
      console.error(error);
    }
  });
};

module.exports.delete = (destination) => {
  try {
    if (fs.existsSync(destination)) {
      fs.unlinkSync(destination);
    }
  } catch (error) {
    error.message = `delete error: ${error.message}`;
    console.error(error);
  }
};

module.exports.move = (source, destination) => {
  try {
    if (fs.existsSync(source)) {
      fs.renameSync(source, destination);
    }
  } catch (error) {
    error.message = `move error: ${error.message}`;
    console.error(error);
  }
};

module.exports.saveURLs = async (urls, path) => {
  const token = AUTH ? jwt.sign({ route: 'storage' }) : null;
  const files = [];
  for (let i = 0; i < urls.length; i++) {
    try {
      const validOptions = ['image/jpg', 'image/jpeg', 'image/png'];
      const url = urls[i];
      const { headers, data: buffer } = await axios({
        method: 'get',
        url: `${url}?token=${token}`,
        responseType: 'arraybuffer',
      });

      const isValid = !!validOptions.filter((opt) => headers['content-type'].includes(opt)).length;

      if (isValid) {
        let filename = url.substring(url.lastIndexOf('/') + 1);
        const ext = `.${filename.split('.').pop()}`;
        filename = `${filename.replace(ext, '')}-${time.unix()}${ext}`;
        fs.writeFileSync(`${STORAGE.MEDIA.PATH}/${path}/${filename}`, buffer);
        files.push(filename);
      }
    } catch (error) {
      error.message = `save url error: ${error.message}`;
      console.error(error);
    }
  }
  return files;
};
