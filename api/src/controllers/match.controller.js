const { promisify } = require('util');
const fs = require('fs');
const sharp = require('sharp');
const sizeOf = promisify(require('image-size'));
const database = require('../util/db.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess /* , HTTPError */ } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { STORAGE_PATH } = require('../constants');

module.exports.get = async (req, res) => {
  try {
    const { sinceId: id } = req.query;

    const db = database.connect();
    let matches = db
      .prepare(
        `
          SELECT * FROM match
          WHERE filename NOT IN (SELECT filename FROM train)
          AND id > ?
          ORDER BY createdAt DESC LIMIT 100
        `
      )
      .bind(id || 0)
      .all();

    matches = await Promise.all(
      matches.map(async (obj) => {
        const { id, filename, event, response } = obj;
        const { camera, type, zones } = JSON.parse(event);

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
        };

        if (fs.existsSync(`${STORAGE_PATH}/${key}`)) {
          const base64 = await sharp(`${STORAGE_PATH}/${key}`).resize(500).toBuffer();
          const { width, height } = await sizeOf(`${STORAGE_PATH}/${key}`);
          output.file.base64 = base64.toString('base64');
          output.file.width = width;
          output.file.height = height;
        }

        return output;
      })
    );
    matches = matches.flat();
    respond(HTTPSuccess(OK, { matches }), res);
  } catch (error) {
    respond(error, res);
  }
};

module.exports.patch = async (req, res) => {
  try {
    const { folder, matches } = req.body;
    matches.forEach((obj) => {
      filesystem.move(
        `${STORAGE_PATH}/${obj.key}`,
        `${STORAGE_PATH}/train/${folder}/${obj.filename}`
      );
    });
    respond(HTTPSuccess(OK, { sucess: true }), res);
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
      filesystem.delete(`${STORAGE_PATH}/${file.key}`);
    });
    respond(HTTPSuccess(OK, { sucess: true }), res);
  } catch (error) {
    respond(error, res);
  }
};
