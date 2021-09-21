const express = require('express');
const cors = require('cors');
require('express-async-errors');

const app = express();
app.use('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(require('./middlewares/respond'));

app.use(
  express.static(process.env.NODE_ENV === 'development' ? './frontend/dist/' : './frontend/')
);
app.use('/api', require('./routes'));

app.use('/', (req, res) => {
  res.sendFile(
    process.env.NODE_ENV === 'development'
      ? `${process.cwd()}/frontend/dist/index.html`
      : `${process.cwd()}/frontend/index.html`
  );
});

app.use((err, req, res, next) => res.send(err));

module.exports = { app };
