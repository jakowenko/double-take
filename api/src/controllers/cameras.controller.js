const axios = require('axios');
const { SERVER, CAMERAS } = require('../constants');
const { BAD_REQUEST } = require('../constants/http-status');

module.exports.event = async (req, res) => {
  const { camera } = req.params;
  const { attempts, break: breakMatch } = req.query;

  const { SNAPSHOT } = Object.keys(CAMERAS || {})
    .filter((key) => key.toLowerCase() === camera)
    .reduce((obj, key) => {
      obj = CAMERAS[key];
      return obj;
    }, {});

  if (SNAPSHOT === undefined) {
    return res.status(BAD_REQUEST).error('camera config not found');
  }

  if (!SNAPSHOT || !SNAPSHOT.URL) {
    return res.status(BAD_REQUEST).error('camera snapshot URL not found');
  }

  const { data } = await axios({
    method: 'get',
    url: `http://0.0.0.0:${SERVER.PORT}/api/recognize`,
    params: {
      url: `${SNAPSHOT.URL}`,
      type: 'camera-event',
      camera,
      attempts,
      break: breakMatch,
    },
    validateStatus() {
      return true;
    },
  });

  res.send(data);
};
