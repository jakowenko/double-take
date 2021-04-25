const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const perf = require('execution-time')();
const time = require('./time.util');
const logger = require('./logger.util');
const database = require('./db.util');

const {
  COMPREFACE_URL,
  FACEBOX_URL,
  COMPREFACE_API_KEY,
  DETECTORS,
  PORT,
  DEEPSTACK_URL,
} = require('../constants');

module.exports.queue = async (files) => {
  try {
    perf.start();
    logger.log(`${time.current()}\nqueuing ${files.length} file(s) for training`);

    const inserts = [];
    const outputs = [];
    for (let i = 0; i < files.length; i++) {
      const output = {
        detectors: [],
      };
      const promises = [];
      const { id, name, filename, key, uuid } = files[i];
      logger.log(`file ${i + 1}: ${name} - ${filename}`);

      DETECTORS.forEach((detector) => {
        promises.push(this.train({ name, key, detector }));
      });
      const results = await Promise.all(promises);

      results.forEach((result, j) => {
        output.uuid = uuid;
        output.key = key;
        output.base64 = Buffer.from(fs.readFileSync(key)).toString('base64');
        output.url = `http://0.0.0.0:${PORT}/storage/train/${name}/${filename}`;
        output.detectors.push(result);
        inserts.push({
          fileId: id,
          name,
          filename,
          meta: JSON.stringify(result),
          detector: DETECTORS[j],
        });
      });
      outputs.push(output);
    }
    database.insert('train', inserts);
    logger.log(`training complete in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`);
    return outputs;
  } catch (error) {
    logger.log(`queue error: ${error.message}`);
  }
};

module.exports.train = async ({ name, key, detector }) => {
  const formData = new FormData();
  let request;

  try {
    if (detector === 'compreface') {
      formData.append('file', fs.createReadStream(key));
      request = await axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
          'x-api-key': COMPREFACE_API_KEY,
        },
        url: `${COMPREFACE_URL}/api/v1/recognition/faces`,
        params: {
          subject: name,
        },
        data: formData,
      });
    }

    if (detector === 'facebox') {
      formData.append('file', fs.createReadStream(key));
      request = await axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
        },
        url: `${FACEBOX_URL}/facebox/teach`,
        params: {
          name,
          id: name,
        },
        data: formData,
      });
    }

    if (detector === 'deepstack') {
      formData.append('image', fs.createReadStream(key));
      formData.append('userid', name);
      request = await axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
        },
        url: `${DEEPSTACK_URL}/v1/vision/face/register`,
        data: formData,
      });
    }

    const { status, data } = request;
    return {
      ...data,
      status,
      detector,
    };
  } catch (error) {
    if (error.response.data.message) {
      logger.log(`${detector} training error: ${error.response.data.message}`);
    } else if (error.response.data.error) {
      logger.log(`${detector} training error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} training error: ${error.message}`);
    }
    const { status, data } = error.response;
    return {
      ...data,
      status,
      detector,
    };
  }
};

module.exports.remove = async ({ detector, name }) => {
  if (detector === 'compreface') {
    const request = await axios({
      method: 'delete',
      headers: {
        'x-api-key': COMPREFACE_API_KEY,
      },
      url: `${COMPREFACE_URL}/api/v1/recognition/faces`,
      params: {
        subject: name,
      },
      validateStatus() {
        return true;
      },
    });
    return request.data;
  }
  if (detector === 'facebox') {
    const request = await axios({
      method: 'delete',
      url: `${FACEBOX_URL}/facebox/teach/${name}`,
      validateStatus() {
        return true;
      },
    });
    return request.data;
  }
  if (detector === 'deepstack') {
    const formData = new FormData();
    formData.append('userid', name);
    const request = await axios({
      method: 'post',
      url: `${DEEPSTACK_URL}/v1/vision/face/delete`,
      headers: {
        ...formData.getHeaders(),
      },
      validateStatus() {
        return true;
      },
      data: formData,
    });
    return request.data;
  }
};

module.exports.cleanup = (results) => {
  const db = database.connect();
  results.forEach((result) => {
    const notFound = [];
    result.detectors.forEach((detector) => {
      const { success, code } = detector;
      if (success === false || code === 28) notFound.push(true);
    });
    if (notFound.length === result.detectors.length && fs.existsSync(result.key)) {
      fs.unlinkSync(result.key);
      db.prepare(`UPDATE file SET isActive = 0 WHERE uuid = ?`).run(result.uuid);
    }
  });
};
