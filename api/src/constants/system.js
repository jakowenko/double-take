module.exports.core = {
  server: { port: 3000 },
  storage: { path: './.storage', config: { path: './.storage/config' } },
};

module.exports.dev = {
  mqtt: { host: 'double-take-mqtt' },
};
