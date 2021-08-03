const express = require('express');
const { jwt, setup, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/auth.controller');

const { body } = expressValidator;

const router = express.Router();

router
  .post('/', validate([body('password').isLength({ min: 1 })]), controller.login)
  .get('/status', controller.status)
  .post('/password', validate([body('password').isLength({ min: 1 })]), setup, controller.password)
  .patch(
    '/password',
    validate([body('password').isLength({ min: 1 }), body('newPassword').isLength({ min: 1 })]),
    controller.updatePassword
  )
  .get('/tokens', jwt, controller.tokens.get)
  .post('/tokens', jwt, controller.tokens.create)
  .delete('/tokens/:token', jwt, controller.tokens.delete);

module.exports = router;
