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
  const tmp = { matches: {}, misses: {}, counts: {} };
  const unknowns = [];

  let attempts = 0;
  results.forEach((group) => {
    attempts += group.attempts;
    group.results.forEach((attempt) => {
      const face = tmp.counts[attempt.detector];
      if (face)
        tmp.counts[attempt.detector] = {
          count: face.count + attempt.results.length,
          attempts: (face.attempts += 1),
        };
      else tmp.counts[attempt.detector] = { count: attempt.results.length, attempts: 1 };

      const matches = attempt.results.filter((obj) => obj.match);
      const misses = attempt.results.filter((obj) => !obj.match && obj.name !== 'unknown');
      const tmpUnknowns = attempt.results.filter((obj) => obj.name === 'unknown');
      tmpUnknowns.forEach((obj) => {
        unknowns.push({
          ...obj,
          type: group.type,
          duration: attempt.duration,
          detector: attempt.detector,
          filename: attempt.filename,
          base64: attempt.base64 || null,
        });
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

  let personCount = 0;
  for (const [, value] of Object.entries(tmp.counts))
    personCount += Math.round(value.count / value.attempts);

  const counts = {
    person: personCount ? Math.round(personCount / Object.keys(tmp.counts).length) : 0,
    match: best.matches.length,
    miss: best.misses.length,
  };
  counts.unknown = counts.person - counts.match - counts.miss;

  return {
    best: best.matches,
    misses: best.misses,
    results,
    attempts,
    unknowns: unknowns.sort((a, b) => b.confidence - a.confidence),
    counts,
  };
};
