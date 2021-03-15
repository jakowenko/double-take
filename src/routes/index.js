const express = require('express');
const { validate, expressValidator } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');
const { manual } = require('../util/events.util');

const router = express.Router();
const { query } = expressValidator;

router.post('/recognize', validate([query('results').default('best')]), recognize.start);
router.get(
  '/recognize',
  validate([
    query('url').isURL().withMessage('not a valid url'),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
    query('results').default('best'),
    query('break').default(true).isIn([true, false]),
    query('processing').default('parallel').isIn(['parallel', 'serial']),
  ]),
  manual,
  recognize.start
);

router.get('/train/add/:name', train.init);
router.get('/train/remove/:name', train.delete);
router.get('/train/:camera/:name', train.camera);

module.exports = router;
