const { promisify } = require('util');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const database = require('../util/db.util');
const filesystem = require('../util/fs.util');
const { jwt } = require('../util/auth.util');
const { respond, HTTPSuccess /* , HTTPError */ } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { AUTH, STORAGE } = require('../constants');

let matchProps = [];

const format = async (matches) => {
  const token = AUTH && matches.length ? jwt.sign({ route: 'storage' }) : null;

  matches = await Promise.all(
    matches.map(async (obj) => {
      const { id, filename, event, response } = obj;
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
  try {
    const { sinceId } = req.query;

    const db = database.connect();
    const matches = db
      .prepare(
        `
          SELECT * FROM match
          WHERE filename NOT IN (SELECT filename FROM train)
          AND id > ?
          ORDER BY createdAt DESC LIMIT 100
        `
      )
      .bind(sinceId || 0)
      .all();

    respond(HTTPSuccess(OK, { matches: await format(matches) }), res);
  } catch (error) {
    respond(error, res);
  }
};

module.exports.delete = async (req, res) => {
  try {
    const files = req.body;
    files.forEach((file) => {
      const db = database.connect();
      db.prepare('DELETE FROM match WHERE id = ?').run(file.id);
      filesystem.delete(`${STORAGE.PATH}/${file.key}`);
    });
    respond(HTTPSuccess(OK, { success: true }), res);
  } catch (error) {
    respond(error, res);
  }
};
