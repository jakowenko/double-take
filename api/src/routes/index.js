const express = require('express');
const { respond, HTTPError } = require('../util/respond.util');
const { NOT_FOUND } = require('../constants/http-status');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/config', require('./config.routes'));
router.use('/cameras', require('./cameras.routes'));
router.use('/recognize', require('./recognize.routes'));
router.use('/match', require('./match.routes'));
router.use('/filesystem', require('./fs.routes'));
router.use('/train', require('./train.routes'));
router.use('/storage', require('./storage.routes'));
router.use('/proxy', require('./proxy.routes'));

router.all('*', (req, res) => respond(HTTPError(NOT_FOUND, `${req.originalUrl} not found`), res));

module.exports = router;
