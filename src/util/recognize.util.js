const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger.util');

const { FACEBOX_URL, COMPREFACE_URL, COMPREFACE_API_KEY } = require('../constants');

module.exports.process = async (detector, tmp) => {
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

module.exports.filter = ({ id, camera, results = [] }) => {
  const matches = {};
  const totalAttempts = results.reduce((a, { attempts }) => a + attempts, 0);
  results.forEach((result) => {
    result.matches.forEach((match) => {
      match.detector = result.detector;
      match.attempts = totalAttempts;
      match.type = result.type;
      match.time = result.time;
      match.camera = camera;
      match.room = camera.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      match.id = id;
      if (matches[match.name] === undefined) {
        matches[match.name] = match;
      }
      if (matches[match.name].confidence < match.confidence) {
        matches[match.name] = match;
      }
    });
  });
  return matches;
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

module.exports.write = async (stream, file) => {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(file);
    stream.pipe(out);
    out
      .on('finish', () => {
        resolve();
      })
      .on('error', (error) => {
        logger.log(`write error: ${error.message}`);
      });
  });
};
