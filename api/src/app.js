const express = require('express');
const cors = require('cors');
const router = require('./routes');

const app = express();
app.use('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(
  express.static(process.env.NODE_ENV === 'development' ? './frontend/dist/' : './frontend/')
);
app.use('/api', router);
app.use('/', (req, res) => {
  res.sendFile(
    process.env.NODE_ENV === 'development'
      ? `${process.cwd()}/frontend/dist/index.html`
      : `${process.cwd()}/frontend/index.html`
  );
});

module.exports = { app };
