const fs = require('fs');
const filesystem = require('../util/fs.util');
const { resync } = require('../util/db.util');
const { STORAGE } = require('../constants');

module.exports.folders = {
  list: async (req, res) => res.send(await filesystem.folders().train()),
  create: (req, res) => {
    const { name } = req.params;
    if (!fs.existsSync(`${STORAGE.PATH}/train/${name}`)) {
      fs.mkdirSync(`${STORAGE.PATH}/train/${name}`);
    }
    res.send({ success: true });
  },
  delete: async (req, res) => {
    const { name } = req.params;
    if (fs.existsSync(`${STORAGE.PATH}/train/${name}`)) {
      fs.rmdirSync(`${STORAGE.PATH}/train/${name}`, { recursive: true });
      await resync.files();
    }
    res.send({ success: true });
  },
};
