const express = require('express');
const multer = require('multer');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/train.controller');

const router = express.Router();

router
  .get(
    '/',
    jwt,
    validate({ query: { page: Joi.number().integer().default(1).min(1) } }),
    controller.get
  )
  .patch('/:id', jwt, validate({ body: { name: Joi.string().required() } }), controller.patch)
  .get('/status', jwt, controller.status)
  .post('/add/:name', jwt, multer().array('files[]'), controller.add)
  .delete('/remove/:name', jwt, controller.delete)
  .get('/retrain/:name', jwt, controller.retrain);

module.exports = router;
