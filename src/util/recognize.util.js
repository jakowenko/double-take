const fs = require('fs');
const perf = require('execution-time')();
const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger.util');

const { FACEBOX_URL, COMPREFACE_URL, COMPREFACE_API_KEY, DEEPSTACK_URL } = require('../constants');

module.exports.process = async (detector, tmp) => {
  try {
    perf.start(detector);
    const formData = new FormData();
    if (detector === 'compreface' || detector === 'facebox') {
      formData.append('file', fs.createReadStream(tmp));
    } else {
      formData.append('image', fs.createReadStream(tmp));
    }
    const request =
      detector === 'compreface'
        ? await axios({
            method: 'post',
            headers: {
              ...formData.getHeaders(),
              'x-api-key': COMPREFACE_API_KEY,
            },
            url: `${COMPREFACE_URL}/api/v1/faces/recognize`,
            params: {
              det_prob_threshold: 0.8,
            },
            data: formData,
          })
        : detector === 'facebox'
        ? await axios({
            method: 'post',
            headers: {
              ...formData.getHeaders(),
            },
            url: `${FACEBOX_URL}/facebox/check`,
            data: formData,
          })
        : await axios({
            method: 'post',
            headers: {
              ...formData.getHeaders(),
            },
            url: `${DEEPSTACK_URL}/v1/vision/face/recognize`,
            data: formData,
          });
    const seconds = parseFloat((perf.stop(detector).time / 1000).toFixed(2));

    const data = this.normalize(detector, request.data, seconds);

    return data;
  } catch (error) {
    if (error.response && error.response.data.error) {
      logger.log(`${detector} process error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} process error: ${error.message}`);
    }
  }
};

module.exports.normalize = (detector, data, seconds) => {
  const results = [];

  if (detector === 'facebox') {
    const { faces } = data;

    faces.forEach((obj) => {
      if (obj.matched) {
        results.push({
          duration: seconds,
          name: obj.name,
          confidence: parseFloat((obj.confidence * 100).toFixed(2)),
        });
      }
    });
  }

  if (detector === 'compreface') {
    const { result } = data;
    result.forEach((obj) => {
      if (obj.faces.length) {
        const [face] = obj.faces;
        results.push({
          duration: seconds,
          name: face.face_name,
          confidence: parseFloat((face.similarity * 100).toFixed(2)),
        });
      }
    });
  }

  if (detector === 'deepstack') {
    const { predictions } = data;
    predictions.forEach((obj) => {
      if (obj.userid !== 'unknown') {
        results.push({
          duration: seconds,
          name: obj.userid,
          confidence: parseFloat((obj.confidence * 100).toFixed(2)),
        });
      }
    });
  }

  return results;
};

module.exports.filter = (results = []) => {
  const output = { attempts: results.reduce((a, { attempts }) => a + attempts, 0), matches: [] };
  const tmpMatches = {};
  results.forEach((result) => {
    result.matches.forEach((match) => {
      match.name = match.name.toLowerCase();
      match.detector = result.detector;
      match.type = result.type;
      match.duration = result.duration;
      if (tmpMatches[match.name] === undefined) {
        tmpMatches[match.name] = match;
      }
      if (tmpMatches[match.name].confidence < match.confidence) {
        tmpMatches[match.name] = match;
      }
    });
  });

  for (const value of Object.values(tmpMatches)) {
    output.matches.push(value);
  }

  return output;
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
