const jwt = require('jsonwebtoken');
const fs = require('fs');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');
const { STORAGE } = require('../constants');

module.exports.auth = {
  get: () => {
    try {
      const values = yaml.load(fs.readFileSync(`${STORAGE.PATH}/.auth`, 'utf8'));
      if (!values || !values.secret) {
        return this.auth.create(values);
      }
      return values;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return this.auth.create();
      }
    }
  },
  create: (values = {}) => {
    values = values || {};
    values.secret = uuidv4();
    fs.writeFileSync(`${STORAGE.PATH}/.auth`, yaml.dump(values));
    return values;
  },
  set: (values = {}) => {
    fs.writeFileSync(`${STORAGE.PATH}/.auth`, yaml.dump({ ...this.auth.get(), ...values }));
    return values;
  },
};

module.exports.jwt = {
  sign: (obj = {}) =>
    jwt.sign(obj, this.auth.get().secret, {
      expiresIn: obj.expiresIn ? obj.expiresIn : obj.route ? '1h' : '168h',
    }),
  decode: (token) => jwt.verify(token, this.auth.get().secret),
  verify: (token) => {
    try {
      jwt.verify(token, this.auth.get().secret);
      return true;
    } catch (error) {
      return false;
    }
  },
};
