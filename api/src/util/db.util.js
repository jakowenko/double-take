const Database = require('better-sqlite3');
const time = require('./time.util');
const filesystem = require('./fs.util');
const { STORAGE } = require('../constants');

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

    await this.resync.files();
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

module.exports.resync = {
  files: async () => {
    const db = database.connect();
    db.prepare(`UPDATE file SET isActive = 0`).run();
    const files = await filesystem.files.train();
    files.forEach((obj) => this.create.file(obj));
  },
};

module.exports.get = {
  untrained: (name) => {
    const db = database.connect();
    return db
      .prepare(
        `SELECT * FROM file WHERE id NOT IN (SELECT fileId FROM train WHERE meta IS NOT NULL AND detector IN (${database.params(
          DETECTORS
        )})) AND name = ? AND isActive = 1`
      )
      .all(DETECTORS, name);
  },
  trained: (name) => {
    const db = database.connect();
    return db.prepare(`SELECT * FROM train WHERE name = ?`).all(name);
  },
  filesById: (ids) => {
    const db = database.connect();
    return db.prepare(`SELECT * FROM file WHERE id IN (${database.params(ids)})`).all(ids);
  },
  fileByFilename(name, filename) {
    const db = database.connect();
    const [file] = db
      .prepare(`SELECT * FROM file WHERE name = ? AND filename = ?`)
      .all(name, filename);
    return file || false;
  },
};

module.exports.create = {
  file: ({ name, filename, meta }) => {
    const db = database.connect();
    db.prepare(
      `INSERT INTO file
        VALUES (:id, :name, :filename, :meta, :isActive, :createdAt)
        ON CONFLICT (name, filename) DO UPDATE SET isActive = 1;`
    ).run({
      id: null,
      name,
      filename,
      meta: meta || null,
      createdAt: time.utc(),
      isActive: 1,
    });
  },
  train: ({ id, name, filename, detector, meta }) => {
    const db = database.connect();
    db.prepare(
      `INSERT INTO train
        VALUES (:id, :fileId, :name, :filename, :detector, :meta, :createdAt)
        ON CONFLICT (fileId, detector) DO UPDATE SET meta = :meta;`
    ).run({
      id: null,
      fileId: id,
      name,
      filename,
      detector,
      meta: meta || null,
      createdAt: time.utc(),
    });
  },
  match: ({ filename, event, response }) => {
    const db = database.connect();
    db.prepare(
      `INSERT INTO match (id, filename, event, response, createdAt) VALUES (:id, :filename, :event, :response, :createdAt)`
    ).run({
      id: null,
      filename,
      event: event ? JSON.stringify(event) : null,
      response: response ? JSON.stringify(response) : null,
      createdAt: time.utc(),
    });
  },
};

module.exports.params = (array) => '?,'.repeat(array.length).slice(0, -1);
