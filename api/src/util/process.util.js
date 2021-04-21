const axios = require('axios');
const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger.util');
const sleep = require('./sleep.util');
const filesystem = require('./fs.util');
const { recognize, normalize } = require('./detectors/actions');

module.exports.polling = async ({
  isFrigateEvent,
  detector,
  retries,
  id,
  type,
  url,
  breakMatch,
  MATCH_IDS,
}) => {
  breakMatch = !!(breakMatch === 'true' || breakMatch === true);
  const allResults = [];
  const allMisses = [];
  let attempts = 0;
  perf.start(`${detector}-${type}`);

  if (await this.isValidURL({ detector, type, url })) {
    for (let i = 0; i < retries; i++) {
      if (breakMatch === true && MATCH_IDS.includes(id)) break;
      attempts = i + 1;

      if (isFrigateEvent) await this.addJitter(1);

      logger.log(`${detector}: ${type} attempt ${attempts}`, { verbose: true });

      const tmp = `/tmp/${id}-${type}-${uuidv4()}.jpg`;

      const stream = await this.stream(url);
      if (stream) {
        await filesystem.writer(stream, tmp);
        const results = await this.process({ attempt: attempts, detector, tmp });

        if (Array.isArray(results)) {
          const matches = results
            .filter((result) => result.match)
            .map((match) => {
              match.tmp = tmp;
              match.filename = `${uuidv4()}.jpg`;
              return match;
            });
          const misses = results
            .filter((result) => !result.match)
            .map((miss) => {
              miss.tmp = tmp;
              miss.filename = `${uuidv4()}.jpg`;
              return miss;
            });

          if (misses.length) {
            allMisses.push(...misses);
          }

          if (matches.length) {
            allResults.push(...results);
            MATCH_IDS.push(id);
            if (breakMatch === true) break;
          }
        }
      }
    }
  }

  const duration = parseFloat((perf.stop(`${detector}-${type}`).time / 1000).toFixed(2));

  return {
    duration,
    type,
    misses: allMisses,
    matches: allResults.filter((result) => result.match),
    attempts,
    detector,
  };
};

module.exports.process = async ({ attempt, detector, tmp }) => {
  try {
    perf.start(detector);
    const { data } = await recognize({ detector, key: tmp });
    const duration = parseFloat((perf.stop(detector).time / 1000).toFixed(2));

    return normalize({ detector, data, attempt, duration });
  } catch (error) {
    if (error.response && error.response.data.error) {
      logger.log(`${detector} process error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} process error: ${error.message}`);
    }
  }
};

module.exports.isValidURL = async ({ detector, type, url }) => {
  const validOptions = ['image/jpg', 'image/jpeg', 'image/png'];
  try {
    const request = await axios({
      method: 'head',
      url,
    });
    const { headers } = request;
    const isValid = validOptions.includes(headers['content-type']);
    if (!isValid) {
      logger.log(`${detector} url validation failed for ${type}: ${url}`);
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
