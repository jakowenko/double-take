const express = require('express');
const { jwt } = require('../middlewares');
const { validate, expressValidator } = require('../middlewares/validate.middleware');
const controller = require('../controllers/proxy.controller');

const { query } = expressValidator;
const router = express.Router();

router.get('/', validate([query('url').isLength({ min: 1 })]), jwt, controller.url);

module.exports = router;
