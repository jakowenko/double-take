const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const perf = require('execution-time')();
const recognize = require('../util/recognize.util');
const events = require('../util/events.util');
const logger = require('../util/logger.util');
const {
  FRIGATE_URL,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
  STORAGE_PATH,
  DETECTORS,
  TZ,
} = require('../constants');

const config = {
  processing: false,
  lastMatchCamera: null,
};
const ids = [];
const matchIds = [];

module.exports.start = async (req, res) => {
  try {
    const currentTime = moment().tz(TZ).format('MM/DD/YYYY hh:mm:ssa z');
    const { test } = req.query;
    const { type } = test ? 'TEST' : req.body;
    const attributes = test ? events.test() : req.body.after ? req.body.after : req.body.before;
    const { id, label, camera } = attributes;

    if (type === 'end') {
      return res.status(200).json({ message: `skip processing on ${type} events` });
    }

    if (label !== 'person') {
      logger.log(`${id} label not a person - ${label} found`, { verbose: true });
      return res.status(200).json({
        message: `${id} label not a person - ${label} found`,
      });
    }

    if (config.processing && type !== 'start') {
      logger.log(`still processing previous request`, { verbose: true });
      return res.status(200).json({ message: `still processing previous request` });
    }

    if (ids.includes(id)) {
      logger.log(`already processed ${id}`, { verbose: true });
      return res.status(200).json({
        message: `already processed and found a match ${id}`,
      });
    }

    if (config.lastMatchCamera === camera && !test) {
      logger.log(`paused processing ${camera} - recent match found`, { verbose: true });
      return res.status(200).json({
        message: `paused processing ${camera} - recent match found`,
      });
    }

    logger.log(`${currentTime}`);

    logger.log(`processing ${id}`);
    perf.start('request');
    config.processing = true;

    const promises = [];
    DETECTORS.forEach((detector) => {
      if (test) {
        promises.push(
          this.polling({
            detector,
            retries: 3,
            attributes,
            type: 'test',
            url: test,
          })
        );
      } else {
        promises.push(
          this.polling({
            detector,
            retries: SNAPSHOT_RETRIES,
            attributes,
            type: 'snapshot',
            url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=500&bbox=1`,
          })
        );
        promises.push(
          this.polling({
            detector,
            retries: LATEST_RETRIES,
            attributes,
            type: 'latest',
            url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=500&bbox=1`,
          })
        );
      }
    });
    const results = await Promise.all(promises);
    const filteredMatches = await recognize.filter({ id, camera, results });
    const seconds = parseFloat((perf.stop('request').time / 1000).toFixed(2));

    const matches = [];
    for (const value of Object.values(filteredMatches)) {
      value.totalTime = seconds;
      matches.push(value);
    }

    matchIds.splice(matchIds.indexOf(id), 1);

    logger.log('all matches');
    results.forEach((result) => {
      result.results.forEach((face) => {
        logger.log(face);
      });
    });
    logger.log('filtered & best matches');
    logger.log(matches);
    logger.log(`done processing ${id} in ${seconds} sec`);

    config.processing = false;

    res.status(200).json(matches);

    if (matches.length) {
      config.lastMatchCamera = camera;
      ids.push(id);
      setTimeout(() => {
        delete config.lastMatchCamera;
      }, 3 * 60 * 1000);
      return;
    }
  } catch (error) {
    logger.log(error.message);
    config.processing = false;
    delete config.lastMatchCamera;
    res.status(500).json({ error: error.message });
  }
};

module.exports.clean = () => {
  fs.readdir('matches', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      // eslint-disable-next-line no-shadow
      fs.unlink(path.join('matches', file), (err) => {
        if (err) throw err;
      });
    }
  });
};

module.exports.polling = async ({ detector, retries, attributes, type, url }) => {
  const results = [];
  const matches = [];
  const { id } = attributes;
  let attempts = 0;
  perf.start(type);
  for (let i = 0; i < retries; i++) {
    if (matchIds.includes(id)) break;
    attempts = i + 1;

    logger.log(`${detector}: ${type} attempt ${attempts}`, { verbose: true });

    const tmp = `/tmp/${id}-${type}.jpg`;
    const file = `${STORAGE_PATH}/matches/${id}-${type}.jpg`;
    const stream = await recognize.stream(url);

    if (stream) {
      await recognize.write(stream, tmp);
      const data = await recognize.process(detector, tmp);

      if (data) {
        const faces = data;

        faces.forEach((face) => {
          face.attempt = i + 1;
          results.push({ ...face, detector, type });
          if (face.confidence >= CONFIDENCE) {
            matches.push(face);
          }
        });
        if (matches.length) {
          matchIds.push(id);
          await recognize.write(fs.createReadStream(tmp), file);
          break;
        }
      }
    }
  }

  const { time } = perf.stop(type);
  const attemptTime = parseFloat((time / 1000).toFixed(2));

  return { time: attemptTime, type, results, matches, attempts, detector };
};
