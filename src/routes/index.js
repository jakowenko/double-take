const express = require('express');
const recognize = require('../controllers/recognize.controller');

const router = express.Router();

router.post('/recognize', recognize.start);

module.exports = router;
