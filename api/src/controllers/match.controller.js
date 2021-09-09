const { promisify } = require('util');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const database = require('../util/db.util');
const filesystem = require('../util/fs.util');
const { jwt } = require('../util/auth.util');
const process = require('../util/process.util');
const { AUTH, STORAGE } = require('../constants');
const { BAD_REQUEST } = require('../constants/http-status');

let matchProps = [];

const format = async (matches) => {
  const token = AUTH && matches.length ? jwt.sign({ route: 'storage' }) : null;

  matches = await Promise.all(
    matches.map(async (obj) => {
      const { id, filename, event, response, isTrained } = obj;
      const { camera, type, zones, updatedAt } = JSON.parse(event);

      const key = `matches/${filename}`;

      const output = {
        id,
        camera,
        type,
        zones,
        file: {
          key,
          filename,
        },
        isTrained: !!isTrained,
        response: JSON.parse(response),
        createdAt: obj.createdAt,
        updatedAt: updatedAt || null,
        token,
      };

      const [matchProp] = matchProps.filter((prop) => prop.key === key);

      if (matchProp) {
        output.file = matchProp.file;
      } else if (fs.existsSync(`${STORAGE.PATH}/${key}`)) {
        const base64 = await sharp(`${STORAGE.PATH}/${key}`)
          .jpeg({ quality: 70 })
          .resize(500)
          .withMetadata()
          .toBuffer();
        const { width, height } = await sizeOf(`${STORAGE.PATH}/${key}`);
        output.file.base64 = base64.toString('base64');
        output.file.width = width;
        output.file.height = height;
        // push sharp and sizeOf results to an array to search against
        matchProps.unshift({ key, file: output.file });
      }

      return output;
    })
  );
  matches = matches.flat();
  matchProps = matchProps.slice(0, 500);
  return matches;
};

module.exports.get = async (req, res) => {
  const { sinceId } = req.query;

  const db = database.connect();
  const matches = db
    .prepare(
      `
        SELECT * FROM match
        LEFT JOIN (SELECT filename as isTrained FROM train GROUP BY filename) train ON train.isTrained = match.filename
        WHERE id > ?
        GROUP BY match.id
        ORDER BY createdAt DESC LIMIT 100
        `
    )
    .bind(sinceId || 0)
    .all();

  res.send({ matches: await format(matches) });
};

module.exports.delete = async (req, res) => {
  const files = req.body;
  files.forEach((file) => {
    const db = database.connect();
    db.prepare('DELETE FROM match WHERE id = ?').run(file.id);
    filesystem.delete(`${STORAGE.PATH}/${file.key}`);
  });

  res.send({ success: true });
};

module.exports.reprocess = async (req, res) => {
  const { matchId } = req.params;
  const db = database.connect();
  let [match] = db.prepare('SELECT * FROM match WHERE id = ?').bind(matchId).all();

  if (!match) {
    return res.status(BAD_REQUEST).error('No match found');
  }

  const results = await process.start(match.filename, `${STORAGE.PATH}/matches/${match.filename}`);
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
  match = await format(match);

  res.send(match[0]);
};
