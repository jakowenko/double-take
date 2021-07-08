const perf = require('execution-time')();
const fs = require('fs');
const sharp = require('sharp');
const database = require('../util/db.util');
const train = require('../util/train.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { STORAGE, DETECTORS } = require('../constants');
const { tryParseJSON } = require('../util/validators.util');

module.exports.get = async (req, res) => {
  try {
    const db = database.connect();
    let files = db
      .prepare(
        'SELECT id, name, filename, createdAt FROM file WHERE isActive = 1 ORDER BY createdAt DESC'
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
          const base64 = await sharp(`${STORAGE.PATH}/${key}`).resize(500).toBuffer();
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
    const { name } = req.params;

    perf.start();
    const promises = [];

    const detectors = Object.fromEntries(
      Object.entries(DETECTORS).map(([k, v]) => [k.toLowerCase(), v])
    );
    for (const [detector] of Object.entries(detectors)) {
      promises.push(train.remove({ detector, name }));
      const db = database.connect();
      db.prepare('DELETE FROM train WHERE detector = ? AND name = ?').run(detector, name);
    }
    const results = [...(await Promise.all(promises))];

    console.log(
      `done untraining for ${name} in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`
    );

    respond(HTTPSuccess(OK, results), res);
  } catch (error) {
    console.error(`train delete error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.add = async (req, res) => {
  try {
    const { name } = req.params;
    const files = await filesystem.files().train();
    database.insert('init', files);
    const images = database.files('untrained', name);

    respond(
      HTTPSuccess(OK, {
        message: `training queued for ${name} using ${images.length} image(s): check logs for details`,
      }),
      res
    );

    await train.queue(images);
  } catch (error) {
    console.error(`train init error: ${error.message}`);
    respond(error, res);
  }
};
