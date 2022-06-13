const Joi = require('joi');
const { auth, jwt } = require('../util/auth.util');
const { UNAUTHORIZED } = require('../constants/http-status');
const { AUTH } = require('../constants')();

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
    res.status(UNAUTHORIZED).error('Unauthorized');
  }
};

module.exports.setup = async (req, res, next) => {
  try {
    const { password } = auth.get();
    if (password) throw Error('password is already set');
    next();
  } catch (error) {
    res.status(UNAUTHORIZED).error(error.message);
  }
};

module.exports.validate = (schemas) => (req, res, next) => {
  const errors = [];
  for (const [key, joiSchema] of Object.entries(schemas)) {
    const { allowUnknown, ...schema } = joiSchema;
    const isArray = Array.isArray(req[key]);
    const { error, value } = isArray
      ? joiSchema.schema.validate([...req[key]], {
          allowUnknown,
          abortEarly: false,
        })
      : Joi.object(schema).validate(
          { ...req[key] },
          {
            allowUnknown:
              key === 'query' && allowUnknown === undefined ? true : allowUnknown !== undefined,
            abortEarly: false,
          }
        );
    if (error?.details) {
      errors.push(
        ...error.details.map((obj) => ({
          location: key,
          key: obj.context.label,
          error: obj.message,
        }))
      );
    }

    // update request to use validate values which may be transformed
    req[key] = value;
  }

  if (errors.length) return res.status(422).send({ errors });

  next();
};

module.exports.Joi = Joi;
