const http = require('http');
const mqtt = require('./src/util/mqtt.util');
const app = require('./src/app');
const logger = require('./src/util/logger.util');
const time = require('./src/util/time.util');
const storage = require('./src/util/storage.util');
const constants = require('./src/constants');

const { PORT } = constants;

storage.setup();

logger.log(`${time.current()}\nFrigate Events Started`, {
  dashes: true,
});
logger.log(constants);

http.Server(app).listen(PORT, () => {
  logger.log(`listening on 0.0.0.0:${PORT}`, { verbose: true });
});

mqtt.connect();
storage.purge();
