const factory = require('../factory');

console.log("detector => " , factory)

module.exports = (detector, formData) => factory.get(detector).recognize(formData)