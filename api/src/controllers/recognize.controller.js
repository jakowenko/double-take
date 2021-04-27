const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const process = require('../util/process.util');
const logger = require('../util/logger.util');
const time = require('../util/time.util');
const recognize = require('../util/recognize.util');
const frigate = require('../util/frigate.util');
const mqtt = require('../util/mqtt.util');
const { respond, HTTPSuccess, HTTPError } = require('../util/respond.util');
const { OK, BAD_REQUEST } = require('../constants/http-status');

const {
  FRIGATE_URL,
  FRIGATE_IMAGE_HEIGHT,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  MQTT_HOST,
} = require('../constants');

const { IDS, MATCH_IDS } = {
  IDS: [],
  MATCH_IDS: [],
};

let PROCESSING = false;

module.exports.start = async (req, res) => {
  try {
    const isFrigateEvent = req.method === 'POST';
    let event = {
      options: {
        break: req.query.break,
        results: req.query.results,
        attempts: req.query.attempts,
      },
    };

    if (isFrigateEvent) {
      const { type } = req.body;
      const attributes = req.body.after ? req.body.after : req.body.before;
      const { id, label, camera, current_zones: zones } = attributes;
      event = { id, label, camera, zones, type, ...event };
    } else {
      const { url, camera } = req.query;

      event = { id: uuidv4(), url, camera, zones: [], ...event };
    }

    const { id, camera, zones, url } = event;
    const { break: breakMatch, results: resultsOutput, attempts: manualAttempts } = event.options;

    if (isFrigateEvent && FRIGATE_URL) {
      try {
        const check = await frigate.checks({
          ...event,
          PROCESSING,
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

    const promises = [];

    const config = {
      isFrigateEvent,
      breakMatch,
      id,
      MATCH_IDS,
    };

    if (isFrigateEvent) {
      promises.push(
        process.polling(event, {
          ...config,
          retries: LATEST_RETRIES,
          type: 'latest',
          url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=${FRIGATE_IMAGE_HEIGHT}`,
        })
      );
      promises.push(
        process.polling(event, {
          ...config,
          retries: SNAPSHOT_RETRIES,
          type: 'snapshot',
          url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=${FRIGATE_IMAGE_HEIGHT}`,
        })
      );
    } else {
      promises.push(
        process.polling(event, {
          ...config,
          retries: parseInt(manualAttempts, 10),
          type: 'manual',
          url,
        })
      );
    }

    const { best, results, attempts } = recognize.normalize(await Promise.all(promises));

    const duration = parseFloat((perf.stop('request').time / 1000).toFixed(2));
    const output = {
      id,
      duration,
      timestamp: time.current(),
      attempts,
      camera,
      zones,
      matches: JSON.parse(JSON.stringify(best)).map((obj) => {
        delete obj.tmp;
        return obj;
      }),
    };

    if (resultsOutput === 'all')
      output.results = JSON.parse(JSON.stringify(results)).map((group) => {
        group.results.forEach((attempt) => {
          delete attempt.tmp;
        });
        return group;
      });

    logger.log('response:');
    logger.log(output);
    logger.log(`${time.current()}\ndone processing ${camera}: ${id} in ${duration} sec`, {
      dashes: true,
    });

    PROCESSING = false;

    respond(HTTPSuccess(OK, output), res);

    if (MQTT_HOST) {
      mqtt.publish(output);
    }

    if (output.matches.length) {
      IDS.push(id);
    }
  } catch (error) {
    logger.log(error.message);
    PROCESSING = false;
    respond(error, res);
  }
};
