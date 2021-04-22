module.exports.normalize = (results = []) => {
  const best = [];
  const tmp = {};

  let attempts = 0;
  results.forEach((group) => {
    attempts += group.attempts;
    group.results.forEach((attempt) => {
      if (attempt.matches.length) {
        attempt.matches.forEach((match) => {
          if (tmp[match.name] === undefined || tmp[match.name].confidence < match.confidence) {
            tmp[match.name] = {
              ...match,
              type: group.type,
              detector: attempt.detector,
              tmp: attempt.tmp,
              filename: attempt.filename,
            };
          }
        });
      }
    });
  });

  for (const value of Object.values(tmp)) {
    best.push(value);
  }

  return { best, results, attempts };
};
