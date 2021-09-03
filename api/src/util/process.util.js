const axios = require('axios');
const fs = require('fs');
const perf = require('execution-time')();
const { v4: uuidv4 } = require('uuid');
const filesystem = require('./fs.util');
const database = require('./db.util');
const mask = require('./mask.image.util');
const sleep = require('./sleep.util');
const { recognize, normalize } = require('./detectors/actions');
const { FRIGATE, STORAGE, SAVE } = require('../constants');
const DETECTORS = require('../constants/config').detectors();

module.exports.polling = async (event, { retries, id, type, url, breakMatch, MATCH_IDS }) => {
  event.type = type;
  breakMatch = !!(breakMatch === 'true' || breakMatch === true);
  const { frigateEventType } = event;
  const allResults = [];
  let attempts = 0;
  let previousContentLength;
  perf.start(type);

  if (await this.isValidURL({ type, url })) {
    if (event.type === 'snapshot' && !mask.hasMask(event)) {
      url = `${url}&crop=1`;
    }

    for (let i = 0; i < retries; i++) {
      if (breakMatch === true && MATCH_IDS.includes(id)) break;

      const stream = await this.stream(url);
      if (stream && previousContentLength !== stream.length) {
        const tmp = {
          source: `${STORAGE.TMP.PATH}/${id}-${type}-${uuidv4()}.jpg`,
          mask: false,
        };
        const filename = `${uuidv4()}.jpg`;

        attempts = i + 1;
        previousContentLength = stream.length;
        filesystem.writer(tmp.source, stream);

        const maskBuffer = await mask.buffer(event, tmp.source);
        if (maskBuffer) {
          const { visible, buffer } = maskBuffer;
          tmp.mask =
            visible === true ? tmp.source : `${STORAGE.TMP.PATH}/${id}-${type}-${uuidv4()}.jpg`;
          filesystem.writer(tmp.mask, buffer);
        }

        const results = await this.start(tmp.mask || tmp.source, attempts);

        const foundMatch = !!results.flatMap((obj) => obj.results.filter((item) => item.match))
          .length;
        const totalFaces = results.flatMap((obj) => obj.results.filter((item) => item)).length;

        if (foundMatch || (SAVE.UNKNOWN && totalFaces > 0))
          await this.save(event, results, filename, maskBuffer?.visible ? tmp.mask : tmp.source);

        allResults.push(...results);

        filesystem.delete(tmp);

        if (foundMatch) {
          MATCH_IDS.push(id);
          if (breakMatch === true) break;
        }
      }
      if (frigateEventType && FRIGATE.ATTEMPTS.DELAY > 0) await sleep(FRIGATE.ATTEMPTS.DELAY);
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
    error.message = `save results error: ${error.message}`;
    console.error(error);
  }
};

module.exports.start = async (filename, attempts = 1) => {
  const promises = [];
  for (const detector of DETECTORS) {
    promises.push(this.process({ detector, tmp: filename }));
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

  return results;
};

module.exports.process = async ({ detector, tmp }) => {
  try {
    perf.start(detector);
    const { data } = await recognize({ detector, key: tmp });
    const duration = parseFloat((perf.stop(detector).time / 1000).toFixed(2));

    return { duration, results: normalize({ detector, data }) };
  } catch (error) {
    error.message = `${detector} process error: ${error.message}`;
    console.error(error);
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
    error.message = `url validation error: ${error.message}`;
    console.error(error);
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
    error.message = `stream error: ${error.message}`;
    console.error(error);
  }
};
