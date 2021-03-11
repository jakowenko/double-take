const express = require('express');
const { validate, expressValidator } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');
const { test } = require('../util/events.util');

const router = express.Router();
const { body, query } = expressValidator;

router.post('/recognize', recognize.start);
router.get(
  '/recognize',
  validate([query('url').isURL().withMessage('not a valid url')]),
  test,
  recognize.start
);

router.get('/train', train.init);
router.get('/train/delete', train.delete);
router.get('/train/:camera/:name', train.camera);

module.exports = router;
