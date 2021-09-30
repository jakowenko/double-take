const config = require('./config');
const { objectKeysToUpperCase } = require('../util/object.util');

module.exports = () => objectKeysToUpperCase(config());
