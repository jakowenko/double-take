const express = require('express');
const cors = require('cors');
const router = require('./routes');

const app = express();
app.use('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/api', router);
app.use('/api/tmp', express.static(`/tmp`));
app.use('/', express.static(`./frontend`));

module.exports = { app };
