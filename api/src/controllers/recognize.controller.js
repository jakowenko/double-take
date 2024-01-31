const perf = require('execution-time')();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { polling } = require('../util/process.util');
const actions = require('../util/detectors/actions');
const notify = require('../util/notify/actions');
const time = require('../util/time.util');
const recognize = require('../util/recognize.util');
const frigate = require('../util/frigate.util');
const { jwt } = require('../util/auth.util');
const mqtt = require('../util/mqtt.util');
const { emit } = require('../util/socket.util');
const { BAD_REQUEST } = require('../constants/http-status');
const DETECTORS = require('../constants/config').detectors();
const config = require('../constants/config');
const schedule = require('../util/schedule.util');
const { AUTH, TOKEN, SERVER, STORAGE, UI } = require('../constants')();
const fs = require('../util/fs.util');

const { IDS, MATCH_IDS } = {
  IDS: [],
  MATCH_IDS: [],
};

let PROCESSING = false;

module.exports.test = async (req, res) => {
  const promises = [];
  for (const detector of DETECTORS) {
    promises.push(
      actions
        .recognize({ test: true, detector, key: `${__dirname}/../static/img/lenna.jpg` })
        .catch((error) => {
          return { status: 500, data: error.message };
        })
    );
  }
  const results = await Promise.all(promises);
  const output = results.map((result, i) => ({
    detector: DETECTORS[i],
    status: result.status,
    response: result.data,
  }));
  res.send(output);
};

