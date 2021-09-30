const { connected } = require('../util/mqtt.util');
const { auth, jwt } = require('../util/auth.util');
const { AUTH } = require('../constants')();

module.exports.mqtt = (req, res) => {
  res.send({ status: connected() });
};

module.exports.auth = (req, res) => {
  const { authorization } = req.headers;
  const response = { auth: AUTH };
  if (AUTH && auth.get().password) response.configured = true;
  if (AUTH) response.jwtValid = jwt.verify(authorization);
  res.send(response);
};
