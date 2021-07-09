const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const DEFAULTS = require('./defaults');
const { core: SYSTEM_CORE } = require('./system');
const { version } = require('../../package.json');

let CONFIG = false;

const customizer = (objValue, srcValue) => {
  if (_.isNull(srcValue)) {
    return objValue;
  }
};

const loadYaml = (file) => {
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return error;
  }
};

const setup = (file, message) => {
  if (!fs.existsSync(SYSTEM_CORE.storage.config.path))
    fs.mkdirSync(SYSTEM_CORE.storage.config.path, { recursive: true });
  fs.writeFileSync(`${SYSTEM_CORE.storage.config.path}/${file}`, message);
};

module.exports = () => {
  if (CONFIG) return CONFIG;

  CONFIG = {};

  const isLegacyPath = fs.existsSync('./config.yml');
  if (isLegacyPath)
    console.warn(
      'config.yml file loaded from legacy path, this will be removed in a future update'
    );

  const configData = loadYaml(
    isLegacyPath ? './config.yml' : `${SYSTEM_CORE.storage.config.path}/config.yml`
  );
  if (configData && configData.code === 'ENOENT') setup('config.yml', '# Double Take');
  else CONFIG = { ...configData };

  if (!CONFIG.notify || !CONFIG.notify.gotify) delete DEFAULTS.notify.gotify;

  CONFIG = _.isEmpty(CONFIG) ? DEFAULTS : _.mergeWith(DEFAULTS, CONFIG, customizer);
  CONFIG = _.mergeWith(CONFIG, SYSTEM_CORE);
  CONFIG.version = version;
  CONFIG = _(CONFIG).toPairs().sortBy(0).fromPairs().value();
  return CONFIG;
};
