const axios = require('axios');
const { DEEPSTACK_URL, CONFIDENCE } = require('../../constants');

module.exports.recognize = (formData) =>
  axios({
    method: 'post',
    headers: {
      ...formData.getHeaders(),
    },
    url: `${DEEPSTACK_URL}/v1/vision/face/recognize`,
    data: formData,
  });

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
