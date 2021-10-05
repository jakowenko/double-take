const express = require('express');
const { jwt } = require('../middlewares');
const { auth, mqtt, frigate } = require('../controllers/status.controller');

const router = express.Router();

router.get('/auth', auth).get('/mqtt', jwt, mqtt).get('/frigate', jwt, frigate);

module.exports = router;
