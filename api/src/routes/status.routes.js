const express = require('express');
const { jwt } = require('../middlewares');
const { auth, mqtt } = require('../controllers/status.controller');

const router = express.Router();

router.get('/auth', auth).get('/mqtt', jwt, mqtt);

module.exports = router;
