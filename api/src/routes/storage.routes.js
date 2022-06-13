const express = require('express');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/storage.controller');

const router = express.Router();

router
  .get(
    '/matches/:filename',
    jwt,
    validate({ query: { box: Joi.string().valid('true', 'false').default(false) } }),
    controller.matches
  )
  .delete(
    '/train',
    jwt,
    validate({ body: { files: Joi.array().items(Joi.object()).required() } }),
    controller.delete
  )
  .get('/train/:name/:filename', jwt, controller.train)
  .get('/latest/:filename', jwt, controller.latest);

module.exports = router;
