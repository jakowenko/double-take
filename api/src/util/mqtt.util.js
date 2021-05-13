const axios = require('axios');
const mqtt = require('mqtt');
const logger = require('./logger.util');
const { SERVER, MQTT, FRIGATE } = require('../constants');

let client = false;

module.exports.connect = () => {
  if (!MQTT.HOST) {
    return;
  }
  client = mqtt.connect(`mqtt://${MQTT.HOST}`, {
    reconnectPeriod: 10000,
    username: MQTT.USERNAME,
    password: MQTT.PASSWORD,
  });

  client
    .on('connect', () => {
      logger.log('MQTT: connected');
      if (FRIGATE.URL && MQTT.TOPICS.FRIGATE) {
        client.subscribe(MQTT.TOPICS.FRIGATE, (err) => {
          if (err) {
            logger.log(`MQTT: error subscribing to ${MQTT.TOPICS.FRIGATE}`);
            return;
          }
          logger.log(`MQTT: subscribed to ${MQTT.TOPICS.FRIGATE}`);
        });
      }
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
      await axios({
        method: 'post',
        url: `http://0.0.0.0:${SERVER.PORT}/api/recognize`,
        data: JSON.parse(message.toString()),
        validateStatus() {
          return true;
        },
      });
    });
};

module.exports.publish = (data) => {
  try {
    if (!MQTT || !MQTT.HOST) {
      return;
    }
    const { matches, unknown, camera } = data;

    const configData = JSON.parse(JSON.stringify(data));
    delete configData.matches;
    delete configData.unknown;

    if (unknown && Object.keys(unknown).length) {
      const payload = {
        ...configData,
        unknown,
      };
      client.publish(`${MQTT.TOPICS.MATCHES}/unknown`, JSON.stringify(payload));
    }

    matches.forEach((match) => {
      const payload = {
        ...configData,
        match,
      };
      client.publish(`${MQTT.TOPICS.MATCHES}/${match.name}`, JSON.stringify(payload));
    });

    if (matches.length) {
      client.publish(
        `${MQTT.TOPICS.CAMERAS}/${camera}`,
        JSON.stringify({
          ...configData,
          matches,
        })
      );
    }
  } catch (error) {
    logger.log(`MQTT: publish error: ${error.message}`);
  }
};