module.exports.start = async (req, res) => {
  try {
    let event = {
      type: req.method === 'POST' ? 'frigate' : req.query.type,
      options: {
        break: req.query.break,
        results: req.query.results,
        attempts: req.query.attempts || null,
      },
    };

    if (event.type === 'frigate') {
      const { type: frigateEventType, topic } = req.body;
      const attributes = req.body.after ? req.body.after : req.body.before;
      const { id, label, camera, area, current_zones: zones } = attributes;
      event = { id, label, camera, area, zones, frigateEventType, topic, ...event };
    } else {
      const { url, camera } = req.query;

      event = { id: uuidv4(), url, camera, zones: [], ...event };
    }

    const { id, camera, zones, url } = event;
    const { break: breakMatch, results: resultsOutput, attempts: manualAttempts } = event.options;

    if (!DETECTORS.length) return res.status(BAD_REQUEST).error('no detectors configured');

    const scheduleCheck = schedule.checks(camera);
    if (scheduleCheck.length) {
      console.verbose('recognition disabled due to schedule');
      console.verbose(scheduleCheck);
      return res
        .status(BAD_REQUEST)
        .send({ error: 'recognition disabled due to schedule', checks: scheduleCheck });
    }

    if (event.type === 'frigate') {
      process.env.FRIGATE_LAST_EVENT = JSON.stringify({ time: time.utc(), camera });
      const check = await frigate.checks({
        ...event,
        PROCESSING,
        IDS,
      });
      if (check !== true) {
        console.verbose(check);
        return res.status(BAD_REQUEST).error(check);
      }
    }

    console.log(`processing ${camera}: ${id}`);
    perf.start('request');
    PROCESSING = true;

    const promises = [];

    if (event.type === 'frigate') {
      const FRIGATE = config.frigate({ id, camera, topic: event.topic });

      if (FRIGATE.ATTEMPTS.LATEST)
        promises.push(
          polling(
            { ...event },
            {
              id,
              MATCH_IDS,
              breakMatch: FRIGATE.STOP_ON_MATCH,
              retries: FRIGATE.ATTEMPTS.LATEST,
              type: 'latest',
              url: FRIGATE.URL.LATEST,
              delay: FRIGATE.ATTEMPTS.DELAY,
            }
          )
        );
      if (FRIGATE.ATTEMPTS.SNAPSHOT)
        promises.push(
          polling(
            { ...event },
            {
              id,
              MATCH_IDS,
              breakMatch: FRIGATE.STOP_ON_MATCH,
              retries: FRIGATE.ATTEMPTS.SNAPSHOT,
              type: 'snapshot',
              url: FRIGATE.URL.SNAPSHOT,
              delay: FRIGATE.ATTEMPTS.DELAY,
            }
          )
        );
    } else {
      promises.push(
        polling(
          { ...event },
          {
            id,
            MATCH_IDS,
            breakMatch,
            retries: parseInt(manualAttempts, 10),
            type: event.type,
            url,
          }
        )
      );
    }

    let normalizedData = {};

    try {
      // Await for all promises to resolve or catch if any of them gets rejected
      const results = await Promise.all(promises);

      // Check if recognize.normalize is a function before calling it
      if (typeof recognize.normalize === 'function') {
        // If recognize.normalize is also async, make sure to await it
        const normalizationResult = await recognize.normalize(results);

        // Ensure that normalizationResult is an object before destructuring
        if (normalizationResult && typeof normalizationResult === 'object') {
          normalizedData = {
            best: normalizationResult.best,
            misses: normalizationResult.misses,
            unknowns: normalizationResult.unknowns,
            results: normalizationResult.results,
            attempts: normalizationResult.attempts,
            counts: normalizationResult.counts,
          };
        } else {
          // Handle case where normalize function returns null, undefined, or non-objects
          console.error('normalize function returned an unexpected result:', normalizationResult);
          // Here you may want to throw an error or continue with alternative logic
        }
      } else {
        throw new Error('recognize.normalize is not a function');
      }
    } catch (error) {
      // Handle errors from Promise.all or recognize.normalize
      console.error('An error occurred while processing promises:', error);
      // Depending on your application's needs, you might throw the error up the stack,
      // return a default structure, or handle it in some other way.
    }

    const { best, misses, unknowns, results, attempts, counts } = normalizedData;

    const duration = parseFloat((perf.stop('request').time / 1000).toFixed(2));
    const output = {
      id,
      duration,
      timestamp: time.current(),
      attempts,
      camera,
      zones,
      counts,
      matches: best,
      misses,
      unknowns,
    };
    if (AUTH) output.token = jwt.sign({ route: 'storage', expiresIn: TOKEN.IMAGE });

    if (resultsOutput === 'all') output.results = results;

    console.log(`done processing ${camera}: ${id} in ${duration} sec`);

    const loggedOutput = JSON.parse(JSON.stringify(output));
    ['matches', 'misses', 'unknowns'].forEach((type) =>
      loggedOutput[type].forEach((result) => delete result.base64)
    );
    console.log(loggedOutput);

    PROCESSING = false;

    console.verbose(`Event type: ${event.type}`);
    recognize.save.latest(camera, best, misses, unknowns[0]);
    mqtt.recognize(output);
    notify.publish(output, camera, results);
    if (event.type === 'frigate') frigate.subLabel(event.topic, id, best);
    if (output.matches.length) IDS.push(id);
    if (results.length) emit('recognize', true);
    res.send(output);
  } catch (error) {
    PROCESSING = false;
    console.error(`An error occurred at ${error.stack}`);
    console.error(`An error occurred when recogniting file: ${error.message}`);
    // res.send(error);
  }
};

module.exports.upload = async (req, res) => {
  res.send({ success: true });
  for (const file of req.files) {
    const { buffer } = file;
    const filename = `${uuidv4()}.jpg`;
    fs.writer(`${STORAGE.TMP.PATH}/${filename}`, buffer);
    await axios({
      method: 'get',
      url: `http://${SERVER.HOST}:${SERVER.PORT}${UI.PATH}/api/recognize`,
      headers: AUTH ? { authorization: jwt.sign({ route: 'recognize' }) } : null,
      params: {
        url: `http://${SERVER.HOST}:${SERVER.PORT}${UI.PATH}/api/${STORAGE.TMP.PATH}/${filename}`,
        camera: 'manual',
      },
      validateStatus: () => true,
    });
    fs.delete(`${STORAGE.TMP.PATH}/${filename}`, buffer);
  }
};
