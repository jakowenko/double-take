const fs = require('fs');

module.exports.core = {
  server: {
    port: process.env.DOUBLETAKE_PORT ? process.env.DOUBLETAKE_PORT : 3000,
    host: process.env.DOUBLETAKE_HOST ? process.env.DOUBLETAKE_HOST : '0.0.0.0',
  },
  storage: {
    path: process.env.STORAGE_PATH ? process.env.STORAGE_PATH : './.storage',
    config: { path: process.env.CONFIG_PATH ? process.env.CONFIG_PATH : './.storage/config' },
    secrets: {
      path: process.env.SECRETS_PATH ? process.env.SECRETS_PATH : './.storage/config',
      extension: process.env.HA_ADDON === true || process.env.HA_ADDON === 'true' ? 'yaml' : 'yml',
    },
    media: { path: process.env.MEDIA_PATH ? process.env.MEDIA_PATH : './.storage' },
    tmp: { path: fs.existsSync('/dev/shm') ? '/dev/shm/double-take' : '/tmp/double-take' },
  },
};
