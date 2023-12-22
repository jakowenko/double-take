const axios = require('axios');
const { oxfordComma } = require('../helpers.util');
const { SERVER, UI } = require('../../constants')();
const { TELEGRAM } = require('../../constants')().NOTIFY || {};
const FormData = require('form-data');

module.exports.send = async (output) => {
  const { filename, message } = this.normalize(output);
  const { data: buffer } = await axios({
    method: 'get',
    url: `http://${SERVER.HOST}:${SERVER.PORT}${UI.PATH}/api/storage/matches/${filename}?box=true`,
    responseType: 'arraybuffer',
  });

  const photoData = buffer.toString('base64');
  const formData = new FormData();
  formData.append('chat_id', TELEGRAM.CHAT_ID);
  formData.append('caption', message);
  formData.append('photo', Buffer.from(photoData, 'base64'), {
    filename: 'photo.jpg',
    contentType: 'image/jpeg',
  });

  return axios({
    method: 'post',
    url: `https://api.telegram.org/bot${TELEGRAM.TOKEN}/sendPhoto`,
    headers: formData.getHeaders(),
    data: formData,
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
