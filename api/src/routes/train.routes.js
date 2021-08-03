const express = require('express');
const multer = require('multer');
const { jwt } = require('../middlewares');
const controller = require('../controllers/train.controller');

const router = express.Router();

router
  .get('/', jwt, controller.get)
  .patch('/:id', jwt, controller.patch)
  .get('/status', controller.status)
  .post('/add/:name', multer().array('files[]'), controller.add)
  .delete('/remove/:name', controller.delete)
  .get('/retrain/:name', controller.retrain);

module.exports = router;
