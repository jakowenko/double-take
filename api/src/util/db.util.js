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
  if (LOGS.SQL) {
    console.verbose(`Open database: ${STORAGE.PATH}/database.db`);
  }
  connection.pragma('journal_mode = WAL');
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

  if (getTableRows('responses') === 0) {
    db.prepare(
      `INSERT INTO responses SELECT
    null,null,
    t.createdAt,
    t.filename,
    t.event,
    t.response,
    t.detector,
    json_extract(j.value, '$.name') AS name,
    json_extract(j.value, '$.confidence') AS confidence,
    json_extract(j.value, '$.match') AS match,
    json_extract(j.value, '$.box.top') AS box_top,
    json_extract(j.value, '$.box.left') AS box_left,
    json_extract(j.value, '$.box.width') AS box_width,
    json_extract(j.value, '$.box.height') AS box_height,
    json_extract(j.value, '$.gender.value') AS gender,
    CASE 
        WHEN train.filename IS NOT NULL THEN 1 
        ELSE 0 
    END AS isTrained
FROM (
    SELECT
        match.id,
        match.createdAt,
        match.filename,
        match.event,
        json_extract(value, '$.detector') AS detector,
        json_extract(value, '$.results') AS results,
        match.response
    FROM match
    CROSS JOIN json_each(match.response)
) t
CROSS JOIN json_each(t.results) as j
LEFT JOIN (
    SELECT filename
    FROM train
    GROUP BY filename
) train ON train.filename = t.filename
GROUP BY t.id;`
    ).run();
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

  addColumnIfNotExists('responses', 'gender', '');
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

    /* db.prepare(
      `create view IF NOT EXISTS match_responses as
      SELECT match.id, match.createdAt, match.filename, event, json_extract(value, '$.detector') detector,
      json_extract(value, '$.results') results, match.response
      FROM match, json_each( match.response)`
    ).run();
*/

    db.exec(
      `CREATE TABLE IF NOT EXISTS responses (
        id         INTEGER,
        event_id   INTEGER, -- REFERENCES events (id) MATCH SIMPLE,
        createdAt  NUM,
        filename,
        event      JSON,
        response   JSON,
        detector,
        name,
        confidence REAL,
        match,
        box_top    INTEGER,
        box_left   INTEGER,
        box_width  INTEGER,
        box_height INTEGER,
        gender,
        isTrained,
        PRIMARY KEY (
            id AUTOINCREMENT
        )
      );
      CREATE INDEX IF NOT EXISTS idx_responses_name ON responses (name);
      CREATE INDEX IF NOT EXISTS idx_responses_filename ON responses (filename);
      CREATE INDEX IF NOT EXISTS idx_responses_confidence ON responses (confidence);
      CREATE INDEX IF NOT EXISTS idx_responses_match ON responses (match);
      CREATE INDEX IF NOT EXISTS idx_responses_box ON responses (box_width, box_height);`
    );

    /*
);

    )

    db.prepare(
      `CREATE VIEW IF NOT EXISTS match_extended as SELECT t.id, t.createdAt, t.filename, t.event, response, detector, value
      FROM match_responses t, json_each(t.results)`
    ).run(); 
    
    db.exec(`SELECT
    null,null,
    t.createdAt,
    t.filename,
    t.event,
    t.response,
    t.detector,
    json_extract(j.value, '$.name') AS name,
    json_extract(j.value, '$.confidence') AS confidence,
    json_extract(j.value, '$.match') AS match,
    json_extract(j.value, '$.box.top') AS box_top,
    json_extract(j.value, '$.box.left') AS box_left,
    json_extract(j.value, '$.box.width') AS box_width,
    json_extract(j.value, '$.box.height') AS box_height,
    CASE 
        WHEN train.filename IS NOT NULL THEN 1 
        ELSE 0 
    END AS isTrained
FROM (
    SELECT
        match.id,
        match.createdAt,
        match.filename,
        match.event,
        json_extract(value, '$.detector') AS detector,
        json_extract(value, '$.results') AS results,
        match.response
    FROM match
    CROSS JOIN json_each(match.response)
) t
CROSS JOIN json_each(t.results) as j
LEFT JOIN (
    SELECT filename
    FROM train
    GROUP BY filename
) train ON train.filename = t.filename
GROUP BY t.id;
`);
    */

    db.exec(`CREATE INDEX IF NOT EXISTS idx_file_createdAt ON file(createdAt)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_match_createdAt ON match(createdAt)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_match_filename ON match(filename)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_train_filename ON train(filename)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_train_name ON train(name)`);

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
/**
 * Retrieves the number of rows in a table.
 *
 * @param {string} name - The name of the table.
 * @return {number} The number of rows in the table.
 */
function getTableRows(name) {
  const db = connect();
  try {
    const stmt = db.prepare(`select sum(ncell) as rows from dbstat where name=:name;`);
    const data = stmt.get({ name });
    return Number(data.rows) || 0;
  } catch (error) {
    const stmt = db.prepare(`select count(1) as rows from ${name};`);
    const data = stmt.get();
    return Number(data.rows) || 0;
  }
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
  db.prepare(`UPDATE responses SET isTrained = 1 WHERE filename = ?`).run(filename);
}
function createMatch({ filename, event, response }) {
  try {
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
    db.prepare(
      `INSERT INTO responses (id, event_id, createdAt, filename, event, response, detector, name, confidence, match, box_top, box_left, box_width, box_height)
      VALUES (:id, :event_id, :createdAt, :filename, :event, :response, :detector, :name, :confidence, :match, :box_top, :box_left, :box_width, :box_height)
    `
    ).run({
      id: null,
      event_id: null,
      createdAt: time.utc(),
      filename,
      event: event ? JSON.stringify(event) : null,
      response: response ? JSON.stringify(response) : null,
      detector: response ? response.detector : null,
      name: response ? response.name : null,
      confidence: response ? response.confidence : null,
      match: response ? response.match : null,
      box_top: response && response.box ? response.box.top ?? null : null,
      box_left: response && response.box ? response.box.left ?? null : null,
      box_width: response && response.box ? response.box.width ?? null : null,
      box_height: response && response.box ? response.box.height ?? null : null,
    });
  } catch (error) {
    error.message = `db createMatch error: ${error.message}`;
    console.error(error);
  }
}
function updateMatch({ id, event, response }) {
  try {
    event.updatedAt = time.utc();
    const db = connect();
    db.prepare(`UPDATE match SET event = :event, response = :response WHERE id = :id`).run({
      event: event ? JSON.stringify(event) : null,
      response: response ? JSON.stringify(response) : null,
      id,
    });
    db.prepare(
      `UPDATE responses SET event = :event, response = :response,
    name = :name, confidence = :confidence, match = :match, box_top = :box_top,
    box_left = :box_left, box_width = :box_width, box_height = :box_height WHERE id = :id`
    ).run({
      event: event ? JSON.stringify(event) : null,
      response: response ? JSON.stringify(response) : null,
      name: response ? response.name : null,
      confidence: response ? response.confidence : null,
      match: response ? response.match : null,
      box_top: response && response.box ? response.box.top ?? null : null,
      box_left: response && response.box ? response.box.left ?? null : null,
      box_width: response && response.box ? response.box.width ?? null : null,
      box_height: response && response.box ? response.box.height ?? null : null,
      id,
    });
  } catch (error) {
    error.message = `db updateMatch error: ${error.message}`;
    console.error(error);
  }
}

function addColumnIfNotExists(tableName, columnName, columnType) {
  const db = connect();
  const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const columnExists = tableInfo.some((column) => column.name === columnName);

  if (!columnExists) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`).run();
    console.log(`Column ${columnName} added to ${tableName}`);
  } else {
    console.debug(`Column ${columnName} already exists in ${tableName}`);
  }
}

module.exports = {
  init,
  connect,
  get: {
    untrained: getUntrained,
    trained: getTrained,
    filesById: getFilesById,
    fileByFilename: getFileByFilename,
    tableRows: getTableRows,
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
