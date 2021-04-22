const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { COMPREFACE_URL, COMPREFACE_API_KEY, CONFIDENCE } = require('../../constants');

module.exports.recognize = (key) => {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
      'x-api-key': COMPREFACE_API_KEY,
    },
    url: `${COMPREFACE_URL}/api/v1/faces/recognize`,
    params: {
      det_prob_threshold: 0.8,
    },
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
      'x-api-key': COMPREFACE_API_KEY,
    },
    url: `${COMPREFACE_URL}/api/v1/faces`,
    params: {
      subject: name,
    },
    data: formData,
  });
};

module.exports.remove = ({ name }) =>
  axios({
    method: 'delete',
    headers: {
      'x-api-key': COMPREFACE_API_KEY,
    },
    url: `${COMPREFACE_URL}/api/v1/faces`,
    params: {
      subject: name,
    },
    validateStatus() {
      return true;
    },
  });

module.exports.normalize = ({ data }) => {
  const normalized = data.result.map((obj) => {
    const [face] = obj.faces;
    const confidence = face ? parseFloat((face.similarity * 100).toFixed(2)) : 0;
    return {
      name: face ? face.face_name.toLowerCase() : 'unknown',
      confidence,
      match: confidence >= CONFIDENCE,
      box: {
        top: obj.box.y_min,
        left: obj.box.x_min,
        width: obj.box.x_max - obj.box.x_min,
        height: obj.box.y_max - obj.box.y_min,
      },
    };
  });
  return normalized;
};
