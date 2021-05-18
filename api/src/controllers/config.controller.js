const config = require('../constants/config');
const { respond, HTTPSuccess /* , HTTPError */ } = require('../util/respond.util');
const { OK } = require('../constants/http-status');

module.exports.get = async (req, res) => {
  try {
    respond(HTTPSuccess(OK, config()), res);
  } catch (error) {
    respond(error, res);
  }
};
