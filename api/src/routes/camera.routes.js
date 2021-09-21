const express = require('express');
const { jwt, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/camera.controller');

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
