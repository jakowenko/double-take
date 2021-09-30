const express = require('express');
const { mqtt } = require('../controllers/status.controller');

const router = express.Router();

router.get('/mqtt', mqtt);

module.exports = router;
