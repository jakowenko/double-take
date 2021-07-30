const express = require('express');
const { jwt } = require('../middlewares');
const controller = require('../controllers/fs.controller');

const router = express.Router();

router
  .get('/folders', jwt, controller.folders.list)
  .post('/folders/:name', jwt, controller.folders.create);

module.exports = router;
