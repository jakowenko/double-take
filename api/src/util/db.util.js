const Database = require('better-sqlite3');
const time = require('./time.util');
const filesystem = require('./fs.util');
const { STORAGE, LOGS } = require('../constants')();
const DETECTORS = require('../constants/config').detectors();

const database = this;
let connection = false;

function connect() {
  if (!connection)
    connection = new Database(`${STORAGE.PATH}/database.db`, {
      verbose: LOGS.SQL ? console.verbose : null,
    });
  return connection;
}
function createFile({ name, filename, meta }) {
  const db = connect();
  db.prepare(
    `INSERT INTO file (name, filename, meta, isActive, createdAt)
        VALUES (:name, :filename, :meta, :isActive, :createdAt)
        ON CONFLICT (name, filename) DO UPDATE SET isActive = 1;`
  ).run({
    name,
    filename,
    meta: meta || null,
    createdAt: time.utc(),
    isActive: 1,
  });
}
async function resync() {
  const db = connect();
  db.prepare(`UPDATE file SET isActive = 0`).run();
  const files = await filesystem.files.train();
  files.forEach((obj) => createFile(obj));
}

function migrations() {
  const db = connect();

  const matchTableInfo = db.prepare('PRAGMA table_info(match)').all();
  const fileTableInfo = db.prepare('PRAGMA table_info(file)').all();

  if (!matchTableInfo.some((obj) => obj.name === 'filename')) {
    db.prepare('DROP TABLE IF EXISTS match').run();
  }

  if (fileTableInfo.some((obj) => obj.name === 'uuid')) {
    db.transaction(() => {
      db.prepare('ALTER TABLE file RENAME TO file_backup').run();

      db.prepare(
        `
        CREATE TABLE file (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          filename TEXT,
          meta JSON,
          isActive INTEGER,
          createdAt TIMESTAMP,
          UNIQUE(name, filename)
        )
      `
      ).run();

      db.prepare(
        `
        INSERT INTO file (id, name, filename, meta, isActive, createdAt)
        SELECT id, name, filename, meta, isActive, createdAt FROM file_backup
      `
      ).run();

      db.prepare('DROP TABLE file_backup').run();
    })();
  }
}

async function init() {
  try {
    const db = connect();

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

    db.exec(`CREATE INDEX IF NOT EXISTS idx_file_createdAt ON file(createdAt)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_match_createdAt ON match(createdAt)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_match_filename ON match(filename)`);
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_match_response_match ON match(json_extract(response, '$.match'))`
    );

    db.prepare(`DELETE FROM train WHERE meta IS NULL`).run();

    migrations();

    await resync();
  } catch (error) {
    error.message = `db init error: ${error.message}`;
    console.error(error);
  }
}
function params(array) {
  return '?,'.repeat(array.length).slice(0, -1);
}
function getUntrained(name) {
  const db = connect();
  return db
    .prepare(
      `SELECT * FROM file WHERE id NOT IN (SELECT fileId FROM train WHERE meta IS NOT NULL AND detector IN (${params(
        DETECTORS
      )})) AND name = ? AND isActive = 1`
    )
    .all(DETECTORS, name);
}
function getTrained(name) {
  const db = connect();
  return db.prepare(`SELECT * FROM train WHERE name = ?`).all(name);
}
function getFilesById(ids) {
  const db = connect();
  return db.prepare(`SELECT * FROM file WHERE id IN (${params(ids)})`).all(ids);
}
function getFileByFilename(name, filename) {
  const db = connect();
  const [file] = db
    .prepare(`SELECT * FROM file WHERE name = ? AND filename = ?`)
    .all(name, filename);
  return file || false;
}

function createTrain({ id, name, filename, detector, meta }) {
  const db = connect();
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
}
function createMatch({ filename, event, response }) {
  const db = connect();
  db.prepare(
    `INSERT INTO match (id, filename, event, response, createdAt) VALUES (:id, :filename, :event, :response, :createdAt)`
  ).run({
    id: null,
    filename,
    event: event ? JSON.stringify(event) : null,
    response: response ? JSON.stringify(response) : null,
    createdAt: time.utc(),
  });
}

function updateMatch({ id, event, response }) {
  event.updatedAt = time.utc();
  const db = connect();
  db.prepare(`UPDATE match SET event = :event, response = :response WHERE id = :id`).run({
    event: event ? JSON.stringify(event) : null,
    response: response ? JSON.stringify(response) : null,
    id,
  });
}

module.exports = {
  init,
  connect,
  get: {
    untrained: getUntrained,
    trained: getTrained,
    filesById: getFilesById,
    fileByFilename: getFileByFilename,
  },
  create: {
    file: createFile,
    match: createMatch,
    train: createTrain,
  },
  update: {
    match: updateMatch,
  },
  resync: {
    files: resync,
  },
  params,
};
