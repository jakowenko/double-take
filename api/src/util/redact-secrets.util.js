const traverse = require('traverse');

const KEYS = [
  // generic
  /passw(or)?d/i,
  /key/,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
  /session[-._]?id/i,
  // specific
  /^connect\.sid$/, // https://github.com/expressjs/session
];

const key = (str) =>
  KEYS.some((regex) => {
    return regex.test(str);
  });

module.exports = (obj, value = '********') => {
  // eslint-disable-next-line array-callback-return
  return traverse(obj).map(function redact(val) {
    if (key(this.key) && typeof val === 'string') this.update(value);
  });
};
