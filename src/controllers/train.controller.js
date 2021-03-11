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
    perf.start();
    const promises = [];
    const files = database.files('trained');
    const names = [];

    files.forEach((file) => {
      if (!names.includes(file.name)) {
        names.push(file.name);
      }
    });

    DETECTORS.forEach((detector) => {
      promises.push(train.remove({ detector, files, names }));
    });
    const results = await Promise.all(promises);
    const db = database.connect();
    db.prepare('DELETE FROM train').run();
    logger.log(
      `${time.current()}\ndone untraining ${files.length} file(s) in ${parseFloat(
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
  res.json({ success: true, message: 'training queued: check logs for details' });
  const images = database.files('untrained');
  await train.queue(images);
};
