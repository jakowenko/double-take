const fs = require('fs');
const perf = require('execution-time')();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
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

module.exports.camera = async (req, res) => {
  const { name, camera } = req.params;
  const { attempts } = req.query;

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

    respond(HTTPSuccess(OK, { camera, name, results }), res);
  } catch (error) {
    logger.log(`train camera error: ${error.message}`);
    respond(error, res);
  }
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
