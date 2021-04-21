const factory = require('../factory');

module.exports.recognize = ({ detector, key }) => factory.get(detector).recognize(key);
module.exports.train = ({ name, key, detector }) => factory.get(detector).train({ name, key });
module.exports.remove = ({ name, detector }) => factory.get(detector).remove({ name });
module.exports.normalize = ({ detector, data, duration, attempt }) =>
  factory.get(detector).normalize({ data, duration, attempt });
