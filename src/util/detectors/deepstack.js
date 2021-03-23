const axios = require('axios');
const { DEEPSTACK_URL } = require('../../constants');

module.exports.recognize = (formData) => axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
        },
        url: `${DEEPSTACK_URL}/v1/vision/face/recognize`,
        data: formData,
    })