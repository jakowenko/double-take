const fs = require('fs');
const schedule = require('node-schedule');
const logger = require('./logger.util');
const time = require('./time.util');
const database = require('./db.util');
const { STORAGE_PATH, PURGE_UNKNOWN, PURGE_MATCHES } = require('../constants');

module.exports.purge = async () => {
  schedule.scheduleJob('* * * * *', async () => {
    try {
      const db = database.connect();
      const files = db
        .prepare(
          `SELECT match.id, match.filename
        FROM match, json_tree(response)
        WHERE key = 'match' AND value = 1 AND datetime(createdAt) <= datetime('now', '-${PURGE_MATCHES} hours')
        GROUP BY match.id, value
        UNION ALL
        SELECT t1.id, t1.filename FROM (
          SELECT *, COUNT(*) count FROM (
            SELECT match.id, match.filename, match.createdAt, value
            FROM match, json_tree(response)
            WHERE key = 'match'
            AND datetime(match.createdAt) <= datetime('now', '-${PURGE_UNKNOWN} hours')
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
        if (fs.existsSync(`${STORAGE_PATH}/matches/${filename}`)) {
          promises.push(fs.promises.unlink(`${STORAGE_PATH}/matches/${filename}`));
        }
      });
      await Promise.all(promises);

      const ids = files.map(({ id }) => id);
      db.prepare(`DELETE FROM match WHERE id IN (${ids.join(',')})`).run();

      if (files.length > 0) logger.log(`${time.current()}\npurged ${files.length} file(s)`);
    } catch (error) {
      logger.log(`purge error: ${error.message}`);
    }
  });
};

module.exports.setup = () => {
  if (!fs.existsSync(`${STORAGE_PATH}/matches`)) {
    fs.mkdirSync(`${STORAGE_PATH}/matches`, { recursive: true });
  }
  if (!fs.existsSync(`${STORAGE_PATH}/train`)) {
    fs.mkdirSync(`${STORAGE_PATH}/train`, { recursive: true });
  }
};
