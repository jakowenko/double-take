const NodeCache = require('node-cache');

const DTCache = new NodeCache();

module.exports = {
  get: (key) => DTCache.get(key),
  set: (key, value, ttl) => DTCache.set(key, value, ttl),
};
