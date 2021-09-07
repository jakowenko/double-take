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
            base64: attempt.base64,
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
            base64: attempt.base64,
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
            base64: attempt.base64,
          };
        }
      });
    });
  });

  for (const value of Object.values(tmp.matches)) best.matches.push(value);
  for (const value of Object.values(tmp.misses)) best.misses.push(value);

  return { best: best.matches, misses: best.misses, results, attempts, unknown };
};
