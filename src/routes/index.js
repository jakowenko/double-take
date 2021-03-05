const express = require('express');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');

const router = express.Router();

router.post('/recognize', recognize.start);
router.get('/recognize/test', recognize.start);

router.get('/train', train.init);
router.get('/train/delete', train.delete);
router.get('/train/:camera/:name', train.camera);

module.exports = router;
