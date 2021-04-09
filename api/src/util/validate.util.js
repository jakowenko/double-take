const expressValidator = require('express-validator');

const { validationResult } = expressValidator;

const validate = (checks) => [
  ...checks,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Unprocessable Entity', errors: errors.array() });
    }
    next();
  },
];

module.exports = { validate, expressValidator };
