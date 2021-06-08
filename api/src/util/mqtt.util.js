const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const mqtt = require('mqtt');
const fs = require('fs');
const logger = require('./logger.util');
const { SERVER, MQTT, FRIGATE } = require('../constants');

let previousMqttLengths = [];
let justSubscribed = false;
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
      this.available('online');
      this.subscribe();
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
      logger.log('MQTT: attempting to reconnect');
    })
    .on('message', async (topic, message) => {
      if (topic.includes('/snapshot') && !justSubscribed) {
        const camera = topic.split('/')[1];
        const filename = `${uuidv4()}.jpg`;
        const buffer = Buffer.from(message);

        if (previousMqttLengths.includes(buffer.length)) {
          return;
        }
        previousMqttLengths.unshift(buffer.length);

        fs.writeFileSync(`/tmp/${filename}`, buffer);
        await axios({
          method: 'get',
          url: `http://0.0.0.0:${SERVER.PORT}/api/recognize`,
          params: {
            url: `http://0.0.0.0:${SERVER.PORT}/api/tmp/${filename}`,
            type: 'mqtt',
            camera,
          },
          validateStatus() {
            return true;
          },
        });
        // only store last 10 mqtt lengths
        previousMqttLengths = previousMqttLengths.slice(0, 10);
      } else if (topic.includes('/events')) {
        await axios({
          method: 'post',
          url: `http://0.0.0.0:${SERVER.PORT}/api/recognize`,
          data: JSON.parse(message.toString()),
          validateStatus() {
            return true;
          },
        });
      }
    });
};

module.exports.available = async (state) => {
  if (client) await client.publish('double-take/available', state);
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
    delete configData.results;

    if (unknown && Object.keys(unknown).length) {
      client.publish(
        `${MQTT.TOPICS.MATCHES}/unknown`,
        JSON.stringify({
          ...configData,
          unknown,
        }),
        { retain: true }
      );
    }

    matches.forEach((match) => {
      client.publish(
        `${MQTT.TOPICS.MATCHES}/${match.name}`,
        JSON.stringify({
          ...configData,
          match,
        }),
        { retain: true }
      );
    });

    if (matches.length || (unknown && Object.keys(unknown).length)) {
      client.publish(
        `${MQTT.TOPICS.CAMERAS}/${camera}`,
        JSON.stringify({
          ...configData,
          matches,
          unknown,
        }),
        { retain: true }
      );
    }
  } catch (error) {
    logger.log(`MQTT: publish error: ${error.message}`);
  }
};

module.exports.subscribe = () => {
  if (FRIGATE.URL && MQTT.TOPICS.FRIGATE) {
    client.subscribe(MQTT.TOPICS.FRIGATE, (err) => {
      if (err) {
        logger.log(`MQTT: error subscribing to ${MQTT.TOPICS.FRIGATE}`);
        return;
      }
      logger.log(`MQTT: subscribed to ${MQTT.TOPICS.FRIGATE}`);
    });

    const [prefix] = MQTT.TOPICS.FRIGATE.split('/');
    const topic = FRIGATE.CAMERAS
      ? FRIGATE.CAMERAS.map((camera) => `${prefix}/${camera}/person/snapshot`)
      : `${prefix}/+/person/snapshot`;
    client.subscribe(topic, (err) => {
      if (err) {
        logger.log(`MQTT: error subscribing to ${topic}`);
        return;
      }
      logger.log(`MQTT: subscribed to ${topic}`);
      justSubscribed = true;
      setTimeout(() => (justSubscribed = false), 5000);
    });
  }
};
