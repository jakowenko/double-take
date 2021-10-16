const jwt = require('jsonwebtoken');
const fs = require('fs');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');
const AxiosDigestAuth = require('@mhoc/axios-digest-auth').default;
const { STORAGE } = require('../constants')();

const DIGEST_AUTH = [];

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

module.exports.parse = {
  url: (url) => {
    const login = url
      .substring(0, url.indexOf('@'))
      .replace(/(^\w+:|^)\/\//, '')
      .split(':');
    return login.length === 2 ? { username: login[0], password: login[1] } : false;
  },
};

module.exports.digest = Object.assign(
  ({ username, password }) => {
    return new AxiosDigestAuth({
      username,
      password,
    });
  },
  {
    exists: (url) => {
      if (!DIGEST_AUTH.includes(url) || !this.parse.url(url)) return false;
      const { username, password } = this.parse.url(url);
      return {
        url: this.digest.strip(url),
        username,
        password,
      };
    },
    add: (url) => {
      if (!this.digest.exists(url)) DIGEST_AUTH.push(url);
    },
    strip: (url) => {
      const { username, password } = this.parse.url(url);
      return url.replace(`${username}:${password}@`, '');
    },
  }
);
