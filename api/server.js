require('./src/util/logger.util').init();
const http = require('http');
const socket = require('./src/util/socket.util');
const { SERVER } = require('./src/constants')();
const { version } = require('./package.json');
const mqtt = require('./src/util/mqtt.util');
const storage = require('./src/util/storage.util');
const database = require('./src/util/db.util');
const config = require('./src/constants/config');
const shutdown = require('./src/util/shutdown.util');
const heartbeat = require('./src/util/heartbeat.util');
const validate = require('./src/schemas/validate');
const opencv = require('./src/util/opencv');

module.exports.start = async () => {
  config.setup();
  storage.setup();
  console.log(`Double Take v${version}`);
  validate(config());
  console.verbose(config());
  await database.init();
  if (opencv.shouldLoad()) await opencv.load();
  const server = http.Server(require('./src/app')).listen(SERVER.PORT);
  mqtt.connect();
  storage.purge();
  socket.connect(server);
  heartbeat.cron();
};

try {
  this.start().catch((error) => console.error(error));
  shutdown.listen();
} catch (error) {
  console.error(error);
}
