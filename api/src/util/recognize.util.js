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
