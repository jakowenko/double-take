const express = require('express');

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

module.exports = router;
