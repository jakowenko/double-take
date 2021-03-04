const axios = require('axios');
const mqtt = require('mqtt');
const logger = require('./logger.util');
const { PORT, MQTT_HOST, MQTT_TOPIC, MQTT_TOPIC_MATCHES } = require('../constants');

module.exports.connect = () => {
  if (!MQTT_HOST) {
    return;
  }
  const client = mqtt.connect(MQTT_HOST, {
    reconnectPeriod: 10000,
  });

  client
    .on('connect', () => {
      logger.log('MQTT: connected');
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          logger.log(`MQTT: error subscribing to ${MQTT_TOPIC}`);
          return;
        }
        logger.log(`MQTT: subscribed to ${MQTT_TOPIC}`);
      });
    })
    .on('error', (err) => {
      logger.log(`MQTT: ${err.code}`);
    })
    .on('offline', () => {
      logger.log('MQTT: offline');
    })
    .on('disconnect', () => {
      logger.log('MQTT: disconnected');
    })
    .on('reconnect', () => {
      logger.log('MQTT: attemping to reconnect');
    })
    .on('message', async (topic, message) => {
      const request = await axios({
        method: 'post',
        url: `http://0.0.0.0:${PORT}/recognize`,
        data: JSON.parse(message.toString()),
      });
      const matches = request.data;
      if (Array.isArray(matches) && matches.length) {
        matches.forEach((match) => {
          client.publish(`${MQTT_TOPIC_MATCHES}/${match.name}`, JSON.stringify(match));
        });
      }
    });
};
