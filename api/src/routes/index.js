const express = require('express');
const { validate } = require('../util/validate.util');
const recognize = require('../controllers/recognize.controller');
const storage = require('../controllers/storage.controller');
const train = require('../controllers/train.controller');
const filesystem = require('../controllers/fs.controller');
const validators = require('../util/validators.util');

const router = express.Router();

router.post('/recognize', validate(validators.recognize({ post: true })), recognize.start);
router.get('/recognize', validate(validators.recognize({ get: true })), recognize.start);

router.get('/filesystem/files', filesystem.files().list);
router.post('/filesystem/files/move', filesystem.files().move);
router.delete('/filesystem/files', filesystem.files().delete);

router.get('/filesystem/folders', filesystem.folders().list);
router.post('/filesystem/folders/:name', filesystem.folders().create);

router.get('/train/add/:name', train.init);
router.get('/train/remove/:name', train.delete);
router.get('/train/:camera/:name', train.camera);

router.get(
  '/storage/matches/:name/:filename',
  validate(validators.storage().matches()),
  storage.matches
);

module.exports = router;
