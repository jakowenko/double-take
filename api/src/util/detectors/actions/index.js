const factory = require('../factory');

module.exports.recognize = ({ detector, formData }) => factory.get(detector).recognize(formData);
module.exports.normalize = ({ detector, data, duration, attempt }) =>
  factory.get(detector).normalize({ data, duration, attempt });
