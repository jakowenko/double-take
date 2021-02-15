const path = require('path');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment-timezone');
const FormData = require('form-data');
const perf = require('execution-time')();

const config = {
  processing: false,
  lastMatchCamera: '',
};
const ids = [];

const { FACEBOX_URL, FRIGATE_URL } = process.env;

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

    const results = [];
    const latest = await this.polling({
      retries: 10,
      attributes,
      type: 'latest',
      url: `${FRIGATE_URL}/api/${camera}/latest.jpg?h=500&bbox=1`,
    });
    results.push(latest);

    if (!latest.matches.length) {
      results.push(
        await this.polling({
          retries: 3,
          attributes,
          type: 'snapshot',
          url: `${FRIGATE_URL}/api/events/${id}/snapshot.jpg?crop=1&h=500&bbox=1`,
        })
      );
    }

    const filteredMatches = {};
    results.forEach((result) => {
      result.matches.forEach((match) => {
        match.attempts = result.attempts;
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

module.exports.polling = async ({ retries, attributes, type, url }) => {
  const matches = [];
  const { id } = attributes;
  let attempts = 0;
  let attemptTime;
  for (let i = 0; i < retries; i++) {
    perf.start();
    attempts = i + 1;
    // console.log(`${type} attempt ${i + 1}`);
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
    });
    const tmp = `/tmp/${id}-${type}.jpg`;
    const file = `matches/${id}-${type}.jpg`;

    await this.writeFile(response.data, tmp);
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tmp));
    const recognize = await axios({
      method: 'post',
      headers: {
        ...formData.getHeaders(),
      },
      url: `${FACEBOX_URL}/facebox/check`,
      data: formData,
    });

    const { faces } = recognize.data;

    faces.forEach((face) => {
      if (face.matched) {
        delete face.rect;
        face.attempt = i + 1;
        face.confidence = parseFloat((face.confidence * 100).toFixed(2));
        // if (face.confidence >= 60)
        matches.push(face);
      }
    });
    const { time } = perf.stop();
    attemptTime = parseFloat((time / 1000).toFixed(2));
    if (matches.length) {
      if (!fs.existsSync('matches')) {
        fs.mkdirSync('matches');
      }
      await this.writeFile(fs.createReadStream(tmp), file);
      break;
    }
    // await sleep(0.25);
  }

  return { time: attemptTime, type, matches, attempts };
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
