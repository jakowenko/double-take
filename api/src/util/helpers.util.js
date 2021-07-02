module.exports.contains = (a, b) => {
  return !(
    b.left < a.left ||
    b.top < a.top ||
    b.left + b.width > a.left + a.width ||
    b.top + b.height > a.top + a.height
  );
};

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
