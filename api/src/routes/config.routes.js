const express = require('express');
const { jwt } = require('../middlewares');
const { validate, expressValidator } = require('../middlewares/validate.middleware');
const controller = require('../controllers/config.controller');

const { query } = expressValidator;

const router = express.Router();

router
  .get('/', validate([query('format').default('json').isIn(['json', 'yaml'])]), jwt, controller.get)
  .patch('/', jwt, controller.patch);

module.exports = router;
