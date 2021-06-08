const mqtt = require('./mqtt.util');

module.exports.listen = () => {
  const signals = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGTERM: 15,
  };
  Object.keys(signals).forEach((signal) => {
    process.on(signal, async () => {
      const code = signals[signal];
      await mqtt.available('offline');
      process.exit(128 + code);
    });
  });
};
