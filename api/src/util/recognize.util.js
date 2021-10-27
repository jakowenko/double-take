const fs = require('fs');
const { STORAGE } = require('../constants')();

module.exports.save = {
  latest: (camera, best = [], misses = [], unknown = {}) => {
    const names = [];
    const cameras = [];

    [...best, ...misses].forEach(({ name, filename }) => {
      if (!names.includes(name)) {
        fs.copyFileSync(
          `${STORAGE.MEDIA.PATH}/matches/${filename}`,
          `${STORAGE.MEDIA.PATH}/latest/${name}.jpg`
        );
        names.push(name);
      }

      if (!cameras.includes(camera)) {
        fs.copyFileSync(
          `${STORAGE.MEDIA.PATH}/matches/${filename}`,
          `${STORAGE.MEDIA.PATH}/latest/${camera}.jpg`
        );
        cameras.push(camera);
      }
    });
    if (unknown.filename) {
      fs.copyFileSync(
        `${STORAGE.MEDIA.PATH}/matches/${unknown.filename}`,
        `${STORAGE.MEDIA.PATH}/latest/unknown.jpg`
      );
      if (!best.length && !misses.length)
        fs.copyFileSync(
          `${STORAGE.MEDIA.PATH}/matches/${unknown.filename}`,
          `${STORAGE.MEDIA.PATH}/latest/${camera}.jpg`
        );
    }
  },
};

module.exports.normalize = (results = []) => {
  const best = { matches: [], misses: [] };
  const tmp = { matches: {}, misses: {} };
  let unknown = {};

  let attempts = 0;
  results.forEach((group) => {
    attempts += group.attempts;
    group.results.forEach((attempt) => {
      const matches = attempt.results.filter((obj) => obj.match);
      const misses = attempt.results.filter((obj) => !obj.match && obj.name !== 'unknown');
      const unknowns = attempt.results.filter((obj) => obj.name === 'unknown');

      unknowns.forEach((obj) => {
        if (unknown.confidence === undefined || unknown.confidence < obj.confidence) {
          unknown = {
            ...obj,
            type: group.type,
            duration: attempt.duration,
            detector: attempt.detector,
            filename: attempt.filename,
            base64: attempt.base64 || null,
          };
        }
      });

      matches.forEach((match) => {
        if (
          tmp.matches[match.name] === undefined ||
          tmp.matches[match.name].confidence < match.confidence
        ) {
          tmp.matches[match.name] = {
            ...match,
            type: group.type,
            duration: attempt.duration,
            detector: attempt.detector,
            filename: attempt.filename,
            base64: attempt.base64 || null,
          };
        }
      });

      misses.forEach((miss) => {
        if (
          tmp.misses[miss.name] === undefined ||
          tmp.misses[miss.name].confidence < miss.confidence
        ) {
          tmp.misses[miss.name] = {
            ...miss,
            type: group.type,
            duration: attempt.duration,
            detector: attempt.detector,
            filename: attempt.filename,
            base64: attempt.base64 || null,
          };
        }
      });
    });
  });

  for (const value of Object.values(tmp.matches)) best.matches.push(value);
  for (const value of Object.values(tmp.misses)) best.misses.push(value);

  return { best: best.matches, misses: best.misses, results, attempts, unknown };
};
