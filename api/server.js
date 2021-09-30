require('./src/util/logger.util').init();
const http = require('http');
const socket = require('./src/util/socket.util');
const { SERVER } = require('./src/constants');
const { version } = require('./package.json');
const mqtt = require('./src/util/mqtt.util');
const { app } = require('./src/app');
const storage = require('./src/util/storage.util');
const database = require('./src/util/db.util');
const config = require('./src/constants/config');
const shutdown = require('./src/util/shutdown.util');

module.exports.start = async () => {
  config.setup();
  storage.setup();
  console.log(`Double Take v${version}`);
  console.log(config());
  await database.init();
  const server = http.Server(app).listen(SERVER.PORT);
  mqtt.connect();
  storage.purge();
  socket.connect(server);
};

try {
  this.start().catch((error) => console.error(error));
  shutdown.listen();
} catch (error) {
  console.error(error);
}
