const express = require('express');
const { jwt, expressValidator, validate } = require('../middlewares');
const controller = require('../controllers/match.controller');

const { query } = expressValidator;
const router = express.Router();

router
  .get('/', jwt, validate([query('page').default(1).isInt()]), controller.get)
  .delete('/', jwt, controller.delete);
router.patch('/reprocess/:matchId', jwt, controller.reprocess);
router.get('/filters', jwt, controller.filters);

module.exports = router;
