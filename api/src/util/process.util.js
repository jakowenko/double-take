const axios = require('axios');
const fs = require('fs');
const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const sleep = require('./sleep.util');
const filesystem = require('./fs.util');
const database = require('./db.util');
const { recognize, normalize } = require('./detectors/actions');
const { STORAGE, SAVE } = require('../constants');
const DETECTORS = require('../constants/config').detectors();

module.exports.polling = async (event, { retries, id, type, url, breakMatch, MATCH_IDS }) => {
  event.type = type;
  breakMatch = !!(breakMatch === 'true' || breakMatch === true);
  const allResults = [];
  let attempts = 0;
  let previousContentLength;
  perf.start(type);

  if (await this.isValidURL({ type, url })) {
    for (let i = 0; i < retries; i++) {
      if (breakMatch === true && MATCH_IDS.includes(id)) break;

      const tmp = `/tmp/${id}-${type}-${uuidv4()}.jpg`;
      const filename = `${uuidv4()}.jpg`;

      const stream = await this.stream(url);
      if (stream && previousContentLength !== stream.length) {
        attempts = i + 1;
        previousContentLength = stream.length;
        const promises = [];
        filesystem.writer(tmp, stream);

        for (const detector of DETECTORS) {
          promises.push(this.process({ attempt: attempts, detector, tmp }));
        }
        let results = await Promise.all(promises);

        // eslint-disable-next-line no-loop-func
        results = results.map((array, j) => {
          return {
            detector: DETECTORS[j],
            duration: array ? array.duration : 0,
            attempt: attempts,
            results: array ? array.results : [],
            filename,
          };
        });

        const foundMatch = !!results.flatMap((obj) => obj.results.filter((item) => item.match))
          .length;
        const totalFaces = results.flatMap((obj) => obj.results.filter((item) => item)).length;

        if (foundMatch || (SAVE.UNKNOWN && totalFaces > 0))
          await this.save(event, results, filename, tmp);

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

module.exports.save = async (event, results, filename, tmp) => {
  try {
    database.create.match({ filename, event, response: results });
    await filesystem.writerStream(fs.createReadStream(tmp), `${STORAGE.PATH}/matches/${filename}`);
  } catch (error) {
    console.error(`save results error: ${error.message}`);
  }
};

module.exports.process = async ({ detector, tmp }) => {
  try {
    perf.start(detector);
    const { data } = await recognize({ detector, key: tmp });
    const duration = parseFloat((perf.stop(detector).time / 1000).toFixed(2));

    return { duration, results: normalize({ detector, data }) };
  } catch (error) {
    if (error.response && error.response.data.error) {
      console.error(`${detector} process error: ${error.response.data.error}`);
    } else {
      console.error(`${detector} process error: ${error.message}`);
    }
  }
};

module.exports.isValidURL = async ({ type, url }) => {
  const validOptions = ['image/jpg', 'image/jpeg', 'image/png'];
  try {
    const request = await axios({
      method: 'get',
      url,
    });
    const { headers } = request;
    const isValid = validOptions.includes(headers['content-type']);
    if (!isValid) {
      console.error(`url validation failed for ${type}: ${url}`);
    }
    return isValid;
  } catch (error) {
    console.error(`url validation error: ${error.message}`);
    return false;
  }
};

module.exports.stream = async (url) => {
  try {
    const request = await axios({
      method: 'get',
      url,
      responseType: 'arraybuffer',
    });
    return request.data;
  } catch (error) {
    console.error(`stream error: ${error.message}`);
  }
};

module.exports.addJitter = async (seconds) => {
  const jitter =
    Math.floor(Math.random() * (seconds * 1000 - 0 * 100) + 0 * 1000) / (seconds * 1000);
  await sleep(jitter);
};
