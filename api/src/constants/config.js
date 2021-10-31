const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const { objectKeysToUpperCase } = require('../util/object.util');
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

  if (!CONFIG.auth) delete DEFAULTS.token;
  if (!CONFIG.frigate) delete DEFAULTS.frigate;
  if (!CONFIG.mqtt) delete DEFAULTS.mqtt;
  CONFIG = _.isEmpty(CONFIG) ? DEFAULTS : _.mergeWith(DEFAULTS, CONFIG, customizer);
  if (CONFIG?.notify?.gotify)
    CONFIG.notify.gotify = _.mergeWith(NOTIFY.gotify, CONFIG.notify.gotify, customizer);

  if (CONFIG.detectors)
    for (const [key] of Object.entries(CONFIG.detectors)) {
      CONFIG.detectors[key] = _.mergeWith(DETECTORS[key], CONFIG.detectors[key], customizer);
    }

  CONFIG = _.mergeWith(CONFIG, SYSTEM_CORE);
  CONFIG.version = version;
  return CONFIG;
};

module.exports.setup = () => {
  const { ui } = require('./ui');
  const { theme, editor } = ui.create({ theme: CONFIG.ui.theme, editor: CONFIG.ui.editor });
  CONFIG.ui.theme = theme;
  CONFIG.ui.editor = editor;
};

module.exports.set = {
  ui: ({ theme, editor }) => {
    CONFIG.ui.theme = theme;
    CONFIG.ui.editor = editor;
  },
};

module.exports.detectors = () => {
  const results = [];
  if (CONFIG.detectors)
    for (const [detector] of Object.entries(CONFIG.detectors)) results.push(detector);
  return results;
};

module.exports.detect = (camera) => {
  const detect = JSON.parse(JSON.stringify(CONFIG.detect));
  if (!camera) return objectKeysToUpperCase(detect);
  delete detect.match.purge;
  delete detect.unknown.purge;
  _.mergeWith(detect, CONFIG.cameras?.[camera]?.detect || {}, customizer);
  return objectKeysToUpperCase(detect);
};

module.exports.masks = (camera) => {
  let masks = false;
  if (CONFIG.cameras?.[camera]?.masks?.coordinates) masks = CONFIG.cameras[camera].masks;
  return masks;
};

module.exports.notify = () => {
  const results = [];
  if (CONFIG.notify) for (const [notify] of Object.entries(CONFIG.notify)) results.push(notify);
  return results;
};

module.exports.frigate = ({ id, camera, topic }) => {
  const { topicURL } = require('../util/frigate.util');
  const { url, events, attempts, image } = JSON.parse(JSON.stringify(CONFIG.frigate));
  const { masks } = module.exports;

  _.mergeWith(image, events?.[camera]?.image || {}, customizer);
  _.mergeWith(attempts, events?.[camera]?.attempts || {}, customizer);

  const snapshot =
    image.snapshot ||
    (masks(camera)
      ? `${topicURL(topic)}/api/events/${id}/snapshot.jpg?h=${image.height}`
      : `${topicURL(topic)}/api/events/${id}/snapshot.jpg?h=${image.height}&crop=1`);

  const latest = image.latest || `${topicURL(topic)}/api/${camera}/latest.jpg?h=${image.height}`;

  return objectKeysToUpperCase({
    url: { frigate: url, snapshot, latest },
    attempts,
  });
};
