const fs = require('fs');
const yaml = require('js-yaml');
const redact = require('../util/redact-secrets.util');
const config = require('../constants/config');
const { BAD_REQUEST } = require('../constants/http-status');
const { STORAGE } = require('../constants');

module.exports.get = async (req, res) => {
  const { format } = req.query;
  const isLegacyPath = fs.existsSync('./config.yml');
  const output =
    format === 'yaml'
      ? fs.readFileSync(isLegacyPath ? './config.yml' : `${STORAGE.CONFIG.PATH}/config.yml`, 'utf8')
      : req.query.redact === ''
      ? redact(config())
      : config();
  res.send(output);
};

module.exports.patch = async (req, res) => {
  try {
    const isLegacyPath = fs.existsSync('./config.yml');
    const { code } = req.body;
    yaml.load(code);
    fs.writeFileSync(isLegacyPath ? './config.yml' : `${STORAGE.CONFIG.PATH}/config.yml`, code);
    res.send();
  } catch (error) {
    if (error.name === 'YAMLException') return res.status(BAD_REQUEST).send(error);
    res.send(error);
  }
};
