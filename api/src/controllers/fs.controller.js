const fs = require('../util/fs.util');
const filesystem = require('../util/fs.util');
const database = require('../util/db.util');
const { resync } = require('../util/db.util');
const { STORAGE } = require('../constants')();

module.exports.folders = {
  list: async (req, res) => res.send(await filesystem.folders().train()),
  create: (req, res) => {
    const { name } = req.params;
    if (!fs.existsSync(`${STORAGE.MEDIA.PATH}/train/${name}`)) {
      fs.mkDirByPathSync(`${STORAGE.MEDIA.PATH}/train/${name}`);
    }
    res.send({ success: true });
  },
  delete: async (req, res) => {
    const { name } = req.params;
    if (fs.existsSync(`${STORAGE.MEDIA.PATH}/train/${name}`)) {
      fs.rmSync(`${STORAGE.MEDIA.PATH}/train/${name}`, { recursive: true });
      await resync.files();
    }
    const db = database.connect();
    db.prepare('DELETE FROM file WHERE name = ?').run(name);
    db.prepare('DELETE FROM train WHERE name = ?').run(name);
    res.send({ success: true });
  },
};
