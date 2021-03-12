const express = require('express');
const { validate, expressValidator } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');
const { manual } = require('../util/events.util');

const router = express.Router();
const { query } = expressValidator;

router.post('/recognize', recognize.start);
router.get(
  '/recognize',
  validate([
    query('url').isURL().withMessage('not a valid url'),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ]),
  manual,
  recognize.start
);

router.get('/train', train.init);
router.get('/train/delete', train.delete);
router.get('/train/:camera/:name', train.camera);

module.exports = router;
