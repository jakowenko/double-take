const fs = require('fs');
const perf = require('execution-time')();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { ExifTool } = require('exiftool-vendored');
const { writer } = require('../util/fs.util');
const database = require('../util/db.util');
const sleep = require('../util/sleep.util');
const train = require('../util/train.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { FRIGATE_URL, STORAGE_PATH, DETECTORS } = require('../constants');
const { tryParseJSON } = require('../util/validators.util');

module.exports.manage = async (req, res) => {
  const { limit } = req.query;
  let files = await filesystem.files().matches();
  const width = req.query.width ? parseInt(req.query.width, 10) : 500;

  const exiftool = new ExifTool({ taskTimeoutMillis: 1000 });

  files = await Promise.all(
    files.map(async (file) => {
      const { UserComment: exif } = await exiftool.read(`${STORAGE_PATH}/${file.key}`);
      const data = tryParseJSON(exif);
      const { box, confidence, duration, detector } =
        data !== false
          ? data
          : { confidence: null, duration: null, box: { width: null, height: null } };
      const { birthtime: createdAt } = fs.statSync(`${STORAGE_PATH}/${file.key}`);
      const base64 = await sharp(`${STORAGE_PATH}/${file.key}`).resize(width).toBuffer();
      return {
        ...file,
        dimensions: box.width ? `${box.width}x${box.height}` : null,
        confidence: confidence ? `${confidence}%` : null,
        duration: duration ? `${duration} sec` : null,
        detector: detector || null,
        ago: time.ago(createdAt),
        base64: base64.toString('base64'),
      };
    })
  );
  exiftool.end();

  files = files.splice(0, limit);

  const rows = new Array(Math.ceil(files.length / 2)).fill().map(() => files.splice(0, 2));
  const folders = await filesystem.folders().train();
  res.render('manage', { rows, folders });
};

module.exports.file = () => {
  return {
    delete: (req, res) => {
      try {
        const files = JSON.parse(req.body.files);
        files.forEach((file) => {
          filesystem.delete(`${STORAGE_PATH}/${file.key}`);
        });
        respond(HTTPSuccess(OK, { sucess: true }), res);
      } catch (error) {
        logger.log(`manage delete error: ${error.message}`);
        respond(error, res);
      }
    },
    move: async (req, res) => {
      try {
        const files = JSON.parse(req.body.files);
        let folder;

        files.forEach((file) => {
          folder = file.folder;
          filesystem.move(
            `${STORAGE_PATH}/${file.key}`,
            `${STORAGE_PATH}/train/${file.folder}/${file.filename}`
          );
        });
        database.insert('init', await filesystem.files().train());
        respond(HTTPSuccess(OK, { sucess: true }), res);
        await train.queue(database.files('untrained', folder));
      } catch (error) {
        logger.log(`manage move error: ${error.message}`);
        respond(error, res);
      }
    },
  };
};

module.exports.delete = async (req, res) => {
  try {
    const { name } = req.params;

    perf.start();
    const promises = [];

    DETECTORS.forEach((detector) => {
      promises.push(train.remove({ detector, name }));
      const db = database.connect();
      db.prepare('DELETE FROM train WHERE detector = ? AND name = ?').run(detector, name);
    });
    const results = await Promise.all(promises);

    logger.log(
      `${time.current()}\ndone untraining for ${name} in ${parseFloat(
        (perf.stop().time / 1000).toFixed(2)
      )} sec`
    );

    const output = results.map((result, i) => {
      return {
        detector: DETECTORS[i],
        results: result,
      };
    });

    respond(HTTPSuccess(OK, output), res);
  } catch (error) {
    logger.log(`train delete error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.camera = async (req, res) => {
  const { name, camera } = req.params;
  const { output, attempts } = req.query;

  if (!fs.existsSync(`${STORAGE_PATH}/train/${name}`)) {
    fs.mkdirSync(`${STORAGE_PATH}/train/${name}`);
  }

  try {
    const uuids = [];
    const inserts = [];
    for (let i = 0; i < attempts; i++) {
      await sleep(1);
      const uuid = uuidv4();
      const cameraStream = await axios({
        method: 'get',
        url: `${FRIGATE_URL}/api/${camera}/latest.jpg`,
        responseType: 'stream',
      });
      await writer(cameraStream.data, `${STORAGE_PATH}/train/${name}/${camera}-${uuid}.jpg`);
      inserts.push({
        name,
        filename: `${camera}-${uuid}.jpg`,
        uuid,
      });

      uuids.push(uuid);
    }

    database.insert('file', inserts);
    const files = database.files('uuid', uuids);
    const results = await train.queue(files);
    train.cleanup(results);

    if (output === 'json') {
      return respond(
        HTTPSuccess(OK, {
          camera,
          name,
          results,
        }),
        res
      );
    }

    res.render('camera', { camera, name, results });
  } catch (error) {
    logger.log(`train camera error: ${error.message}`);
    respond(error, res);
  }
};

module.exports.init = async (req, res) => {
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
    logger.log(`train init error: ${error.message}`);
    respond(error, res);
  }
};
