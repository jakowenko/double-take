const NodeCache = require('node-cache');

const DTCache = new NodeCache();

module.exports = {
  get: (key) => {
    console.verbose(`Cache get: ${key}`);
    return DTCache.get(key);
  },
  set: (key, value, ttl) => {
    console.verbose(`Cache set: ${key}, ttl: ${ttl}`);
    return DTCache.set(key, value, ttl);
  },
  del: (key) => {
    console.verbose(`Cache del: ${key}`);
    return DTCache.del(key);
  }
};
