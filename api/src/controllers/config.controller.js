const fs = require('fs');
const yaml = require('js-yaml');
const yamlTypes = require('../util/yaml-types.util');
const redact = require('../util/redact-secrets.util');
const config = require('../constants/config');
const { ui } = require('../constants/ui');
const { BAD_REQUEST } = require('../constants/http-status');
const { STORAGE } = require('../constants')();

module.exports.get = async (req, res) => {
  const { format } = req.query;
  let output = {};
  if (format === 'yaml') output = fs.readFileSync(`${STORAGE.CONFIG.PATH}/config.yml`, 'utf8');
  else if (format === 'yaml-with-defaults') output = yaml.dump(config());
  else if (req.query.redact === '') output = redact(config());
  else output = config();
  res.send(output);
};

module.exports.secrets = {
  get: async (req, res) => {
    const output = fs.readFileSync(
      `${STORAGE.SECRETS.PATH}/secrets.${STORAGE.SECRETS.EXTENSION}`,
      'utf8'
    );
    res.send(output);
  },
  patch: (req, res) => {
    try {
      const { code } = req.body;
      yaml.load(code, { schema: yamlTypes() });
      fs.writeFileSync(`${STORAGE.SECRETS.PATH}/secrets.${STORAGE.SECRETS.EXTENSION}`, code);
      res.send();
    } catch (error) {
      if (error.name === 'YAMLException') return res.status(BAD_REQUEST).send(error);
      res.send(error);
    }
  },
};

module.exports.theme = {
  get: async (req, res) => {
    const settings = config();
    res.setHeader('Content-Type', 'application/json');
    res.send({ theme: settings.ui.theme, editor: settings.ui.editor });
  },
  patch: (req, res) => {
    const { ui: theme, editor } = req.body;
    ui.set({ theme, editor: { theme: editor } });
    config.set.ui({ theme, editor: { theme: editor } });
    // Set Content-Type header to 'application/json'
    res.setHeader('Content-Type', 'application/json');
    res.send();
  },
};


module.exports.patch = async (req, res) => {
  try {
    const { code } = req.body;
    yaml.load(code, { schema: yamlTypes() });
    fs.writeFileSync(`${STORAGE.CONFIG.PATH}/config.yml`, code);
    res.send();
  } catch (error) {
    if (error.name === 'YAMLException') return res.status(BAD_REQUEST).send(error);
    res.send(error);
  }
};
