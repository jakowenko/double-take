const express = require('express');
const { jwt } = require('../middlewares');
const { get, remove } = require('../controllers/logger.controller');

const router = express.Router();

router.get('/', jwt, get);
router.delete('/', jwt, remove);

module.exports = router;
