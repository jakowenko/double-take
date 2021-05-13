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

const { FRIGATE, DETECTORS } = require('../constants');

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

    if (!DETECTORS) {
      return respond(HTTPError(BAD_REQUEST, 'no detectors configured'), res);
    }

    if (isFrigateEvent) {
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
      if (FRIGATE.ATTEMPTS.LATEST)
        promises.push(
          process.polling(
            { ...event },
            {
              ...config,
              retries: FRIGATE.ATTEMPTS.LATEST,
              type: 'latest',
              url: `${FRIGATE.URL}/api/${camera}/latest.jpg?h=${FRIGATE.IMAGE.HEIGHT}`,
            }
          )
        );
      if (FRIGATE.ATTEMPTS.SNAPSHOT)
        promises.push(
          process.polling(
            { ...event },
            {
              ...config,
              retries: FRIGATE.ATTEMPTS.SNAPSHOT,
              type: 'snapshot',
              url: `${FRIGATE.URL}/api/events/${id}/snapshot.jpg?crop=1&h=${FRIGATE.IMAGE.HEIGHT}`,
            }
          )
        );
    } else {
      promises.push(
        process.polling(
          { ...event },
          {
            ...config,
            retries: parseInt(manualAttempts, 10),
            type: 'manual',
            url,
          }
        )
      );
    }

    // return res.json(await Promise.all(promises));
    const { best, unknown, results, attempts } = recognize.normalize(await Promise.all(promises));

    const duration = parseFloat((perf.stop('request').time / 1000).toFixed(2));
    const output = {
      id,
      duration,
      timestamp: time.current(),
      attempts,
      camera,
      zones,
      matches: best,
    };
    if (unknown && Object.keys(unknown).length) output.unknown = unknown;

    if (resultsOutput === 'all') output.results = results;

    logger.log('response:');
    logger.log(output);
    logger.log(`${time.current()}\ndone processing ${camera}: ${id} in ${duration} sec`, {
      dashes: true,
    });

    PROCESSING = false;

    respond(HTTPSuccess(OK, output), res);

    mqtt.publish(output);

    if (output.matches.length) {
      IDS.push(id);
    }
  } catch (error) {
    logger.log(error.message);
    PROCESSING = false;
    respond(error, res);
  }
};
