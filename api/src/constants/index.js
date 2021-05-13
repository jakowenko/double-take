const config = require('./config');

const objectKeysToUpperCase = (input) => {
  if (input === null) return input;
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(objectKeysToUpperCase);
  return Object.keys(input).reduce((newObj, key) => {
    const val = input[key];
    const newVal = typeof val === 'object' ? objectKeysToUpperCase(val) : val;
    newObj[key.toUpperCase()] = newVal;
    return newObj;
  }, {});
};

module.exports = objectKeysToUpperCase(config());
