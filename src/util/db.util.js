const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const time = require('./time.util');
const filesystem = require('./fs.util');
const logger = require('./logger.util');

const { STORAGE_PATH } = require('../constants');

const database = this;
let connection = false;

module.exports.connect = () => {
  // new Database(':memory:')
  if (!connection) connection = new Database(`${STORAGE_PATH}/database.db`);
  return connection;
};

module.exports.init = async () => {
  try {
    const db = database.connect();
    // db.prepare(`DROP TABLE IF EXISTS file`).run();
    // db.prepare(`DROP TABLE IF EXISTS train`).run();
    db.prepare(
      `CREATE TABLE IF NOT EXISTS file (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name,
        filename,
        uuid,
        meta JSON,
        isActive INTEGER,
        createdAt TIMESTAMP,
        UNIQUE(name, filename)
    )`
    ).run();

    db.prepare(
      `CREATE TABLE IF NOT EXISTS train (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileId INTEGER,
        name,
        filename,
        detector,
        meta JSON,
        createdAt TIMESTAMP,
        UNIQUE(fileId, detector)
    )`
    ).run();

    database.transaction();

    const files = await filesystem.files();
    database.insert('init', files);
  } catch (error) {
    logger.log(`db init error: ${error.message}`);
  }
};

module.exports.transaction = () => {
  let db;
  try {
    db = database.connect();
    const test = db.transaction(() => {});
    test();
  } catch (error) {
    console.log(`db transaction error: ${error.message}`);
  }
};

module.exports.files = (status, data = []) => {
  const db = database.connect();
  try {
    let files = [];

    if (status === 'untrained') {
      files = db
        .prepare(`SELECT * FROM file WHERE id NOT IN (SELECT fileId FROM train) AND isActive = 1`)
        .all();
    }

    if (status === 'uuid') {
      const uuids = data.map((uuid) => `'${uuid}'`).join(',');
      files = db
        .prepare(
          `SELECT * FROM file WHERE uuid IN (${uuids}) AND id NOT IN (SELECT fileId FROM train)`
        )
        .all();
    }

    if (status === 'trained') {
      files = db.prepare(`SELECT * FROM train`).all();
    }

    if (status === 'all') {
      files = db.prepare(`SELECT * FROM file WHERE isActive = 1`).all();
    }

    files.forEach((file) => {
      const { name, filename } = file;
      if (file.response) file.response = JSON.parse(file.response);
      file.key = `${STORAGE_PATH}/train/${name}/${filename}`;
    });

    return files;
  } catch (error) {
    logger.log(`files error: ${error.message}`);
  }
};

module.exports.insert = (type, data = []) => {
  const db = database.connect();

  if (type === 'init') {
    const files = database.files('all');
    let ids = [];

    data.forEach((file) => {
      const [dbRecord] = files.filter(
        (obj) => obj.name === file.name && obj.filename === file.filename
      );
      if (dbRecord) ids.push(dbRecord.id);
    });

    if (ids.length) {
      ids = ids.map((id) => `'${id}'`).join(',');
      db.prepare(`UPDATE file SET isActive = 0 WHERE id NOT IN (${ids})`).run();
    } else {
      db.prepare(`UPDATE file SET isActive = 0`).run();
    }
    database.insert('file', data);
  }

  if (type === 'train') {
    const insert = db.prepare(`
      INSERT INTO train
      VALUES (:id, :fileId, :name, :filename, :detector, :meta, :createdAt)
      ON CONFLICT (fileId, detector) DO UPDATE SET meta = :meta;
    `);
    const transaction = db.transaction((items) => {
      for (const item of items) {
        item.id = null;
        item.createdAt = time.unix();
        insert.run(item);
      }
    });
    transaction(data);
  }

  if (type === 'file') {
    const insert = db.prepare(`
      INSERT INTO file
      VALUES (:id, :name, :filename, :uuid, :meta, :isActive, :createdAt)
      ON CONFLICT (name, filename) DO UPDATE SET isActive = 1;
    `);
    const transaction = db.transaction((items) => {
      for (const item of items) {
        item.id = null;
        item.uuid = item.uuid || uuidv4();
        item.createdAt = time.unix();
        item.meta = null;
        item.isActive = 1;
        insert.run(item);
      }
    });
    transaction(data);
  }
};
