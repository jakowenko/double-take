const express = require('express');
const { jwt, setup, validate, Joi } = require('../middlewares');
const controller = require('../controllers/auth.controller');

const router = express.Router();

router
  .post('/', validate({ body: { password: Joi.string().min(1).required() } }), controller.login)
  .post(
    '/password',
    validate({ body: { password: Joi.string().min(1).required() } }),
    setup,
    controller.password
  )
  .patch(
    '/password',
    jwt,
    validate({
      body: {
        password: Joi.string().min(1).required(),
        newPassword: Joi.string().min(1).required(),
      },
    }),
    controller.updatePassword
  )
  .get('/tokens', jwt, controller.tokens.get)
  .post('/tokens', jwt, controller.tokens.create)
  .delete(
    '/tokens/:token',
    jwt,
    validate({ params: { token: Joi.string().uuid() } }),
    controller.tokens.delete
  );

module.exports = router;
