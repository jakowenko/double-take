const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { DETECTORS, CONFIDENCE } = require('../../constants');

module.exports.config = () => {
  return DETECTORS.FACEBOX;
};

module.exports.recognize = (key) => {
  const { URL } = this.config();
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
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
  const { URL } = this.config();
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
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
  const { URL } = this.config();
  return axios({
    method: 'delete',
    url: `${URL}/facebox/teach/${name}`,
    validateStatus() {
      return true;
    },
  });
};

module.exports.normalize = ({ data }) => {
  const normalized = data.faces.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    const { rect: box } = obj;
    return {
      name: obj.matched && confidence >= CONFIDENCE.UNKNOWN ? obj.name.toLowerCase() : 'unknown',
      confidence,
      match: obj.matched && confidence >= CONFIDENCE.MATCH,
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
