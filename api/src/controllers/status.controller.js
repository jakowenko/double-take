const axios = require('axios');
const { connected } = require('../util/mqtt.util');
const { auth, jwt } = require('../util/auth.util');
const { AUTH, FRIGATE } = require('../constants')();

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

module.exports.frigate = async (req, res) => {
  const { data: version } = await axios({
    method: 'get',
    url: `${FRIGATE.URL}/api/version`,
  });

  res.send({ version, last: process.env.FRIGATE_LAST_EVENT || null });
};
