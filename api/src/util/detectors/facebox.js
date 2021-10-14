const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const actions = require('./actions');
const { DETECTORS } = require('../../constants')();
const config = require('../../constants/config');

const { FACEBOX } = DETECTORS || {};

module.exports.recognize = async ({ key }) => {
  const { URL } = FACEBOX;
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    timeout: FACEBOX.TIMEOUT * 1000,
    headers: {
      ...formData.getHeaders(),
    },
    url: `${URL}/facebox/check`,
    validateStatus() {
      return true;
    },
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const { URL } = FACEBOX;
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    timeout: FACEBOX.TIMEOUT * 1000,
    headers: {
      ...formData.getHeaders(),
    },
    url: `${URL}/facebox/teach`,
    params: {
      name,
      id: name,
    },
    data: formData,
  });
};

module.exports.remove = ({ name }) => {
  const { URL } = FACEBOX;
  return axios({
    method: 'delete',
    timeout: FACEBOX.TIMEOUT * 1000,
    url: `${URL}/facebox/teach/${name}`,
    validateStatus() {
      return true;
    },
  });
};

module.exports.normalize = ({ camera, data }) => {
  if (!data.success) throw new Error(data.error);
  const { MATCH, UNKNOWN } = config.detect(camera);
  const normalized = data.faces.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    const { rect: box } = obj;
    const output = {
      name: obj.matched && confidence >= UNKNOWN.CONFIDENCE ? obj.name.toLowerCase() : 'unknown',
      confidence,
      match:
        obj.matched && confidence >= MATCH.CONFIDENCE && box.width * box.height >= MATCH.MIN_AREA,
      box: {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      },
    };
    const checks = actions.checks({ MATCH, UNKNOWN, ...output });
    if (checks.length) output.checks = checks;
    return checks !== false ? output : [];
  });
  return normalized;
};
