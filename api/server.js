/* eslint-disable no-irregular-whitespace */
const http = require('http');
const { version } = require('./package.json');
const mqtt = require('./src/util/mqtt.util');
const { app /* , routes */ } = require('./src/app');
const logger = require('./src/util/logger.util');
const storage = require('./src/util/storage.util');
const database = require('./src/util/db.util');
const config = require('./src/constants/config');
const { SERVER, ERROR } = require('./src/constants');

module.exports.start = async () => {
  storage.setup();
  logger.log(`Double Take v${version}`);

  if (ERROR) {
    logger.log('error loading config.yml');
    logger.log('https://github.com/jakowenko/double-take/tree/beta#configuration');
  }

  logger.log(config());

  await database.init();

  http.Server(app).listen(SERVER.PORT, () => {
    // logger.log(`listening on 0.0.0.0:${PORT}`);
    // logger.log('registered routes:');
    // logger.log(routes);
  });

  mqtt.connect();
  storage.purge();
};

this.start();
