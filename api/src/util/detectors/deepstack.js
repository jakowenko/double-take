const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { DEEPSTACK_URL, CONFIDENCE } = require('../../constants');

module.exports.recognize = (key) => {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${DEEPSTACK_URL}/v1/vision/face/recognize`,
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  formData.append('userid', name);
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${DEEPSTACK_URL}/v1/vision/face/register`,
    data: formData,
  });
};

module.exports.remove = ({ name }) => {
  const formData = new FormData();
  formData.append('userid', name);
  return axios({
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
};

module.exports.normalize = ({ data, duration, attempt }) => {
  const normalized = data.predictions.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    return {
      attempt,
      duration,
      name: obj.userid.toLowerCase(),
      confidence,
      match: obj.userid !== 'unknown' && confidence >= CONFIDENCE,
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
