module.exports.lowercaseKeys = (obj) =>
  Object.keys(obj).reduce((acc, key) => {
    acc[key.toLowerCase()] = obj[key];
    return acc;
  }, {});

module.exports.oxfordComma = (array) =>
  array.length > 2
    ? array
        .slice(0, array.length - 1)
        .concat(`and ${array.slice(-1)}`)
        .join(', ')
    : array.join(' and ');

module.exports.ip = () => {
  try {
    // eslint-disable-next-line global-require
    return Object.values(require('os').networkInterfaces())
      .flat()
      .find((i) => i.family === 'IPv4' && !i.internal).address;
  } catch (error) {
    return false;
  }
};
