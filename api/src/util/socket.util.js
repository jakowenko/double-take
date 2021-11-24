const socket = require('socket.io');
const { UI } = require('../constants')();

let io = false;

module.exports.connect = (server) => {
  io = socket(server, {
    path: `${UI?.PATH || ''}/socket.io`,
    cors: {
      origin: true,
    },
  });
};

module.exports.emit = (event, message) => (io ? io.emit(event, message) : false);
