const axios = require('axios');
const { oxfordComma } = require('../helpers.util');
const { SERVER, UI } = require('../../constants')();
const { GOTIFY } = require('../../constants')().NOTIFY || {};

module.exports.send = async (output) => {
  const { filename, message } = this.normalize(output);
  const { data: buffer } = await axios({
    method: 'get',
    url: `http://${SERVER.HOST}:${SERVER.PORT}${UI.PATH}/api/storage/matches/${filename}?box=true`,
    responseType: 'arraybuffer',
  });
  return axios({
    method: 'post',
    url: `${GOTIFY.URL}/message?token=${GOTIFY.TOKEN}`,
    data: {
      message: `${message} ![Camera Image](data:image/jpeg;base64,${buffer.toString('base64')})`,
      priority: GOTIFY.PRIORITY,
      extras: {
        'client::display': {
          contentType: 'text/markdown',
        },
        'client::notification': {
          click: { url: `data:image/jpeg;base64,${buffer.toString('base64')}` },
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
