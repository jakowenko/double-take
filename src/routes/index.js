const express = require('express');
const facebox = require('../controllers/facebox.controller');

const router = express.Router();

router.post('/facebox', facebox.start);

module.exports = router;
