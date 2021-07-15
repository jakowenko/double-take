const Database = require('better-sqlite3');
const time = require('./time.util');
const filesystem = require('./fs.util');

const { STORAGE, SAVE } = require('../constants');

const database = this;
let connection = false;

module.exports.connect = () => {
  if (!connection) connection = new Database(`${STORAGE.PATH}/database.db`);
  return connection;
};

module.exports.init = async () => {
  try {
    const db = database.connect();

    database.migrations();

    db.prepare(
      `CREATE TABLE IF NOT EXISTS file (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name,
        filename,
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

    db.prepare(
      `CREATE TABLE IF NOT EXISTS match (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename,
        event JSON,
        response JSON,
        createdAt TIMESTAMP
    )`
    ).run();

    const files = await filesystem.files().train();
    database.insert('init', files);
  } catch (error) {
    console.error(`db init error: ${error.message}`);
  }
};

module.exports.migrations = () => {
  try {
    const db = database.connect();
    if (
      !db
        .prepare('PRAGMA table_info(match)')
        .all()
        .filter((obj) => obj.name === 'filename').length
    ) {
      db.prepare('DROP TABLE IF EXISTS match').run();
    }

    if (
      db
        .prepare('PRAGMA table_info(file)')
        .all()
        .filter((obj) => obj.name === 'uuid').length
    ) {
      db.exec(
        `
          BEGIN TRANSACTION;
          CREATE TEMPORARY TABLE file_backup (id, name, filename, meta, isActive, createdAt);
          INSERT INTO file_backup SELECT id, name, filename, meta, isActive, createdAt FROM file;
          DROP TABLE file;
          CREATE TABLE file (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name,
            filename,
            meta JSON,
            isActive INTEGER,
            createdAt TIMESTAMP,
            UNIQUE(name, filename)
          );
          INSERT INTO file SELECT id, name, filename, meta, isActive, createdAt FROM file_backup;
          DROP TABLE file_backup;
          COMMIT;
      `
      );
    }
  } catch (error) {
    console.error(`db migrations error: ${error.message}`);
  }
};

module.exports.files = (status, data) => {
  const db = database.connect();
  try {
    let files = [];

    if (status === 'untrained') {
      files = db
        .prepare(
          `SELECT * FROM file WHERE id NOT IN (SELECT fileId FROM train) AND name = ? AND isActive = 1`
        )
        .all(data);
    }

    if (status === 'trained') {
      files = db.prepare(`SELECT * FROM train`).all();
    }

    if (status === 'trained-ids') {
      files = db
        .prepare(`SELECT name, fileId as id, filename FROM train WHERE name = ? GROUP BY fileId`)
        .all(data);
    }

    if (status === 'all') {
      files = db.prepare(`SELECT * FROM file WHERE isActive = 1`).all();
    }

    files.forEach((file) => {
      const { name, filename } = file;
      if (file.response) file.response = JSON.parse(file.response);
      file.key = `${STORAGE.PATH}/train/${name}/${filename}`;
    });

    return files;
  } catch (error) {
    console.error(`files error: ${error.message}`);
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
      for (const { ...item } of items) {
        const temp = { ...item };
        item.id = null;
        item.fileId = temp.id;
        item.createdAt = time.utc();
        item.meta = temp.meta || null;
        insert.run(item);
      }
    });
    transaction(data);
  }

  if (type === 'file') {
    const insert = db.prepare(`
      INSERT INTO file
      VALUES (:id, :name, :filename, :meta, :isActive, :createdAt)
      ON CONFLICT (name, filename) DO UPDATE SET isActive = 1;
    `);
    const transaction = db.transaction((items) => {
      for (const item of items) {
        item.id = null;
        item.createdAt = time.utc();
        item.meta = null;
        item.isActive = 1;
        insert.run(item);
      }
    });
    transaction(data);
  }

  if (type === 'match') {
    const { camera, results, zones } = data;
    const records = [];
    results.forEach((group) => {
      group.results.forEach((attempt) => {
        let combined = SAVE.UNKNOWN
          ? [...attempt.matches, ...attempt.misses]
          : [...attempt.matches];

        combined = combined.map((obj) => {
          obj.filename = attempt.filename;
          obj.type = group.type;
          obj.detector = attempt.detector;
          obj.camera = camera;
          obj.zones = zones;
          return obj;
        });
        records.push(...combined);
      });
    });

    const insert = db.prepare(`
      INSERT INTO match
      VALUES (:id, :meta, :createdAt);
    `);
    const transaction = db.transaction((items) => {
      for (const item of items) {
        insert.run({
          id: null,
          meta: JSON.stringify(item),
          createdAt: time.utc(),
        });
      }
    });
    transaction(records);
  }
};
