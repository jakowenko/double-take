const express = require('express');
const { jwt } = require('../middlewares');
const controller = require('../controllers/match.controller');

const router = express.Router();

router.get('/', jwt, controller.get).delete('/', jwt, controller.delete);

module.exports = router;
