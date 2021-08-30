const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const { detectors: DETECTORS, notify: NOTIFY, ...DEFAULTS } = require('./defaults');
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

  CONFIG = _.isEmpty(CONFIG) ? DEFAULTS : _.mergeWith(DEFAULTS, CONFIG, customizer);
  if (CONFIG?.notify?.gotify)
    CONFIG.notify.gotify = _.mergeWith(NOTIFY.gotify, CONFIG.notify.gotify, customizer);
  if (CONFIG?.detectors?.compreface)
    CONFIG.detectors.compreface = _.mergeWith(
      DETECTORS.compreface,
      CONFIG.detectors.compreface,
      customizer
    );
  CONFIG = _.mergeWith(CONFIG, SYSTEM_CORE);
  CONFIG.version = version;
  return CONFIG;
};

module.exports.detectors = () => {
  const results = [];
  if (CONFIG.detectors)
    for (const [detector] of Object.entries(CONFIG.detectors)) results.push(detector);
  return results;
};

module.exports.masks = () => {
  const results = [];
  if (CONFIG.masks)
    for (const [mask] of Object.entries(CONFIG.masks))
      results.push({ camera: mask, ...CONFIG.masks[mask] });
  return results;
};

module.exports.notify = () => {
  const results = [];
  if (CONFIG.notify) for (const [notify] of Object.entries(CONFIG.notify)) results.push(notify);
  return results;
};
