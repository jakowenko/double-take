const axios = require('axios');
const { oxfordComma } = require('../helpers.util');
const { SERVER } = require('../../constants');
const { GOTIFY } = require('../../constants').NOTIFY;

module.exports.send = async (output) => {
  const { filename, message } = this.normalize(output);
  return axios({
    method: 'post',
    url: `${GOTIFY.URL}/message?token=${GOTIFY.TOKEN}`,
    data: {
      message,
      priority: GOTIFY.PRIORITY,
      extras: {
        'client::display': {
          contentType: 'text/markdown',
        },
        'client::notification': {
          click: { url: `http://0.0.0.0:${SERVER.PORT}/api/storage/matches/${filename}?box=true` },
        },
      },
    },
  });
};

module.exports.normalize = (output) => {
  const { camera, matches, unknown } = output;
  const results = [];
  const filename = matches.length ? matches[0].filename : unknown.filename;
  matches.forEach((match) => {
    results.push(`${match.name} - ${match.confidence}%`);
  });
  if (unknown && Object.keys(unknown).length) {
    results.push('unknown');
  }
  const message = `${camera}: ${oxfordComma(results)}`;

  return { filename, message };
};
