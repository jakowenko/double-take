const axios = require('axios');
const config = require('../constants/config');
const validate = require('../schemas/validate');
const { tryParseJSON } = require('../util/validators.util');
const mqtt = require('../util/mqtt.util');
const { auth, jwt } = require('../util/auth.util');
const { BAD_REQUEST } = require('../constants/http-status');
const { AUTH, FRIGATE } = require('../constants')();

module.exports.mqtt = (req, res) => {
  res.send(mqtt.status());
};

module.exports.auth = (req, res) => {
  const { authorization } = req.headers;
  const response = { auth: AUTH };
  if (AUTH && auth.get().password) response.configured = true;
  if (AUTH) response.jwtValid = jwt.verify(authorization);
  res.send(response);
};

module.exports.frigate = async (req, res) => {
  if (!FRIGATE.URL) return res.status(BAD_REQUEST).error('Frigate URL not configured');

  const { time, camera } = tryParseJSON(process.env.FRIGATE_LAST_EVENT) || {
    time: null,
    camera: null,
  };

  const { data: version } = await axios({
    method: 'get',
    url: `${FRIGATE.URL}/api/version`,
  });

  res.send({ version, last: { time, camera } });
};

module.exports.config = (req, res) => res.send(validate(config()));
