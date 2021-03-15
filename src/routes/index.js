const express = require('express');
const { validate } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const train = require('../controllers/train.controller');
const { manual } = require('../util/events.util');
const middleware = require('../util/middleware.util');

const router = express.Router();

router.post('/recognize', validate(middleware.recognize()), recognize.start);
router.get('/recognize', validate(middleware.recognize(true)), manual, recognize.start);

router.get('/train/add/:name', train.init);
router.get('/train/remove/:name', train.delete);
router.get('/train/:camera/:name', validate(middleware.train()), train.camera);

module.exports = router;
