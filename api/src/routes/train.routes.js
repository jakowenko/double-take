const express = require('express');
const multer = require('multer');
const { jwt, expressValidator, validate } = require('../middlewares');
const controller = require('../controllers/train.controller');

const { query } = expressValidator;
const router = express.Router();

router
  .get('/', jwt, validate([query('page').default(1).isInt()]), controller.get)
  .patch('/:id', jwt, controller.patch)
  .get('/status', controller.status)
  .post('/add/:name', multer().array('files[]'), controller.add)
  .delete('/remove/:name', controller.delete)
  .get('/retrain/:name', controller.retrain);

module.exports = router;
