const express = require('express');
const cors = require('cors');
const router = require('./routes');
const { STORAGE_PATH } = require('./constants');

const app = express();
app.use('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/storage/train', express.static(`${STORAGE_PATH}/train`));
app.use('/', express.static(`./frontend`));

app.use(router);

let routes = [];
// eslint-disable-next-line no-underscore-dangle
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    routes.push(middleware.route);
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) routes.push(handler.route);
    });
  }
});
routes = routes.map((route) => {
  const methods = [];
  for (const [key, value] of Object.entries(route.methods)) {
    if (value) methods.push(key);
  }
  return {
    path: route.path,
    methods: methods.join(', '),
  };
});

module.exports = { app, routes };
