const express = require('express');
const { jwt, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/config.controller');

const { query } = expressValidator;

const router = express.Router();

router
  .get(
    '/',
    jwt,
    validate([query('format').default('json').isIn(['json', 'yaml', 'yaml-with-defaults'])]),
    controller.get
  )
  .patch('/', jwt, controller.patch)
  .get('/theme', controller.theme.get)
  .patch('/theme', jwt, controller.theme.patch)
  .get('/secrets', jwt, controller.secrets.get)
  .patch('/secrets', jwt, controller.secrets.patch);

module.exports = router;
