const http = require('http');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const mqtt = require('./src/util/mqtt.util');
const app = require('./src/app');
const constants = require('./src/constants');

const { PORT } = constants;

console.log('Configuration:');
console.log(constants);

http.Server(app).listen(PORT, () => {
  console.log(`listening on 0.0.0.0:${PORT}`);
});

mqtt.connect();

schedule.scheduleJob({ hour: 4 }, () => {
  fs.readdir('./matches', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      // eslint-disable-next-line no-shadow
      fs.unlink(path.join('./matches', file), (err) => {
        if (err) throw err;
      });
    }
  });
});
