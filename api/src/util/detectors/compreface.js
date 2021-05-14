const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { CONFIDENCE, DETECTORS, OBJECTS } = require('../../constants');

module.exports.config = () => {
  return DETECTORS.COMPREFACE;
};

module.exports.recognize = (key) => {
  const { URL, KEY } = this.config();
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/recognize`,
    validateStatus() {
      return true;
    },
    params: {
      det_prob_threshold: 0.8,
    },
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const { URL, KEY } = this.config();
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/faces`,
    params: {
      subject: name,
    },
    data: formData,
  });
};

module.exports.remove = ({ name }) => {
  const { URL, KEY } = this.config();
  return axios({
    method: 'delete',
    headers: {
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/faces`,
    params: {
      subject: name,
    },
    validateStatus() {
      return true;
    },
  });
};

module.exports.normalize = ({ data }) => {
  if (data.code === 28) return [];
  const { MIN_AREA_MATCH } = OBJECTS.FACE;
  const normalized = data.result.map((obj) => {
    const [face] = obj.subjects;
    const confidence = face ? parseFloat((face.similarity * 100).toFixed(2)) : 0;
    const { box } = obj;
    return {
      name: face && confidence >= CONFIDENCE.UNKNOWN ? face.subject.toLowerCase() : 'unknown',
      confidence,
      match:
        confidence >= CONFIDENCE.MATCH &&
        (box.x_max - box.x_min) * (box.y_max - box.y_min) >= MIN_AREA_MATCH,
      box: {
        top: box.y_min,
        left: box.x_min,
        width: box.x_max - box.x_min,
        height: box.y_max - box.y_min,
      },
    };
  });
  return normalized;
};
