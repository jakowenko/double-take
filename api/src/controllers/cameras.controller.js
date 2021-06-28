const axios = require('axios');
const { respond, HTTPSuccess, HTTPError } = require('../util/respond.util');
const { OK, BAD_REQUEST } = require('../constants/http-status');
const { SERVER, CAMERAS } = require('../constants');

module.exports.event = async (req, res) => {
  try {
    const { camera } = req.params;
    const { attempts, break: breakMatch } = req.query;

    const { SNAPSHOT } = Object.keys(CAMERAS)
      .filter((key) => key.toLowerCase() === camera)
      .reduce((obj, key) => {
        obj = CAMERAS[key];
        return obj;
      }, {});

    if (SNAPSHOT === undefined) {
      throw HTTPError(BAD_REQUEST, 'camera config not found');
    }

    if (!SNAPSHOT || !SNAPSHOT.URL) {
      throw HTTPError(BAD_REQUEST, 'camera snapshot URL not found');
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

    respond(HTTPSuccess(OK, data), res);
  } catch (error) {
    respond(error, res);
  }
};
