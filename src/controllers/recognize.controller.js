const path = require('path');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
const FormData = require('form-data');
const perf = require('execution-time')();
const {
  FACEBOX_URL,
  COMPREFACE_URL,
  FRIGATE_URL,
  COMPREFACE_API_KEY,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
  STORAGE_PATH,
} = require('../constants');

const config = {
  processing: false,
  lastMatchCamera: null,
};
const ids = [];
const matchIds = [];

const DETECTORS = process.env.DETECTORS ? process.env.DETECTORS.replace(/ /g, '').split(',') : [];

module.exports.start = async (req, res) => {
  try {
    const currentTime = moment().tz('America/Detroit').format('MM/DD/YYYY hh:mm:ss z');
    const { type } = req.body;
    const attributes = req.body.after ? req.body.after : req.body.before;
    const { id, label, camera } = attributes;

    if (type === 'end') {
      return res.status(200).json({ message: `skip processing on ${type} events` });
    }

    if (label !== 'person') {
      // console.log(`${id} label not a person - ${label} found`);
      return res.status(200).json({
        message: `${id} label not a person - ${label} found`,
      });
    }

    if (config.processing && type !== 'start') {
      // console.log(`still processing previous request`);
      return res.status(200).json({ message: `still processing previous request` });
    }

    if (ids.includes(id)) {
      // console.log(`already processed ${id}`);
      return res.status(200).json({
        message: `already processed and found a match ${id}`,
      });
    }

    if (config.lastMatchCamera === camera) {
      // console.log(`paused processing ${camera} - recent match found`);
      return res.status(200).json({
        message: `paused processing ${camera} - recent match found`,
      });
    }

    console.log(`${currentTime}`);

    console.log(`processing ${id}`);
    perf.start('request');
    config.processing = true;

    const promises = [];
    DETECTORS.forEach((detector) => {
      promises.push(
        this.polling({
          detector,
          retries: SNAPSHOT_RETRIES,
          attributes,
          type: 'snapshot',
          url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=500&bbox=1`,
        })
      );
      promises.push(
        this.polling({
          detector,
          retries: LATEST_RETRIES,
          attributes,
          type: 'latest',
          url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=500&bbox=1`,
        })
      );
    });
    const results = await Promise.all(promises);

    const filteredMatches = {};
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
        if (filteredMatches[match.name] === undefined) {
          filteredMatches[match.name] = match;
        }
        if (filteredMatches[match.name].confidence < match.confidence) {
          filteredMatches[match.name] = match;
        }
      });
    });

    const { time } = perf.stop('request');
    const seconds = parseFloat((time / 1000).toFixed(2));

    const matches = [];
    for (const value of Object.values(filteredMatches)) {
      value.totalTime = seconds;
      matches.push(value);
    }

    console.log(`done processing ${id} in ${seconds} sec`);
    console.log(matches);
    config.processing = false;
    res.status(200).json(matches);

    // setTimeout(() => {
    //   this.clean();
    // }, 60000);

    if (matches.length) {
      config.lastMatchCamera = camera;
      ids.push(id);
      setTimeout(() => {
        config.lastMatchCamera = '';
      }, 3 * 60 * 1000);
      return;
    }
  } catch (error) {
    config.lastMatchCamera = '';
    config.processing = false;
    res.status(500).json({ error: error.message });
  }
};

module.exports.clean = () => {
  fs.readdir('matches', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      // eslint-disable-next-line no-shadow
      fs.unlink(path.join('matches', file), (err) => {
        if (err) throw err;
      });
    }
  });
};

module.exports.polling = async ({ detector, retries, attributes, type, url }) => {
  const matches = [];
  const { id } = attributes;
  let attempts = 0;
  perf.start(type);
  for (let i = 0; i < retries; i++) {
    if (matchIds.includes(id)) break;
    attempts = i + 1;
    // console.log(`${detector}: ${type} attempt ${i + 1}`);
    const cameraStream = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });
    const tmp = `/tmp/${id}-${type}.jpg`;
    const file = `${STORAGE_PATH}/matches/${id}-${type}.jpg`;

    await this.writeFile(cameraStream.data, tmp);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tmp));
    const recognize =
      detector === 'compreface'
        ? await axios({
            method: 'post',
            headers: {
              ...formData.getHeaders(),
              'x-api-key': COMPREFACE_API_KEY,
            },
            url: `${COMPREFACE_URL}/api/v1/faces/recognize`,
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

    const { faces } = detector === 'facebox' ? recognize.data : { faces: [] };
    if (detector === 'compreface') {
      const { result } = recognize.data;
      result.forEach((obj) => {
        if (obj.faces.length) {
          const [face] = obj.faces;
          faces.push({
            matched: true,
            name: face.face_name,
            confidence: face.similarity,
          });
        }
      });
    }

    faces.forEach((face) => {
      if (face.matched) {
        delete face.rect;
        face.attempt = i + 1;
        face.confidence = parseFloat((face.confidence * 100).toFixed(2));
        if (face.confidence >= CONFIDENCE) {
          matches.push(face);
        }
      }
    });
    if (matches.length) {
      matchIds.push(id);
      await this.writeFile(fs.createReadStream(tmp), file);
      break;
    }
  }

  const { time } = perf.stop(type);
  const attemptTime = parseFloat((time / 1000).toFixed(2));

  return { time: attemptTime, type, matches, attempts, detector };
};

module.exports.writeFile = async (stream, file) => {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(file);
    stream.pipe(out);
    out.on('finish', () => {
      resolve();
    });
  });
};

module.exports.recognize = async (type, body) => {
  const matches = [];
  perf.start();
  const recognize = await axios({
    method: 'post',
    url: `${FACEBOX_URL}/facebox/check`,
    data: body,
  });
  const { time } = perf.stop();
  const seconds = parseFloat((time / 1000).toFixed(2));

  const { faces } = recognize.data;

  faces.forEach((face) => {
    if (face.matched) {
      delete face.rect;
      face.confidence = parseFloat((face.confidence * 100).toFixed(2));
      matches.push(face);
    }
  });

  return { time: seconds, type, matches };
};
