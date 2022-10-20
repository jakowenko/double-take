const factory = require('../factory');

module.exports.recognize = ({ detector, key, test }) =>
  factory.get(detector).recognize({ key, test });
module.exports.train = ({ name, key, detector }) => factory.get(detector).train({ name, key });
module.exports.remove = ({ name, ids, detector }) => factory.get(detector).remove({ name, ids });
module.exports.normalize = ({ camera, detector, data }) =>
  factory.get(detector).normalize({ camera, data });
module.exports.checks = ({ MATCH, UNKNOWN, name, confidence, box }) => {
  const checks = [];
  if (name === 'unknown' && box.width * box.height < UNKNOWN.MIN_AREA) return false;
  if (name === 'unknown' && confidence < UNKNOWN.CONFIDENCE) {
    checks.push(`confidence too low: ${confidence} < ${UNKNOWN.CONFIDENCE}`);
  } else {
    if (confidence < MATCH.CONFIDENCE)
      checks.push(`confidence too low: ${confidence} < ${MATCH.CONFIDENCE}`);
    if (box.width * box.height < MATCH.MIN_AREA)
      checks.push(`box area too low: ${box.width * box.height} < ${MATCH.MIN_AREA}`);
  }
  return checks;
};
