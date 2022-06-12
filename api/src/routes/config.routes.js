const express = require('express');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/config.controller');

const router = express.Router();

router
  .get(
    '/',
    jwt,
    validate({
      query: { format: Joi.string().valid('json', 'yaml', 'yaml-with-defaults').default('json') },
    }),
    controller.get
  )
  .patch('/', jwt, validate({ body: { code: Joi.string().min(0).required() } }), controller.patch)
  .get('/theme', controller.theme.get)
  .patch(
    '/theme',
    jwt,
    validate({ body: { ui: Joi.string().required(), editor: Joi.string().required() } }),
    controller.theme.patch
  )
  .get('/secrets', jwt, controller.secrets.get)
  .patch(
    '/secrets',
    jwt,
    validate({ body: { code: Joi.string().min(0).required() } }),
    controller.secrets.patch
  );

module.exports = router;
