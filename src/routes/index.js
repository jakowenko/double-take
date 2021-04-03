const express = require('express');
const { validate } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const storage = require('../controllers/storage.controller');
const train = require('../controllers/train.controller');
const validators = require('../util/validators.util');

const router = express.Router();

router.post('/recognize', validate(validators.recognize({ post: true })), recognize.start);
router.get('/recognize', validate(validators.recognize({ get: true })), recognize.start);

router.get('/train/manage', validate(validators.manage().ui()), train.manage);
router.post('/train/manage/delete', validate(validators.manage().delete()), train.file().delete);
router.post('/train/manage/move', validate(validators.manage().move()), train.file().move);

router.get('/train/add/:name', train.init);
router.get('/train/remove/:name', train.delete);
router.get('/train/:camera/:name', validate(validators.train()), train.camera);

router.get(
  '/storage/matches/:name/:filename',
  validate(validators.storage().matches()),
  storage.matches
);

module.exports = router;
