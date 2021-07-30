const express = require('express');
const { jwt } = require('../middlewares');
const { validate, expressValidator } = require('../middlewares/validate.middleware');
const controller = require('../controllers/cameras.controller');

const { param, query } = expressValidator;

const router = express.Router();

router.get(
  '/:camera',
  validate([
    param('camera').isLength({ min: 1 }),
    query('break').default(true).isIn([true, false]),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ]),
  jwt,
  controller.event
);

module.exports = router;
