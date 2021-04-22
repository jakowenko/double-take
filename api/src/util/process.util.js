const axios = require('axios');
const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger.util');
const sleep = require('./sleep.util');
const filesystem = require('./fs.util');
const { recognize, normalize } = require('./detectors/actions');
const { DETECTORS } = require('../constants');

module.exports.polling = async ({
  isFrigateEvent,
  retries,
  id,
  type,
  url,
  breakMatch,
  MATCH_IDS,
}) => {
  breakMatch = !!(breakMatch === 'true' || breakMatch === true);
  const allResults = [];
  let attempts = 0;
  perf.start(type);

  if (await this.isValidURL({ type, url })) {
    for (let i = 0; i < retries; i++) {
      if (breakMatch === true && MATCH_IDS.includes(id)) break;
      attempts = i + 1;

      if (isFrigateEvent) await this.addJitter(1);

      logger.log(`${type} attempt ${attempts}`, { verbose: true });

      const tmp = `/tmp/${id}-${type}-${uuidv4()}.jpg`;
      const filename = `${uuidv4()}.jpg`;

      const stream = await this.stream(url);
      if (stream) {
        const promises = [];
        await filesystem.writer(stream, tmp);

        // eslint-disable-next-line no-loop-func
        DETECTORS.forEach((detector) => {
          promises.push(this.process({ attempt: attempts, detector, tmp }));
        });
        let results = await Promise.all(promises);

        // eslint-disable-next-line no-loop-func
        results = results.map((array, j) => {
          const matches = array.results.filter((obj) => obj.match);
          const misses = array.results.filter((obj) => !obj.match);
          return {
            detector: DETECTORS[j],
            duration: array.duration,
            attempt: attempts,
            matches,
            misses,
            tmp,
            filename,
          };
        });

        const foundMatch = !!results.flatMap((obj) => (obj.matches.length ? true : [])).length;
        allResults.push(...results);

        if (foundMatch) {
          MATCH_IDS.push(id);
          if (breakMatch === true) break;
        }
      }
    }
  }

  const duration = parseFloat((perf.stop(type).time / 1000).toFixed(2));

  return {
    duration,
    type,
    attempts,
    results: allResults,
  };
};

module.exports.process = async ({ detector, tmp }) => {
  try {
    perf.start(detector);
    const { data } = await recognize({ detector, key: tmp });
    const duration = parseFloat((perf.stop(detector).time / 1000).toFixed(2));

    return { duration, results: normalize({ detector, data }) };
  } catch (error) {
    if (error.response && error.response.data.error) {
      logger.log(`${detector} process error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} process error: ${error.message}`);
    }
  }
};

module.exports.isValidURL = async ({ type, url }) => {
  const validOptions = ['image/jpg', 'image/jpeg', 'image/png'];
  try {
    const request = await axios({
      method: 'head',
      url,
    });
    const { headers } = request;
    const isValid = validOptions.includes(headers['content-type']);
    if (!isValid) {
      logger.log(`url validation failed for ${type}: ${url}`);
      logger.log(`content type: ${headers['content-type']}`);
    }
    return isValid;
  } catch (error) {
    logger.log(`url validation error: ${error.message}`);
    return false;
  }
};

module.exports.stream = async (url) => {
  try {
    const request = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });
    return request.data;
  } catch (error) {
    logger.log(`stream error: ${error.message}`);
  }
};

module.exports.addJitter = async (seconds) => {
  const jitter =
    Math.floor(Math.random() * (seconds * 1000 - 0 * 100) + 0 * 1000) / (seconds * 1000);
  await sleep(jitter);
};
