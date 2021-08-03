const axios = require('axios');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');

module.exports.url = async (req, res) => {
  try {
    const { url } = req.query;
    const { data } = await axios({
      method: 'get',
      url,
    });
    respond(HTTPSuccess(OK, data), res);
  } catch (error) {
    respond(error, res);
  }
};
