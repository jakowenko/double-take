const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const process = require('../util/process.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');
const recognize = require('../util/recognize.util');
const filesystem = require('../util/fs.util');
const frigate = require('../util/frigate.util');
const mqtt = require('../util/mqtt.util');
const { respond, HTTPSuccess, HTTPError } = require('../util/respond.util');
const { OK, BAD_REQUEST } = require('../constants/http-status');

const {
  FRIGATE_URL,
  FRIGATE_IMAGE_HEIGHT,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  DETECTORS,
  SAVE_UNMATCHED,
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
    const isFrigateEvent = req.method === 'POST';
    const { type } = req.body;
    const {
      url,
      attempts: manualAttempts,
      results: resultsOutput,
      break: breakMatch,
      processing,
    } = req.query;
    const attributes = req.body.after ? req.body.after : req.body.before;
    const { id, label, camera } = isFrigateEvent
      ? attributes
      : { id: uuidv4(), camera: req.query.camera };
    const room = isFrigateEvent
      ? camera.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : req.query.room;

    if (isFrigateEvent && FRIGATE_URL) {
      try {
        const check = await frigate.checks({
          id,
          type,
          label,
          camera,
          PROCESSING,
          LAST_CAMERA,
          IDS,
        });
        if (typeof check === 'string') {
          logger.log(check, { verbose: true });
          return respond(HTTPError(BAD_REQUEST, check), res);
        }
      } catch (error) {
        throw HTTPError(BAD_REQUEST, error.message);
      }
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
      const config = {
        isFrigateEvent,
        breakMatch,
        detector,
        id,
        MATCH_IDS,
      };

      if (isFrigateEvent) {
        promises.push(
          process.polling({
            ...config,
            retries: LATEST_RETRIES,
            type: 'latest',
            url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=${FRIGATE_IMAGE_HEIGHT}`,
          })
        );
        promises.push(
          process.polling({
            ...config,
            retries: SNAPSHOT_RETRIES,
            type: 'snapshot',
            url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=${FRIGATE_IMAGE_HEIGHT}`,
          })
        );
      } else {
        promises.push(
          process.polling({
            ...config,
            retries: parseInt(manualAttempts, 10),
            type: 'manual',
            url,
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
    const duration = parseFloat((perf.stop('request').time / 1000).toFixed(2));
    const output = {
      id,
      duration,
      timestamp: time.current(),
      attempts,
      camera,
      room,
      matches: JSON.parse(JSON.stringify(matches)).map((match) => {
        delete match.box;
        delete match.tmp;
        return match;
      }),
    };

    if (resultsOutput === 'all')
      output.results = JSON.parse(JSON.stringify(results)).map((result) => {
        ['matches', 'misses'].forEach((array) => {
          result[array].forEach((obj) => {
            delete obj.box;
            delete obj.tmp;
          });
        });

        return result;
      });

    logger.log('response:');
    logger.log(output);
    logger.log(`${time.current()}\ndone processing ${camera}: ${id} in ${duration} sec`, {
      dashes: true,
    });

    if (SAVE_UNMATCHED) {
      filesystem.save().unmatched(results);
    }

    filesystem.save().matches(id, matches);

    PROCESSING = false;

    respond(HTTPSuccess(OK, output), res);

    if (MQTT_HOST) {
      mqtt.publish(output);
    }

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
    respond(error, res);
  }
};
