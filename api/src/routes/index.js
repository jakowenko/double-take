const express = require('express');
const multer = require('multer');
const { validate } = require('../util/validate.util');
const config = require('../controllers/config.controller');
const recognize = require('../controllers/recognize.controller');
const storage = require('../controllers/storage.controller');
const cameras = require('../controllers/cameras.controller');
const train = require('../controllers/train.controller');
const match = require('../controllers/match.controller');
const filesystem = require('../controllers/fs.controller');
const validators = require('../util/validators.util');

const router = express.Router();

router.get('/config', validate(validators.config()), config.get);
router.patch('/config', config.patch);

router.get('/cameras/:camera', validate(validators.cameras()), cameras.event);

router.post('/recognize', validate(validators.recognize({ post: true })), recognize.start);
router.get('/recognize', validate(validators.recognize({ get: true })), recognize.start);
router.get('/recognize/test', recognize.test);

router.get('/match', match.get).patch('/match', match.patch).delete('/match', match.delete);

router.get('/filesystem/folders', filesystem.folders().list);
router.post('/filesystem/folders/:name', filesystem.folders().create);

router.get('/train', train.get);
router.get('/train/status', train.status);
router.get('/train/add/:name', train.add);
router.post('/train/add/:name', multer().array('files[]'), train.upload);
router.get('/train/remove/:name', train.delete);
router.get('/train/retrain/:name', train.retrain);

router.get('/storage/matches/:filename', validate(validators.storage().matches()), storage.matches);
router.delete('/storage/train', storage.delete);
router.get('/storage/train/:name/:filename', storage.train);

module.exports = router;
