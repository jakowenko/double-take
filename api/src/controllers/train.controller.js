const perf = require('execution-time')();
const database = require('../util/db.util');
const train = require('../util/train.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { DETECTORS } = require('../constants');

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

    respond(HTTPSuccess(OK, results), res);
  } catch (error) {
    logger.log(`train delete error: ${error.message}`);
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
    logger.log(`train init error: ${error.message}`);
    respond(error, res);
  }
};
