const express = require('express');
const { jwt } = require('../middlewares');
const { image } = require('../controllers/latest.controller');

const router = express.Router();

router.get('/:filename', jwt, image);

module.exports = router;
