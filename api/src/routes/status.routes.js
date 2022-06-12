const express = require('express');
const { jwt } = require('../middlewares');
const { auth, mqtt, frigate, config } = require('../controllers/status.controller');

const router = express.Router();

router
  .get('/auth', auth)
  .get('/mqtt', jwt, mqtt)
  .get('/frigate', jwt, frigate)
  .get('/config', jwt, config);

module.exports = router;
