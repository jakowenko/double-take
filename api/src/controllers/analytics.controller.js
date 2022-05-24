const axios = require('axios');
const { TELEMETRY } = require('../constants')();

module.exports.analytics = async (req, res) => {
  if (process.env.NODE_ENV !== 'production' || !TELEMETRY) return res.send();
  const { data } = await axios({
    method: 'get',
    url: 'https://analytics.jako.io/js/script.local.js',
  }).catch((/* error */) => {
    return res.send();
  });
  res.contentType('application/javascript').send(data);
};
