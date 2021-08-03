const expressValidator = require('express-validator');
const { auth, jwt } = require('../util/auth.util');
const { UNAUTHORIZED } = require('../constants/http-status');
const { AUTH } = require('../constants');
const { respond, HTTPError } = require('../util/respond.util');

const { validationResult } = expressValidator;

module.exports.jwt = async (req, res, next) => {
  try {
    if (AUTH === false) {
      return next();
    }
    const token = req.query.token || req.headers.authorization;
    const tokens = ((req.query.token && auth.get().tokens) || []).map((obj) => obj.token);
    if (tokens.includes(token)) return next();
    const { route } = jwt.decode(token);

    if (route && !req.baseUrl.includes(route)) throw Error('Unauthorized');
    next();
  } catch (error) {
    respond(HTTPError(UNAUTHORIZED, 'Unauthorized'), res);
  }
};

module.exports.setup = async (req, res, next) => {
  try {
    const { password } = auth.get();
    if (password) throw Error('password is already set');
    next();
  } catch (error) {
    respond(HTTPError(UNAUTHORIZED, error.message), res);
  }
};

module.exports.validate = (checks) => [
  ...checks,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Unprocessable Entity', errors: errors.array() });
    }
    next();
  },
];

module.exports.expressValidator = expressValidator;
