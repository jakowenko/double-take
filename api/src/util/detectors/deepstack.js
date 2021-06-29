const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { CONFIDENCE, DETECTORS, OBJECTS } = require('../../constants');

module.exports.config = () => {
  return DETECTORS.DEEPSTACK;
};

module.exports.recognize = (key) => {
  const { URL, KEY } = this.config();
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  formData.append('api_key', KEY);
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
  const { URL, KEY } = this.config();
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  formData.append('userid', name);
  formData.append('api_key', KEY);
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
  const { URL, KEY } = this.config();
  const formData = new FormData();
  formData.append('userid', name);
  formData.append('api_key', KEY);
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
  if (data.success === false) return [];
  const { MIN_AREA_MATCH } = OBJECTS.FACE;
  const normalized = data.predictions.map((obj) => {
    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    return {
      name: confidence >= CONFIDENCE.UNKNOWN ? obj.userid.toLowerCase() : 'unknown',
      confidence,
      match:
        obj.userid !== 'unknown' &&
        confidence >= CONFIDENCE.MATCH &&
        (obj.x_max - obj.x_min) * (obj.y_max - obj.y_min) >= MIN_AREA_MATCH,
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
