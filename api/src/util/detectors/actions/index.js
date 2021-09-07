const factory = require('../factory');
const { CONFIDENCE, OBJECTS } = require('../../../constants');

module.exports.recognize = ({ detector, test, key }) =>
  factory.get(detector).recognize({ test, key });
module.exports.train = ({ name, key, detector }) => factory.get(detector).train({ name, key });
module.exports.remove = ({ name, detector }) => factory.get(detector).remove({ name });
module.exports.normalize = ({ detector, data }) => factory.get(detector).normalize({ data });
module.exports.checks = ({ confidence, box }) => {
  const { MIN_AREA_MATCH } = OBJECTS.FACE;
  const checks = [];
  if (confidence < CONFIDENCE.MATCH)
    checks.push(`confidence too low: ${confidence} < ${CONFIDENCE.MATCH}`);
  if (box.width * box.height < MIN_AREA_MATCH)
    checks.push(`box area too low: ${box.width * box.height} < ${MIN_AREA_MATCH}`);
  return checks;
};
