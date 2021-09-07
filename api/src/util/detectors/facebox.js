const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const actions = require('./actions');
const { doesUrlResolve } = require('../validators.util');
const { DETECTORS, CONFIDENCE, OBJECTS } = require('../../constants');

const { FACEBOX } = DETECTORS || {};

module.exports.recognize = async ({ test, key }) => {
  const { URL } = FACEBOX;
  if (test && !(await doesUrlResolve(URL))) {
    return { status: 404 };
  }
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    timeout: 15 * 1000,
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
    timeout: 15 * 1000,
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
    timeout: 15 * 1000,
    url: `${URL}/facebox/teach/${name}`,
    validateStatus() {
      return true;
    },
  });
};

module.exports.normalize = ({ data }) => {
  const { MIN_AREA_MATCH } = OBJECTS.FACE;
  const normalized = data.faces.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    const { rect: box } = obj;
    const output = {
      name: obj.matched && confidence >= CONFIDENCE.UNKNOWN ? obj.name.toLowerCase() : 'unknown',
      confidence,
      match:
        obj.matched && confidence >= CONFIDENCE.MATCH && box.width * box.height >= MIN_AREA_MATCH,
      box: {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      },
    };
    const checks = actions.checks(output);
    if (checks.length) output.checks = checks;
    return output;
  });
  return normalized;
};
