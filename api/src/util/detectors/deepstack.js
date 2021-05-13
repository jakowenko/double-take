const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { CONFIDENCE, DETECTORS } = require('../../constants');

module.exports.config = () => {
  return DETECTORS.DEEPSTACK;
};

module.exports.recognize = (key) => {
  const { URL } = this.config();
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${URL}/v1/vision/face/recognize`,
    validateStatus() {
      return true;
    },
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const { URL } = this.config();
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  formData.append('userid', name);
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${URL}/v1/vision/face/register`,
    data: formData,
  });
};

module.exports.remove = ({ name }) => {
  const { URL } = this.config();
  const formData = new FormData();
  formData.append('userid', name);
  return axios({
    method: 'post',
    url: `${URL}/v1/vision/face/delete`,
    headers: {
      ...formData.getHeaders(),
    },
    validateStatus() {
      return true;
    },
    data: formData,
  });
};

module.exports.normalize = ({ data }) => {
  const normalized = data.predictions.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    return {
      name: confidence >= CONFIDENCE.UNKNOWN ? obj.userid.toLowerCase() : 'unknown',
      confidence,
      match: obj.userid !== 'unknown' && confidence >= CONFIDENCE.MATCH,
      box: {
        top: obj.y_min,
        left: obj.x_min,
        width: obj.x_max - obj.x_min,
        height: obj.y_max - obj.y_min,
      },
    };
  });
  return normalized;
};
