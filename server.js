/* eslint-disable no-irregular-whitespace */
const http = require('http');
const { version } = require('./package.json');
const mqtt = require('./src/util/mqtt.util');
const { app, routes } = require('./src/app');
const logger = require('./src/util/logger.util');
const time = require('./src/util/time.util');
const storage = require('./src/util/storage.util');
const database = require('./src/util/db.util');
const constants = require('./src/constants');

const { PORT } = constants;

module.exports.start = async () => {
  storage.setup();
  await database.init();
  logger.log(
    '____________________________________________________________________________________'
  );
  logger.log(`
██████╗░░█████╗░██╗░░░██╗██████╗░██╗░░░░░███████╗  ████████╗░█████╗░██╗░░██╗███████╗
██╔══██╗██╔══██╗██║░░░██║██╔══██╗██║░░░░░██╔════╝  ╚══██╔══╝██╔══██╗██║░██╔╝██╔════╝
██║░░██║██║░░██║██║░░░██║██████╦╝██║░░░░░█████╗░░  ░░░██║░░░███████║█████═╝░█████╗░░
██║░░██║██║░░██║██║░░░██║██╔══██╗██║░░░░░██╔══╝░░  ░░░██║░░░██╔══██║██╔═██╗░██╔══╝░░
██████╔╝╚█████╔╝╚██████╔╝██████╦╝███████╗███████╗  ░░░██║░░░██║░░██║██║░╚██╗███████╗
╚═════╝░░╚════╝░░╚═════╝░╚═════╝░╚══════╝╚══════╝  ░░░╚═╝░░░╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝`);

  logger.log(`\nVersion: ${version}\n${time.current()}\n`);
  logger.log(constants);
  logger.log(
    '____________________________________________________________________________________\n'
  );

  http.Server(app).listen(PORT, () => {
    // logger.log(`listening on 0.0.0.0:${PORT}`);
    // logger.log('registered routes:');
    // logger.log(routes);
  });

  mqtt.connect();
  storage.purge();
};

this.start();
