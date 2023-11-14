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
  let size = 0;
  let logs = '';

  const messageLogPath = `${STORAGE.PATH}/messages.log`;

  if (fs.existsSync(messageLogPath)) {
    size += fs.statSync(messageLogPath).size;
    logs += await readLastLines.read(messageLogPath, UI.LOGS.LINES);
  }

  res.send({
    size: bytesToSize(size),
    logs,
  });
};

module.exports.remove = async (req, res) => {
  fs.writeFileSync(`${STORAGE.PATH}/messages.log`, '');
  res.send();
};
