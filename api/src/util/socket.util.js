const socket = require('socket.io');

let io = false;

module.exports.connect = (server) => {
  io = socket(server, {
    cors: {
      origin: true,
    },
  });
};

module.exports.emit = (event, message) => (io ? io.emit(event, message) : false);
