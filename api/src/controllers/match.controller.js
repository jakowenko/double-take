const fs = require('fs');
const sizeOf = require('probe-image-size');
const crypto = require('crypto');
const objhasher = require('object-hash');
const database = require('../util/db.util');
const filesystem = require('../util/fs.util');
const { tryParseJSON } = require('../util/validators.util');
const { jwt } = require('../util/auth.util');
const process = require('../util/process.util');
const { AUTH, STORAGE, UI } = require('../constants')();
const { BAD_REQUEST, NOT_FOUND, SERVER_ERROR } = require('../constants/http-status');
const DETECTORS = require('../constants/config').detectors();
const Cache = require('../util/cache.util');

const db = database.connect();
const format = async (matches) => {
  const token = AUTH && matches.length ? jwt.sign({ route: 'storage' }) : null;
  matches = await Promise.all(
    matches.map(async (obj) => {
      const { id, filename, event, response, isTrained } = obj;
      const { camera, type, zones, updatedAt } = JSON.parse(event);
      const key = `matches/${filename}`;
      const { width, height } = await sizeOf(
        fs.createReadStream(`${STORAGE.MEDIA.PATH}/${key}`)
      ).catch((/* error */) => ({ width: 0, height: 0 }));

      return {
        id,
        camera,
        type,
        zones,
        file: {
          key,
          filename,
          width,
          height,
        },
        isTrained: !!isTrained,
        response: JSON.parse(response),
        createdAt: obj.createdAt,
        updatedAt: updatedAt || null,
        token,
      };
    })
  );
  return matches;
};

module.exports.post = async (req, res) => {
  const limit = UI.PAGINATION.LIMIT;
  const { sinceId } = req.body;
  const { page } = req.query;
  const { filters } = req.body;
  const tmptable = crypto.createHash('md5').digest('hex').toString();

  const filtersHash = objhasher(filters);

  if (
    !filters ||
    !Object.keys(filters).length ||
    (Cache.get('filters') &&
      Cache.get('filters').detectors.length === filters.detectors.length &&
      Cache.get('filters').names.length === filters.names.length &&
      Cache.get('filters').matches.length === filters.matches.length &&
      Cache.get('filters').cameras.length === filters.cameras.length &&
      Cache.get('filters').types.length === filters.types.length &&
      filters.confidence + filters.width + filters.height === 0 &&
      Cache.get('filters').gender &&
      Cache.get('filters').gender?.value === filters.gender?.value)
  ) {
    // TOODO: Optimize by using a single query to get the count and the matches
    const query = `
        SELECT
        m.*,
        t.filename as isTrained
      FROM match m
      LEFT JOIN (SELECT filename FROM train GROUP BY filename) t ON t.filename = m.filename
      ORDER BY m.createdAt DESC
      LIMIT ? OFFSET ?`;
    console.verbose('no filters, using single query');

    const matches = db.prepare(query).all(limit, limit * (page - 1));

    const total = Cache.get('filters')
      ? Cache.get('filters').total
      : database.get.tableRows('match');

    return res.send({
      total,
      limit,
      matches: await format(matches),
    });
  }

  const confidenceQuery =
    filters.confidence === 0 ? `OR json_extract(value, '$.confidence') IS NULL` : '';

  // architecture proёb :(
  db.prepare(
    `CREATE TEMPORARY TABLE IF NOT EXISTS ${tmptable} AS SELECT t.id, t.createdAt, t.filename, t.event, response, detector, gender, value, isTrained FROM (
    SELECT match.id, match.createdAt, match.filename, event, json_extract(value, '$.detector') detector, json_extract(value, '$.results') results, json_extract(value, '$.gender.value') gender, match.response
    FROM match, json_each( match.response)
    ) t, json_each(t.results) LEFT JOIN (SELECT filename as isTrained FROM train GROUP BY filename) train ON train.isTrained = t.filename
  WHERE json_extract(value, '$.name') IN (${database.params(filters.names)})
  AND json_extract(value, '$.match') IN (${database.params(filters.matches)})
  AND json_extract(t.event, '$.camera') IN (${database.params(filters.cameras)})
  AND json_extract(t.event, '$.type') IN (${database.params(filters.types)})
  AND (json_extract(value, '$.confidence') >= ? ${confidenceQuery})
  AND json_extract(value, '$.box.width') >= ?
  AND json_extract(value, '$.box.height') >= ?
  AND gender IN (${database.params(filters.genders)})
  AND detector IN (${database.params(filters.detectors)})
        GROUP BY t.id`
  ).run(
    filters.names,
    filters.matches.map((obj) => (obj === 'match' ? 1 : 0)),
    filters.cameras,
    filters.types,
    filters.confidence,
    filters.width,
    filters.height,
    filters.gender,
    filters.detectors
  );
  db.prepare(`SELECT * FROM ${tmptable}`)
    .all()
    .map((obj) => obj.id);

  let total;
  if (Cache.get(filtersHash)) {
    total = Cache.get(filtersHash);
  } else {
    [total] = db
      .prepare(
        `SELECT COUNT(*) count FROM ${tmptable}
    WHERE id > ?`
      )
      .bind(sinceId || 0)
      .all();
    Cache.set(filtersHash, total, 60);
  }
  const matches = db
    .prepare(
      `SELECT * FROM ${tmptable}
      WHERE id > ?
      ORDER BY createdAt DESC
      LIMIT ?,?`
    )
    .bind(sinceId || 0, limit * (page - 1), limit)
    .all();

  db.exec(`DROP TABLE ${tmptable}`);

  res.send({ total: total.count, limit, matches: await format(matches) });
};

