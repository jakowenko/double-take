const perf = require('execution-time')();
const fs = require('fs');
const sharp = require('sharp');
const time = require('../util/time.util');
const database = require('../util/db.util');
const train = require('../util/train.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { STORAGE } = require('../constants');
const { tryParseJSON } = require('../util/validators.util');

module.exports.get = async (req, res) => {
  try {
    const db = database.connect();
    let files = db
      .prepare(
        'SELECT id, name, filename, createdAt FROM file WHERE isActive = 1 ORDER BY name ASC'
      )
      .all();

    files.forEach((file) => {
      file.results = [];
      const trainings = db.prepare('SELECT * FROM train WHERE fileId = ?').all(file.id);
      trainings.forEach(({ detector, meta, createdAt }) => {
        file.results.push({
          detector,
          result: tryParseJSON(meta) || null,
          createdAt,
        });
      });
    });

    files = await Promise.all(
      files.map(async (obj) => {
        const { id, name, filename, results, createdAt } = obj;

        const key = `train/${name}/${filename}`;

        const output = {
          id,
          name,
          file: {
            key,
            filename,
          },
          results,
          createdAt,
        };

        if (fs.existsSync(`${STORAGE.PATH}/${key}`)) {
          const base64 = await sharp(`${STORAGE.PATH}/${key}`)
            .resize(500)
            .withMetadata()
            .toBuffer();
          output.file.base64 = base64.toString('base64');
        }

        return output;
      })
    );
    respond(HTTPSuccess(OK, files), res);
  } catch (error) {
    respond(error, res);
  }
};

module.exports.delete = async (req, res) => {
  try {
    perf.start();
    const { name } = req.params;
    const seconds = parseFloat((perf.stop().time / 1000).toFixed(2));
    const results = await train.remove(name);
    console.log(`done untraining for ${name} in ${seconds} sec`);
    respond(HTTPSuccess(OK, results), res);
  } catch (error) {
    console.error(`train delete error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.add = async (req, res) => {
  try {
    const { name } = req.params;
    respond(HTTPSuccess(OK, { message: `training queued for ${name}` }), res);
    await train.add(name, { files });
  } catch (error) {
    console.error(`train add error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.retrain = async (req, res) => {
  try {
    const { name } = req.params;
    const ids = req.query.ids || [];
    await train.retrain(name, { ids });
    respond(HTTPSuccess(OK, { success: true }), res);
  } catch (error) {
    console.error(`retrain error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.patch = async (req, res) => {
  try {
    const { key, filename } = req.body.file;
    const { folder } = req.body;
    filesystem.move(`${STORAGE.PATH}/${key}`, `${STORAGE.PATH}/train/${folder}/${filename}`);
    train.add(folder, { files: [filename] });

    respond(HTTPSuccess(OK, { success: true }), res);
  } catch (error) {
    console.error(`train add error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.upload = async (req, res) => {
  try {
    const { name } = req.params;
    const files = [];

    await Promise.all(
      req.files.map(async (obj) => {
        const { originalname, buffer } = obj;
        const ext = `.${originalname.split('.').pop()}`;
        const filename = `${originalname.replace(ext, '')}-${time.unix()}${ext}`;
        await filesystem.writer(`${STORAGE.PATH}/train/${name}/${filename}`, buffer);
        files.push(filename);
      })
    );

    train.add(name, { files });

    respond(HTTPSuccess(OK, { success: true }), res);
  } catch (error) {
    console.error(`train add error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.status = async (req, res) => {
  try {
    respond(HTTPSuccess(OK, train.status()), res);
  } catch (error) {
    console.error(`train status error: ${error.message}`);
    respond(error, res);
  }
};
