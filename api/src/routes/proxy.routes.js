const express = require('express');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/proxy.controller');

const router = express.Router();

router.get('/', jwt, validate({ query: { url: Joi.string().uri().required() } }), controller.url);

module.exports = router;
