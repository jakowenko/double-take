const factory = require('../factory');

module.exports.send = (service, output) => factory.get(service).send(output);
module.exports.checks = (service, args) => factory.checks(service, args);
