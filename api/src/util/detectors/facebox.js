const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { FACEBOX_URL, CONFIDENCE } = require('../../constants');

module.exports.recognize = (key) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${FACEBOX_URL}/facebox/check`,
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
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
};

module.exports.remove = ({ name }) =>
  axios({
    method: 'delete',
    url: `${FACEBOX_URL}/facebox/teach/${name}`,
    validateStatus() {
      return true;
    },
  });

module.exports.normalize = ({ data, duration, attempt }) => {
  const normalized = data.faces.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    const { rect: box } = obj;
    return {
      attempt,
      duration,
      name: obj.matched ? obj.name.toLowerCase() : 'unknown',
      confidence,
      match: obj.matched && confidence >= CONFIDENCE,
      box: {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      },
    };
  });
  return normalized;
};
