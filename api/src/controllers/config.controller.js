const fs = require('fs');
const config = require('../constants/config');
const { STORAGE } = require('../constants');

module.exports.get = async (req, res) => {
  const { format } = req.query;
  const isLegacyPath = fs.existsSync('./config.yml');
  const output =
    format === 'yaml'
      ? fs.readFileSync(isLegacyPath ? './config.yml' : `${STORAGE.CONFIG.PATH}/config.yml`, 'utf8')
      : config();
  res.send(output);
};

module.exports.patch = async (req, res) => {
  const isLegacyPath = fs.existsSync('./config.yml');
  const { code } = req.body;
  fs.writeFileSync(isLegacyPath ? './config.yml' : `${STORAGE.CONFIG.PATH}/config.yml`, code);
  res.send(req.body);
};
