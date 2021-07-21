const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const process = require('../util/process.util');
const actions = require('../util/detectors/actions');
const notify = require('../util/notify/actions');
const time = require('../util/time.util');
const recognize = require('../util/recognize.util');
const frigate = require('../util/frigate.util');
const mqtt = require('../util/mqtt.util');
const { respond, HTTPSuccess, HTTPError } = require('../util/respond.util');
const { lowercaseKeys } = require('../util/helpers.util');
const { OK, BAD_REQUEST } = require('../constants/http-status');

const { FRIGATE, DETECTORS } = require('../constants');

const { IDS, MATCH_IDS } = {
  IDS: [],
  MATCH_IDS: [],
};

let PROCESSING = false;

module.exports.test = async (req, res) => {
  try {
    const promises = [];
    for (const [detector] of Object.entries(lowercaseKeys(DETECTORS))) {
      promises.push(
        actions.recognize({ detector, test: true, key: `${__dirname}/../static/img/lenna.jpg` })
      );
    }
    const results = await Promise.all(promises);
    const output = results.map((result, i) => ({
      detector: Object.entries(lowercaseKeys(DETECTORS))[i][0],
      status: result.status,
      response: result.data,
    }));
    respond(HTTPError(OK, output), res);
  } catch (error) {
    respond(error, res);
  }
};

module.exports.start = async (req, res) => {
  try {
    let event = {
      type: req.method === 'POST' ? 'frigate' : req.query.type,
      options: {
        break: req.query.break,
        results: req.query.results,
        attempts: req.query.attempts,
      },
    };

    if (event.type === 'frigate') {
      const { type: frigateEventType } = req.body;
      const attributes = req.body.after ? req.body.after : req.body.before;
      const { id, label, camera, current_zones: zones } = attributes;
      event = { id, label, camera, zones, frigateEventType, ...event };
    } else {
      const { url, camera } = req.query;

      event = { id: uuidv4(), url, camera, zones: [], ...event };
    }

    const { id, camera, zones, url } = event;
    const { break: breakMatch, results: resultsOutput, attempts: manualAttempts } = event.options;

    if (!DETECTORS) {
      return respond(HTTPError(BAD_REQUEST, 'no detectors configured'), res);
    }

    if (event.type === 'frigate') {
      try {
        const check = await frigate.checks({
          ...event,
          PROCESSING,
          IDS,
        });
        if (check !== true) {
          return respond(HTTPError(BAD_REQUEST, check), res);
        }
      } catch (error) {
        throw HTTPError(BAD_REQUEST, error.message);
      }
    }

    console.log(`processing ${camera}: ${id}`);
    perf.start('request');
    PROCESSING = true;

    const promises = [];

    const config = {
      breakMatch,
      id,
      MATCH_IDS,
    };

    if (event.type === 'frigate') {
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
            type: event.type,
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

    console.log(`done processing ${camera}: ${id} in ${duration} sec`);
    console.log(output);

    PROCESSING = false;

    respond(HTTPSuccess(OK, output), res);

    mqtt.recognize(output);

    notify.publish(output, camera, results);

    if (output.matches.length) {
      IDS.push(id);
    }
  } catch (error) {
    console.error(error.message);
    PROCESSING = false;
    respond(error, res);
  }
};