module.exports.delete = async (req, res) => {
  const { ids } = req.body;
  if (ids.length) {
    // Optimize by using a transaction for batch deletion
    db.transaction(() => {
      const files = db
        .prepare(`SELECT filename FROM match WHERE id IN (${database.params(ids)})`)
        .all(ids);

      db.prepare(`DELETE FROM match WHERE id IN (${database.params(ids)})`).run(ids);

      files.forEach(({ filename }) => {
        filesystem.delete(`${STORAGE.MEDIA.PATH}/matches/${filename}`);
      });
    })();
  }

  res.send({ success: true });
};

module.exports.reprocess = async (req, res) => {
  const { matchId } = req.params;
  if (!DETECTORS.length) return res.status(BAD_REQUEST).error('no detectors configured');

  let [match] = db.prepare('SELECT * FROM match WHERE id = ?').bind(matchId).all();

  if (!match) return res.status(BAD_REQUEST).error('No match found');

  try {
    const results = await process.start({
      camera: tryParseJSON(match.event) ? tryParseJSON(match.event).camera : null,
      filename: match.filename,
      tmp: `${STORAGE.MEDIA.PATH}/matches/${match.filename}`,
    });
    database.update.match({
      id: match.id,
      event: JSON.parse(match.event),
      response: results,
    });
  } catch (err) {
    console.error(err);
    return res.status(SERVER_ERROR).json({ error: 'Processing failure' });
  }

  const matches = await db
    .prepare(
      `SELECT * FROM match
      LEFT JOIN (SELECT filename as isTrained FROM train GROUP BY filename) train ON train.isTrained = match.filename
      WHERE id = ?`
    )
    .bind(matchId)
    .all();
  if (!matches.length) {
    return res.status(NOT_FOUND).json({ error: 'No match found post-processing' });
  }
  [match] = await format(matches);

  res.send(match);
};

module.exports.filters = async (req, res) => {
  const cacheKey = 'filters';
  const cachedFilters = Cache.get(cacheKey);
  if (cachedFilters) {
    return res.send(cachedFilters);
  }

  try {
    const [total] = db.prepare('SELECT COUNT(*) count FROM match').all();

    // A helper function to eliminate repetitive code
    const extractUniqueJsonField = (field, orderBy = 'ASC') => {
      return db
        .prepare(
          `SELECT DISTINCT json_extract(value, '$.${field}') name
           FROM match, json_each(match.response)
           ORDER BY name ${orderBy}`
        )
        .all()
        .filter((obj) => obj.name !== null)
        .map((obj) => obj.name);
    };

    const detectors = extractUniqueJsonField('detector');
    const names = extractUniqueJsonField('name');
    const matches = extractUniqueJsonField(
      "(CASE WHEN json_extract(value, '$.match') THEN 'match' ELSE 'miss' END)",
      'DESC'
    ); // Assuming you want to differentiate between 'match' and 'miss'
    const cameras = extractUniqueJsonField('camera', 'event');
    const types = extractUniqueJsonField('type', 'event');
    const genders = ['male', 'female'];

    const result = { total: total.count, detectors, names, matches, cameras, types, genders };
    Cache.set(cacheKey, result, 120);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching filters.' });
  }
};
