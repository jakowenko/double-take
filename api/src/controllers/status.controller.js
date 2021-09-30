const { connected } = require('../util/mqtt.util');

module.exports.mqtt = (req, res) => {
  res.send({ status: connected() });
};
