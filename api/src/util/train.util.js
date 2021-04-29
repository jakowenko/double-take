const perf = require('execution-time')();
const time = require('./time.util');
const logger = require('./logger.util');
const database = require('./db.util');
const { train, remove } = require('./detectors/actions');

const { DETECTORS } = require('../constants');

module.exports.queue = async (files) => {
  try {
    perf.start();
    logger.log(`${time.current()}\nqueuing ${files.length} file(s) for training`);

    const inserts = [];
    const outputs = [];
    for (let i = 0; i < files.length; i++) {
      const output = [];
      const promises = [];
      const { id, name, filename, key } = files[i];
      logger.log(`file ${i + 1}: ${name} - ${filename}`);

      DETECTORS.forEach((detector) => {
        promises.push(this.process({ name, key, detector }));
      });
      const results = await Promise.all(promises);

      results.forEach((result, j) => {
        output.push({ ...result, key });
        inserts.push({
          fileId: id,
          name,
          filename,
          meta: JSON.stringify(result),
          detector: DETECTORS[j],
        });
      });
      outputs.push(output);
    }
    database.insert('train', inserts);
    logger.log(`training complete in ${parseFloat((perf.stop().time / 1000).toFixed(2))} sec`);
    return outputs;
  } catch (error) {
    logger.log(`queue error: ${error.message}`);
  }
};

module.exports.process = async ({ name, key, detector }) => {
  try {
    const { status, data } = await train({ name, key, detector });
    return {
      ...data,
      status,
      detector,
    };
  } catch (error) {
    const { status, data } = error.response;
    const message = typeof data === 'string' ? { data } : { ...data };

    if (data.message) {
      logger.log(`${detector} training error: ${data.message}`);
    } else if (data.error) {
      logger.log(`${detector} training error: ${data.error}`);
    } else {
      logger.log(`${detector} training error: ${error.message}`);
    }

    return {
      ...message,
      status,
      detector,
    };
  }
};

module.exports.remove = async ({ detector, name }) => {
  const { data } = await remove({ detector, name });
  return { detector, results: data };
};
