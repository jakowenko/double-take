const express = require('express');
const { jwt, validate, Joi } = require('../middlewares');
const controller = require('../controllers/match.controller');

const router = express.Router();

router
  .post(
    '/',
    jwt,
    validate({ query: { page: Joi.number().integer().default(1).min(1) } }),
    // limiter,
    controller.post
  )
  .delete(
    '/',
    jwt,
    validate({ body: { ids: Joi.array().items(Joi.number().integer()).required() } }),
    // limiter,
    controller.delete
  );
router.patch('/reprocess/:matchId', jwt, /* limiter, */ controller.reprocess);
router.get('/filters', jwt, controller.filters);

module.exports = router;
