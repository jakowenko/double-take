const axios = require('axios');
const { COMPREFACE_URL, COMPREFACE_API_KEY, CONFIDENCE } = require('../../constants');

module.exports.recognize = (formData) =>
  axios({
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

module.exports.normalize = ({ data, duration, attempt }) => {
  const normalized = data.result.map((obj) => {
    const [face] = obj.faces;
    const confidence = parseFloat((face.similarity * 100).toFixed(2));
    return {
      attempt,
      duration,
      name: face.face_name.toLowerCase(),
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
