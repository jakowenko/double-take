const express = require('express');
const { jwt, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/recognize.controller');

const { query } = expressValidator;

const router = express.Router();

router
  .post(
    '/',
    validate([
      query('results').default('best').isIn(['best', 'all']).withMessage('not a valid result type'),
      query('break').default(true).isIn([true, false]),
      query('type').default('manual'),
    ]),
    jwt,
    controller.start
  )
  .get(
    '/',
    validate([
      query('results').default('best').isIn(['best', 'all']).withMessage('not a valid result type'),
      query('break').default(true).isIn([true, false]),
      query('type').default('manual'),
      query('camera').default('manual'),
      query('url').isLength({ min: 1 }),
      query('attempts').default(1).isInt().withMessage('not a valid number'),
    ]),
    jwt,
    controller.start
  )
  .get('/test', jwt, controller.test);

module.exports = router;
