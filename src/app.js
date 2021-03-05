const express = require('express');
const cors = require('cors');
const router = require('./routes');
const { STORAGE_PATH } = require('./constants');

const app = express();

app.use('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/_healthz', (req, res) => {
  if (app.isTerminated) res.status(503).send();
  else {
    res.send('OK');
  }
});

app.use('/matches', express.static(`${STORAGE_PATH}/matches`));
app.use('/names', express.static(`${STORAGE_PATH}/names`));

app.use(router);

module.exports = app;
