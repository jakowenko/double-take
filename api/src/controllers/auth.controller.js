const { v4: uuidv4 } = require('uuid');
const { auth, jwt } = require('../util/auth.util');
const { respond, HTTPSuccess, HTTPError } = require('../util/respond.util');
const { AUTH } = require('../constants');
const { OK, UNAUTHORIZED } = require('../constants/http-status');

module.exports.status = (req, res) => {
  const { password } = auth.get();
  const response = { auth: AUTH };
  if (AUTH && password) response.configured = true;
  respond(HTTPSuccess(OK, response), res);
};

module.exports.tokens = {
  get: (req, res) => {
    const { tokens } = auth.get();
    respond(HTTPSuccess(OK, tokens || []), res);
  },
  create: (req, res) => {
    const { name } = req.body;
    const tokens = auth.get().tokens || [];
    tokens.unshift({ name, token: uuidv4() });
    auth.set({ tokens });
    respond(HTTPSuccess(OK), res);
  },
  delete: (req, res) => {
    const { token } = req.params;
    const currentTokens = auth.get().tokens || [];
    const tokens = currentTokens.filter((obj) => obj.token !== token);
    auth.set({ tokens });
    respond(HTTPSuccess(OK, tokens), res);
  },
};

module.exports.login = (req, res) => {
  const { password } = req.body;
  const { password: current } = auth.get();
  if (password !== current) return respond(HTTPError(UNAUTHORIZED), res);
  const token = jwt.sign();
  respond(HTTPSuccess(OK, { token }), res);
};

module.exports.password = (req, res) => {
  try {
    const { password } = req.body;
    auth.set({ password });
    const token = jwt.sign();
    respond(HTTPSuccess(OK, { token }), res);
  } catch (error) {
    respond(error, res);
  }
};
