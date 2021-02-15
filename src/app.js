const express = require('express');
const cors = require('cors');
const path = require('path');
const router = require('./routes');

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

app.use('/matches', express.static(path.join(__dirname, '/../matches')));

app.use(router);

module.exports = app;
