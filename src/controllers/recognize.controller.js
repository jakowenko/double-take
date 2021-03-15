const fs = require('fs');
const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const recognize = require('../util/recognize.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');
const filesystem = require('../util/fs.util');
const frigate = require('../util/frigate.util');
const sleep = require('../util/sleep.util');
const mqtt = require('../util/mqtt.util');

const {
  FRIGATE_URL,
  FRIGATE_IMAGE_HEIGHT,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
  STORAGE_PATH,
  DETECTORS,
  MQTT_HOST,
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
    const { type, manual: isManualEvent } = req.body;
    const {
      url,
      attempts: manualAttempts,
      results: resultsOutput,
      break: breakMatch,
      processing,
    } = req.query;
    const attributes = req.body.after ? req.body.after : req.body.before;
    const { id, label, camera } = isManualEvent ? req.body : attributes;

    if (FRIGATE_URL) {
      const status = await frigate.status();

      if (!status) {
        logger.log('frigate is not responding');
        return res.status(400).json({ message: 'frigate is not responding' });
      }
    }

    if (type === 'end') {
      logger.log(`skip processing on ${type} events`, { verbose: true });
      return res.status(200).json({ message: `skip processing on ${type} events` });
    }

    if (!isManualEvent && label !== 'person') {
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

    if (!isManualEvent && LAST_CAMERA === camera) {
      logger.log(`paused processing ${camera} - recent match found`, { verbose: true });
      return res.status(200).json({
        message: `paused processing ${camera} - recent match found`,
      });
    }

    logger.log(`${time.current()}\nprocessing ${camera}: ${id}`, { dashes: true });
    perf.start('request');
    PROCESSING = true;

    let promises = [];
    let results = [];

    for (let i = 0; i < DETECTORS.length; i++) {
      if (processing === 'serial') {
        promises = [];
      }
      const detector = DETECTORS[i];
      if (isManualEvent) {
        promises.push(
          this.polling({
            breakMatch,
            detector,
            retries: parseInt(manualAttempts, 10),
            id,
            type: 'manual',
            url,
          })
        );
      } else {
        promises.push(
          this.polling({
            breakMatch,
            detector,
            retries: LATEST_RETRIES,
            id,
            type: 'latest',
            url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=${FRIGATE_IMAGE_HEIGHT}&bbox=1`,
          })
        );
        promises.push(
          this.polling({
            breakMatch,
            detector,
            retries: SNAPSHOT_RETRIES,
            id,
            type: 'snapshot',
            url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=${FRIGATE_IMAGE_HEIGHT}&bbox=1`,
          })
        );
      }
      if (processing === 'serial') {
        results = results.concat(await Promise.all(promises));
      }
    }
    if (processing !== 'serial') {
      results = await Promise.all(promises);
    }

    const { attempts, matches } = recognize.filter(results);
    const seconds = parseFloat((perf.stop('request').time / 1000).toFixed(2));
    const output = isManualEvent
      ? {
          id,
          duration: seconds,
          time: time.current(),
          attempts,
          matches,
        }
      : {
          id,
          duration: seconds,
          time: time.current(),
          attempts,
          camera,
          room: camera.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          matches,
        };

    if (resultsOutput === 'all') output.results = results;

    results.forEach((result) => {
      delete result.matches;
      logger.log(result);
    });

    logger.log('response:');
    logger.log(output);
    logger.log(`${time.current()}\ndone processing ${camera}: ${id} in ${seconds} sec`, {
      dashes: true,
    });

    PROCESSING = false;

    res.status(200).json(output);
    if (MQTT_HOST) {
      mqtt.publish(output);
    }

    matches.forEach((match) => {
      const source = `${STORAGE_PATH}/matches/${id}-${match.type}.jpg`;
      const destination = `${STORAGE_PATH}/matches/${match.name}/${id}-${match.type}.jpg`;
      filesystem.writeMatches(match.name, source, destination);

      if (isManualEvent) filesystem.delete(source);
      else {
        filesystem.delete(`${STORAGE_PATH}/matches/${id}-snapshot.jpg`);
        filesystem.delete(`${STORAGE_PATH}/matches/${id}-latest.jpg`);
      }
    });

    if (output.matches.length) {
      LAST_CAMERA = camera;
      IDS.push(id);
      setTimeout(() => {
        LAST_CAMERA = false;
      }, 3 * 60 * 1000);
    }
  } catch (error) {
    logger.log(error.message);
    PROCESSING = false;
    LAST_CAMERA = false;
    res.status(500).json({ error: error.message });
  }
};

module.exports.polling = async ({ detector, retries, id, type, url, breakMatch }) => {
  breakMatch = !!(breakMatch === 'true' || breakMatch === true);
  const results = [];
  const matches = [];
  let attempts = 0;
  perf.start(`${detector}-${type}`);

  const isValidURL = await recognize.isValidURL({ detector, type, url });

  if (isValidURL) {
    for (let i = 0; i < retries; i++) {
      if (breakMatch === true && MATCH_IDS.includes(id)) break;
      attempts = i + 1;

      const jitter = Math.floor(Math.random() * (1 * 1000 - 0 * 100) + 0 * 1000) / (1 * 1000);
      await sleep(jitter);

      logger.log(`${detector}: ${type} attempt ${attempts}`, { verbose: true });

      const tmp = `/tmp/${id}-${type}-${uuidv4()}.jpg`;
      const file = `${STORAGE_PATH}/matches/${id}-${type}.jpg`;
      const stream = await recognize.stream(url);

      if (stream) {
        await filesystem.writer(stream, tmp);
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
            await filesystem.writer(fs.createReadStream(tmp), file);
            if (breakMatch === true) break;
          }
        }
      }
    }
  }

  const duration = parseFloat((perf.stop(`${detector}-${type}`).time / 1000).toFixed(2));

  return { duration, type, results, matches, attempts, detector };
};
