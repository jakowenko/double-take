const express = require('express');
const fs = require('fs');
const cors = require('cors');
const ipfilter = require('express-ipfilter').IpFilter;
const { UI } = require('./constants')();
const { getFrontendPath } = require('./util/helpers.util');
const { version } = require('../package.json');

const Honeybadger = require('@honeybadger-io/js');
Honeybadger.configure({
  apiKey: 'hbp_bVwQLAvfoZQNZDuHQp1EOqqLbKn1WN07Zih5',
  revision: version,
});

require('axios-debug-log');
require('express-async-errors');

const app = express();

app.use(Honeybadger.requestHandler);

app.use('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(require('./middlewares/respond'));

if (process.env.HA_ADDON === 'true' && process.env.IPFILTER === 'true') {
  const ips = ['172.30.32.2', '127.0.0.1', '::ffff:172.30.32.2', '::ffff:127.0.0.1'];
  app.use(ipfilter(ips, { mode: 'allow' }));
}

const frontendPath = getFrontendPath();
console.verbose(`Frontend path: ${frontendPath}`);
app.use(
  UI.PATH,
  express.static(frontendPath, {
    index: false,
  })
);
app.use(`${UI.PATH}/api`, require('./routes'));

app.use(UI.PATH, (req, res) => {
  const html = fs.readFileSync(`${frontendPath}index.html`, 'utf8');
  res.send(
    html.replace(
      '</head>',
      `<script>
        window.ingressUrl = '${req.headers['x-ingress-path'] || ''}';
        window.publicPath = '${UI?.PATH || ''}';
      </script>
      </head>`
    )
  );
});

app.use(Honeybadger.errorHandler);

module.exports = app;
