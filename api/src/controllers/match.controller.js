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
const { BAD_REQUEST } = require('../constants/http-status');
const DETECTORS = require('../constants/config').detectors();
const Cache = require('../util/cache.util');

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

  const db = database.connect();

  if (
    (Cache.get('filters') &&
      Cache.get('filters').detectors.length === filters.detectors.length &&
      Cache.get('filters').names.length === filters.names.length &&
      Cache.get('filters').matches.length === filters.matches.length &&
      Cache.get('filters').cameras.length === filters.cameras.length &&
      Cache.get('filters').types.length === filters.types.length &&
      filters.confidence + filters.width + filters.height === 0) ||
    !filters ||
    !Object.keys(filters).length
  ) {
    // Optimize by using a single query to get the count and the matches
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

    return res.send({
      total: Cache.get('filters').total ?? 0,
      limit,
      matches: await format(matches),
    });
  }

  const confidenceQuery =
    filters.confidence === 0 ? `OR json_extract(value, '$.confidence') IS NULL` : '';

  // architecture proёb :(
  db.prepare(
    `CREATE TEMPORARY TABLE IF NOT EXISTS ${tmptable} AS SELECT t.id, t.createdAt, t.filename, t.event, response, detector, value FROM (
    SELECT match.id, match.createdAt, match.filename, event, json_extract(value, '$.detector') detector, json_extract(value, '$.results') results, match.response
    FROM match, json_each( match.response)
    ) t, json_each(t.results)
  WHERE json_extract(value, '$.name') IN (${database.params(filters.names)})
  AND json_extract(value, '$.match') IN (${database.params(filters.matches)})
  AND json_extract(t.event, '$.camera') IN (${database.params(filters.cameras)})
  AND json_extract(t.event, '$.type') IN (${database.params(filters.types)})
  AND (json_extract(value, '$.confidence') >= ? ${confidenceQuery})
  AND json_extract(value, '$.box.width') >= ?
  AND json_extract(value, '$.box.height') >= ?
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
    filters.detectors
  );
  db.prepare(`SELECT * FROM ${tmptable}`)
    .all()
    .map((obj) => obj.id);

  const filtersHash = objhasher(filters);
  let total;
  if (Cache.get(filtersHash)) {
    total = Cache.get(filtersHash);
  } else {
    [total] = db
      .prepare(
        `SELECT COUNT(*) count FROM ${tmptable}
    WHERE id > ?
    ORDER BY createdAt DESC`
      )
      .bind(sinceId || 0)
      .all();
    Cache.set(filtersHash, total, 60);
  }
  const matches = db
    .prepare(
      `SELECT * FROM ${tmptable}
  LEFT JOIN (SELECT filename as isTrained FROM train GROUP BY filename) train ON train.isTrained = ${tmptable}.filename
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
    const db = database.connect();
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

  const db = database.connect();
  let [match] = db.prepare('SELECT * FROM match WHERE id = ?').bind(matchId).all();

  if (!match) return res.status(BAD_REQUEST).error('No match found');

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
  match = db
    .prepare(
      `SELECT * FROM match
      LEFT JOIN (SELECT filename as isTrained FROM train GROUP BY filename) train ON train.isTrained = match.filename
      WHERE id = ?`
    )
    .bind(matchId)
    .all();
  [match] = await format(match);

  res.send(match);
};

module.exports.filters = async (req, res) => {
  if (Cache.get('filters')) return res.send(Cache.get('filters'));

  const db = database.connect();

  const [total] = db.prepare('SELECT COUNT(*) count FROM match').all();

  const detectors = db
    .prepare(
      `SELECT json_extract(value, '$.detector') name
      FROM match, json_each(match.response)
      GROUP BY name
    ORDER BY name ASC`
    )
    .all()
    .map((obj) => obj.name);

  const names = db
    .prepare(
      `SELECT json_extract(value, '$.name') name FROM (
          SELECT json_extract(value, '$.results') results
      FROM match, json_each(match.response)
          ) t, json_each(t.results)
      GROUP BY name
    ORDER BY name ASC`
    )
    .all()
    .map((obj) => obj.name);

  const matches = db
    .prepare(
      `SELECT IIF(json_extract(value, '$.match') == 1, 'match', 'miss') name FROM (
          SELECT json_extract(value, '$.results') results
      FROM match, json_each(match.response)
          ) t, json_each(t.results)
      GROUP BY name
    ORDER BY name ASC`
    )
    .all()
    .map((obj) => obj.name);

  const cameras = db
    .prepare(
      `SELECT json_extract(event, '$.camera') name
      FROM match
      GROUP BY name
    ORDER BY name ASC`
    )
    .all()
    .map((obj) => obj.name);

  const types = db
    .prepare(
      `SELECT json_extract(event, '$.type') name
      FROM match
      GROUP BY name
    ORDER BY name ASC`
    )
    .all()
    .map((obj) => obj.name);

  const result = { total: total.count, detectors, names, matches, cameras, types };
  Cache.set('filters', result, 120);
  res.send(result);
};
