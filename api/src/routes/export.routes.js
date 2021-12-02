const express = require('express');
const { jwt } = require('../middlewares');
const { zip } = require('../controllers/export.controller');

const router = express.Router();

router.get('/', jwt, zip);

module.exports = router;
