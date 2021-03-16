const express = require('express');
const { validate } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');
const validators = require('../util/validators.util');

const router = express.Router();

router.post('/recognize', validate(validators.recognize({ post: true })), recognize.start);
router.get('/recognize', validate(validators.recognize({ get: true })), recognize.start);

router.get('/train/add/:name', train.init);
router.get('/train/remove/:name', train.delete);
router.get('/train/:camera/:name', validate(validators.train()), train.camera);

module.exports = router;
