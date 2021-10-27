const fs = require('fs');
const schedule = require('node-schedule');
const database = require('./db.util');
const { STORAGE } = require('../constants')();
const { MATCH, UNKNOWN } = require('../constants/config').detect();

module.exports.purge = async () => {
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const db = database.connect();
      const files = db
        .prepare(
          `SELECT match.id, match.filename
        FROM match, json_tree(response)
        WHERE key = 'match' AND value = 1 AND datetime(createdAt) <= datetime('now', '-${MATCH.PURGE} hours')
        GROUP BY match.id, value
        UNION ALL
        SELECT t1.id, t1.filename FROM (
          SELECT *, COUNT(*) count FROM (
            SELECT match.id, match.filename, match.createdAt, value
            FROM match, json_tree(response)
            WHERE key = 'match'
            AND datetime(match.createdAt) <= datetime('now', '-${UNKNOWN.PURGE} hours')
            GROUP BY match.id, value
          ) t
        GROUP BY t.id
        HAVING count = 1
        ) t1
        WHERE t1.value = 0`
        )
        .all();

      const promises = [];
      files.forEach(({ filename }) => {
        if (fs.existsSync(`${STORAGE.MEDIA.PATH}/matches/${filename}`)) {
          promises.push(fs.promises.unlink(`${STORAGE.MEDIA.PATH}/matches/${filename}`));
        }
      });
      await Promise.all(promises);

      const ids = files.map(({ id }) => id);
      db.prepare(`DELETE FROM match WHERE id IN (${ids.join(',')})`).run();

      if (files.length > 0) console.log(`purged ${files.length} file(s)`);
    } catch (error) {
      error.message = `purge error: ${error.message}`;
      console.error(error);
    }
  });
};

module.exports.setup = () => {
  const folders = [
    STORAGE.TMP.PATH,
    `${STORAGE.MEDIA.PATH}/matches`,
    `${STORAGE.MEDIA.PATH}/train`,
    `${STORAGE.MEDIA.PATH}/latest`,
  ];
  if (fs.existsSync(STORAGE.TMP.PATH)) {
    fs.rmSync(STORAGE.TMP.PATH, { recursive: true });
  }

  folders.forEach((folder) => {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  });
};
