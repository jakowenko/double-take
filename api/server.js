const http = require('http');
const { version } = require('./package.json');
const mqtt = require('./src/util/mqtt.util');
const { app } = require('./src/app');
const storage = require('./src/util/storage.util');
const database = require('./src/util/db.util');
const config = require('./src/constants/config');
const shutdown = require('./src/util/shutdown.util');
const { SERVER } = require('./src/constants');

require('./src/util/logger.util').init();

module.exports.start = async () => {
  storage.setup();
  console.log(`Double Take v${version}`);

  console.log(config());

  await database.init();

  http.Server(app).listen(SERVER.PORT);

  mqtt.connect();
  storage.purge();
};

shutdown.listen();
this.start();
