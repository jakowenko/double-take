const _ = require('lodash');

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

const key = (str) => KEYS.some((regex) => regex.test(str));

const traverse = (obj, value) => {
  if (!_.isObject(obj)) return obj;
  const o = JSON.parse(JSON.stringify(obj));
  Object.keys(o).forEach((k) => {
    if (o[k] !== null && typeof o[k] === 'object') o[k] = traverse(o[k], value);
    if (typeof o[k] === 'string') if (key(k)) o[k] = value;
  });
  return o;
};

module.exports = (obj, value = '********') => traverse(obj, value);
