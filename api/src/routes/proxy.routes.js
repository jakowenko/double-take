const express = require('express');
const { jwt, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/proxy.controller');

const { query } = expressValidator;
const router = express.Router();

router.get('/', validate([query('url').isLength({ min: 1 })]), jwt, controller.url);

module.exports = router;
