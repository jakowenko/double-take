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

const { FRIGATE_URL, STORAGE_PATH, DETECTORS } = require('../constants');

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

    const ouptput = results.map((result, i) => {
      return {
        detector: DETECTORS[i],
        results: result,
      };
    });

    res.json(ouptput);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.camera = async (req, res) => {
  const output = req.query.output || 'html';
  const { name, camera } = req.params;
  const { count } = req.query.count ? req.query : { count: 5 };

  if (!fs.existsSync(`${STORAGE_PATH}/train/${name}`)) {
    fs.mkdirSync(`${STORAGE_PATH}/train/${name}`);
  }

  try {
    const uuids = [];
    const inserts = [];
    for (let i = 0; i < count; i++) {
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
      return res.json({
        camera,
        name,
        results,
      });
    }

    res.render('train', { camera, name, results });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports.init = async (req, res) => {
  const { name } = req.params;
  const images = database.files('untrained', name);
  res.json({
    success: true,
    message: `training queued for ${name} using ${images.length} image(s): check logs for details`,
  });
  await train.queue(images);
};
