const express = require('express');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/camera.controller');

const router = express.Router();

router.get(
  '/:camera',
  jwt,
  validate({
    query: {
      break: Joi.string().valid('true', 'false').default(true),
      attempts: Joi.number().integer().default(1).min(1),
    },
  }),
  controller.event
);

module.exports = router;
