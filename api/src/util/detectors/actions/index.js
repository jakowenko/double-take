const factory = require('../factory');

module.exports.recognize = ({ detector, test, key }) =>
  factory.get(detector).recognize({ test, key });
module.exports.train = ({ name, key, detector }) => factory.get(detector).train({ name, key });
module.exports.remove = ({ name, detector }) => factory.get(detector).remove({ name });
module.exports.normalize = ({ detector, data }) => factory.get(detector).normalize({ data });
