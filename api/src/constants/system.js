const fs = require('fs');

module.exports.core = {
  server: { port: 3000 },
  storage: {
    path: './.storage',
    config: { path: './.storage/config' },
    tmp: { path: fs.existsSync('/dev/shm') ? '/dev/shm/double-take' : '/tmp/double-take' },
  },
};
