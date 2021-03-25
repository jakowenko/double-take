const factory = require('../factory');

module.exports = (detector, formData) => factory.get(detector).recognize(formData);
