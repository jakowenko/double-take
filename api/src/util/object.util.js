module.exports.objectKeysToUpperCase = (input) => {
  const self = module.exports.objectKeysToUpperCase;
  if (input === null) return input;
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(self);
  return Object.keys(input).reduce((newObj, key) => {
    const val = input[key];
    const newVal = typeof val === 'object' ? self(val) : val;
    newObj[key.toUpperCase()] = newVal;
    return newObj;
  }, {});
};
