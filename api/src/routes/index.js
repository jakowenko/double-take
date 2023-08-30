const express = require('express');
const { STORAGE } = require('../constants')();

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/config', require('./config.routes'));
router.use('/camera', require('./camera.routes'));
router.use('/recognize', require('./recognize.routes'));
router.use('/match', require('./match.routes'));
router.use('/filesystem', require('./fs.routes'));
router.use('/train', require('./train.routes'));
router.use('/storage', require('./storage.routes'));
router.use('/proxy', require('./proxy.routes'));
router.use('/logger', require('./logger.routes'));
router.use('/status', require('./status.routes'));
router.use('/export', require('./export.routes'));

router.use(STORAGE.TMP.PATH, express.static(STORAGE.TMP.PATH));
router.use((req, res) => {
  res.status(404).send({ error: `${req.originalUrl} not found` });
});

module.exports = router;
