const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
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
    const db = database.connect();
    let matches = db.prepare('SELECT * FROM match ORDER BY createdAt DESC').all();

    matches = await Promise.all(
      matches.map(async (obj) => {
        const { id } = obj;
        const {
          match,
          name,
          detector,
          confidence,
          type,
          filename,
          box,
          duration,
          camera,
          zones,
        } = JSON.parse(obj.meta);
        const key = `matches/${match ? name : 'unknown'}/${filename}`;
        if (!fs.existsSync(`${STORAGE_PATH}/${key}`)) {
          return [];
        }

        const base64 = await sharp(`${STORAGE_PATH}/${key}`).resize(500).toBuffer();
        const { width, height } = await sizeOf(`${STORAGE_PATH}/${key}`);

        return {
          id,
          name,
          detector,
          confidence,
          type,
          match,
          camera,
          zones,
          box,
          file: {
            key,
            base64: base64.toString('base64'),
            width,
            height,
          },
          duration,
          createdAt: obj.createdAt,
        };
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
        `${STORAGE_PATH}/train/${folder}/${uuidv4()}.jpg`
      );
      const db = database.connect();
      db.prepare('DELETE FROM match WHERE id = ?').run(obj.id);
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
      filesystem.delete(`${STORAGE_PATH}/${file.key}`);
      const db = database.connect();
      db.prepare('DELETE FROM match WHERE id = ?').run(file.id);
    });
    respond(HTTPSuccess(OK, { sucess: true }), res);
  } catch (error) {
    respond(error, res);
  }
};
