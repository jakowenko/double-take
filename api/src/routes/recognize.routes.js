const express = require('express');
const multer = require('multer');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/recognize.controller');

const router = express.Router();

router
  .post(
    '/',
    jwt,
    validate({
      query: {
        results: Joi.string().valid('best', 'all').default('best'),
        break: Joi.string().valid('true', 'false').default(true),
        type: Joi.string().default('manual'),
      },
    }),
    controller.start
  )
  .get(
    '/',
    jwt,
    validate({
      query: {
        results: Joi.string().valid('best', 'all').default('best'),
        break: Joi.string().valid('true', 'false').default(true),
        type: Joi.string().default('manual'),
        camera: Joi.string().default('manual'),
        url: Joi.string().uri().required(),
        attempts: Joi.number().integer().default(1).min(1),
      },
    }),
    controller.start
  )
  .post(
    '/upload',
    jwt,
    multer().array('files[]'),
    validate({
      files: {
        schema: Joi.array()
          .min(1)
          .items(Joi.object({ buffer: Joi.binary().encoding('utf8').required() })),
        allowUnknown: true,
      },
    }),
    controller.upload
  )
  .get('/test', jwt, controller.test);

module.exports = router;
