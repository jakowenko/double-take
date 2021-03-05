const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const logger = require('./logger.util');

const {
  COMPREFACE_URL,
  FACEBOX_URL,
  COMPREFACE_API_KEY,
  STORAGE_PATH,
  DETECTORS,
} = require('../constants');

module.exports.data = async () => {
  const tmpImages = [];
  let tmpFolders = await fs.promises.readdir(`${STORAGE_PATH}/names`);
  tmpFolders = tmpFolders.filter((folder) => folder.toUpperCase() !== '.DS_STORE');
  for (const folder of tmpFolders) {
    const files = await fs.promises.readdir(`${STORAGE_PATH}/names/${folder}`);
    const images = files.filter(
      (file) => file.toLowerCase().includes('.jpg') || file.toLowerCase().includes('.png')
    );
    images.forEach((image) => {
      image = `${STORAGE_PATH}/names/${folder}/${image}`;
      tmpImages.push({ name: folder, file: image });
    });
  }

  return { names: tmpFolders, files: tmpImages };
};

module.exports.queue = async (files) => {
  const outputs = [];
  logger.log(`queuing ${files.length} file(s) for training`);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    logger.log(`file ${i + 1}: ${file.name} - ${path.basename(file.file)}`);
    const output = { file: file.file };
    const promises = [];
    DETECTORS.forEach((detector) => {
      promises.push(this.train({ name: file.name, file: file.file, detector }));
    });
    const results = await Promise.all(promises);
    results.forEach((result, j) => {
      output[DETECTORS[j]] = result;
    });
    outputs.push(output);
  }
  logger.log('training complete');
  return outputs;
};

module.exports.train = async ({ name, file, detector }) => {
  const formData = new FormData();

  try {
    if (detector === 'compreface') {
      formData.append('file', fs.createReadStream(file));
      const request = await axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
          'x-api-key': COMPREFACE_API_KEY,
        },
        url: `${COMPREFACE_URL}/api/v1/faces`,
        params: {
          subject: name,
        },
        data: formData,
      });
      return request.data;
    }

    if (detector === 'facebox') {
      formData.append('file', fs.createReadStream(file));
      const request = await axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
        },
        url: `${FACEBOX_URL}/facebox/teach`,
        params: {
          name,
          id: path.basename(file),
        },
        data: formData,
      });
      return request.data;
    }
  } catch (error) {
    if (error.response.data.message) {
      logger.log(`${detector} training error: ${error.response.data.message}`);
    } else if (error.response.data.error) {
      logger.log(`${detector} training error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} training error: ${error.message}`);
    }
    return error.response.data;
  }
};

module.exports.remove = async ({ names, detector, files }) => {
  if (detector === 'compreface') {
    const output = [];
    for (let i = 0; i < names.length; i++) {
      const request = await axios({
        method: 'delete',
        headers: {
          'x-api-key': COMPREFACE_API_KEY,
        },
        url: `${COMPREFACE_URL}/api/v1/faces`,
        params: {
          subject: names[i],
        },
      });
      output.push(request.data);
    }
    return output;
  }
  if (detector === 'facebox') {
    const output = [];
    for (let i = 0; i < files.length; i++) {
      const file = path.basename(files[i].file);
      const request = await axios({
        method: 'delete',
        url: `${FACEBOX_URL}/facebox/teach/${file}`,
        validateStatus() {
          return true;
        },
      });
      output.push(request.data);
    }
    return output;
  }
};
