const express = require('express');
const { jwt, validate, expressValidator } = require('../middlewares');
const controller = require('../controllers/storage.controller');

const { query } = expressValidator;
const router = express.Router();

router
  .get(
    '/matches/:filename',
    validate([query('box').default(false).isIn([true, false])]),
    jwt,
    controller.matches
  )
  .delete('/train', jwt, controller.delete)
  .get('/train/:name/:filename', jwt, controller.train)
  .get('/latest/:filename', jwt, controller.latest);

module.exports = router;
