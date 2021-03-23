const axios = require('axios');
const { FACEBOX_URL } = require('../../constants');

module.exports.recognize = (formData) => axios({
        method: 'post',
        headers: {
          ...formData.getHeaders(),
        },
        url: `${FACEBOX_URL}/facebox/check`,
        data: formData,
    })