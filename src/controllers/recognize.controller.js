const fs = require('fs');
const perf = require('execution-time')();
const recognize = require('../util/recognize.util');
const events = require('../util/events.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');

const {
  FRIGATE_URL,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
  STORAGE_PATH,
  DETECTORS,
} = require('../constants');

const { IDS, MATCH_IDS } = {
  IDS: [],
  MATCH_IDS: [],
};

let { PROCESSING, LAST_CAMERA } = {
  PROCESSING: false,
  LAST_CAMERA: false,
};

module.exports.start = async (req, res) => {
  try {
    const test = req.route.path === '/recognize/test';
    const url = test ? req.query.url : null;
    const { type } = test ? 'TEST' : req.body;
    const attributes = test ? events.test() : req.body.after ? req.body.after : req.body.before;
    const { id, label, camera } = attributes;

    if (test && !req.query.url) {
      return res.status(400).json({ message: `test events require a url` });
    }

    if (type === 'end') {
      return res.status(200).json({ message: `skip processing on ${type} events` });
    }

    if (label !== 'person') {
      logger.log(`${id} label not a person - ${label} found`, { verbose: true });
      return res.status(200).json({
        message: `${id} label not a person - ${label} found`,
      });
    }

    if (PROCESSING && type !== 'start') {
      logger.log(`still processing previous request`, { verbose: true });
      return res.status(200).json({ message: `still processing previous request` });
    }

    if (IDS.includes(id)) {
      logger.log(`already processed ${id}`, { verbose: true });
      return res.status(200).json({
        message: `already processed and found a match ${id}`,
      });
    }

    if (LAST_CAMERA === camera && req.query.pause !== 'false') {
      logger.log(`paused processing ${camera} - recent match found`, { verbose: true });
      return res.status(200).json({
        message: `paused processing ${camera} - recent match found`,
      });
    }

    logger.log(`processing ${id} @ ${time.current()}`, { dashes: true });
    perf.start('request');
    PROCESSING = true;

    const promises = [];
    DETECTORS.forEach((detector) => {
      if (test) {
        promises.push(
          this.polling({
            detector,
            retries: 3,
            attributes,
            type: 'test',
            url,
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
    const filtered = recognize.filter(results);
    const seconds = parseFloat((perf.stop('request').time / 1000).toFixed(2));

    const output = {
      id,
      duration: seconds,
      time: time.current(),
      attempts: filtered.attempts,
      camera,
      room: camera.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      matches: filtered.matches,
    };

    results.forEach((result) => {
      delete result.matches;
      logger.log(result);
    });

    logger.log('response:');
    logger.log(output);
    logger.log(`done processing ${id} in ${seconds} sec @ ${time.current()}`, { dashes: true });

    PROCESSING = false;

    res.status(200).json(output);

    if (output.matches.length) {
      LAST_CAMERA = camera;
      IDS.push(id);
      setTimeout(() => {
        LAST_CAMERA = false;
      }, 3 * 60 * 1000);
      return;
    }
  } catch (error) {
    logger.log(error.message);
    PROCESSING = false;
    LAST_CAMERA = false;
    res.status(500).json({ error: error.message });
  }
};

module.exports.polling = async ({ detector, retries, attributes, type, url }) => {
  const results = [];
  const matches = [];
  const { id } = attributes;
  let attempts = 0;
  perf.start(type);
  for (let i = 0; i < retries; i++) {
    if (MATCH_IDS.includes(id)) break;
    attempts = i + 1;

    logger.log(`${detector}: ${type} attempt ${attempts}`, { verbose: true });

    const tmp = `/tmp/${id}-${type}.jpg`;
    const file = `${STORAGE_PATH}/matches/${id}-${type}.jpg`;
    const stream = await recognize.stream(url);

    if (stream) {
      await recognize.write(stream, tmp);
      const data = await recognize.process(detector, tmp, url);

      if (data) {
        const faces = data;

        faces.forEach((face) => {
          face.attempt = i + 1;
          results.push({ ...face });
          if (face.confidence >= CONFIDENCE) {
            matches.push(face);
          }
        });
        if (matches.length) {
          MATCH_IDS.push(id);
          await recognize.write(fs.createReadStream(tmp), file);
          break;
        }
      }
    }
  }

  const duration = parseFloat((perf.stop(type).time / 1000).toFixed(2));

  return { duration, type, results, matches, attempts, detector };
};
