const fs = require('fs');
const readLastLines = require('read-last-lines');
const { STORAGE, UI } = require('../constants')();

const bytesToSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
  return `${Math.round(bytes / 1024 ** i, 2)} ${sizes[i]}`;
};

module.exports.get = async (req, res) => {
  const { size } = fs.statSync(`${STORAGE.PATH}/messages.log`);
  const logs = await readLastLines.read(`${STORAGE.PATH}/messages.log`, UI.LOGS.LINES);

  res.send({
    size: bytesToSize(size),
    logs,
  });
};

module.exports.remove = async (req, res) => {
  fs.writeFileSync(`${STORAGE.PATH}/messages.log`, '');
  res.send();
};
