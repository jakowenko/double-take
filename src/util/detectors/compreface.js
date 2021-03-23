const axios = require('axios');
const { COMPREFACE_URL, COMPREFACE_API_KEY } = require('../../constants');

module.exports.recognize = (formData) => axios({
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
    })