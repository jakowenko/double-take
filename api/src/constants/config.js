const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const defaults = require('./defaults');
const { version } = require('../../package.json');

let config = false;

const customizer = (objValue, srcValue) => {
  if (_.isNull(srcValue)) {
    return objValue;
  }
};

module.exports = () => {
  if (config) return config;

  config = {};
  try {
    config = { ...yaml.load(fs.readFileSync(`${__dirname}/../../../config.yml`, 'utf8')) };
    // eslint-disable-next-line no-empty
  } catch (error) {}

  config = _.isEmpty(config) ? defaults : _.mergeWith(defaults, config, customizer);
  config.storage = { path: './.storage', ...config.storage };
  config.version = version;
  config = _(config).toPairs().sortBy(0).fromPairs().value();
  return config;
};
