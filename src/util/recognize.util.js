const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger.util');

const { FACEBOX_URL, COMPREFACE_URL, COMPREFACE_API_KEY } = require('../constants');

module.exports.process = async (detector, tmp, url) => {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tmp));
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
        : await axios({
            method: 'post',
            headers: {
              ...formData.getHeaders(),
            },
            url: `${FACEBOX_URL}/facebox/check`,
            data: formData,
          });

    const data = this.normalize(detector, request.data);

    return data;
  } catch (error) {
    if (error.response.data.error) {
      logger.log(`${detector} process error: ${error.response.data.error}`);
    } else {
      logger.log(`${detector} process error: ${error.message}`);
    }
    logger.log(url);
  }
};

module.exports.normalize = (detector, data) => {
  const results = [];

  if (detector === 'facebox') {
    const { faces } = data;

    faces.forEach((face) => {
      if (face.matched) {
        results.push({
          name: face.name,
          confidence: parseFloat((face.confidence * 100).toFixed(2)),
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
          name: face.face_name,
          confidence: parseFloat((face.similarity * 100).toFixed(2)),
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
    logger.log(url);
    return false;
  }
};
