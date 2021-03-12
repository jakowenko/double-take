require('dotenv').config();
const { version } = require('../../package.json');

const {
  PORT,
  DETECTORS,
  MQTT_HOST,
  MQTT_USERNAME,
  MQTT_PASSWORD,
  MQTT_TOPIC,
  MQTT_TOPIC_MATCHES,
  FACEBOX_URL,
  COMPREFACE_URL,
  FRIGATE_URL,
  FRIGATE_IMAGE_HEIGHT,
  COMPREFACE_API_KEY,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
  LOGS,
  TZ,
} = process.env;

let constants = {
  VERSION: version,
  PORT: PORT || 3000,
  DETECTORS: DETECTORS ? DETECTORS.replace(/ /g, '').split(',') : [],
  STORAGE_PATH: './.storage',
  LOGS: LOGS || null,
  TZ: TZ || 'America/Detroit',
  CONFIDENCE: CONFIDENCE ? parseInt(CONFIDENCE, 10) : 50,

  MQTT_HOST: MQTT_HOST ? `mqtt://${MQTT_HOST}` : null,
  MQTT_USERNAME: MQTT_USERNAME || null,
  MQTT_PASSWORD: MQTT_PASSWORD || null,
  MQTT_TOPIC: MQTT_HOST && FRIGATE_URL ? MQTT_TOPIC || 'frigate/events' : null,
  MQTT_TOPIC_MATCHES: MQTT_HOST ? MQTT_TOPIC_MATCHES || 'double-take/matches' : null,

  FACEBOX_URL: FACEBOX_URL ? FACEBOX_URL.replace(/\/$/, '') : null,

  COMPREFACE_URL: COMPREFACE_URL ? COMPREFACE_URL.replace(/\/$/, '') : null,
  COMPREFACE_API_KEY: COMPREFACE_URL ? COMPREFACE_API_KEY || null : null,

  FRIGATE_URL: FRIGATE_URL ? FRIGATE_URL.replace(/\/$/, '') : null,
  FRIGATE_IMAGE_HEIGHT: FRIGATE_URL ? FRIGATE_IMAGE_HEIGHT || 800 : null,
  SNAPSHOT_RETRIES: FRIGATE_URL ? parseInt(SNAPSHOT_RETRIES, 10) || 10 : null,
  LATEST_RETRIES: FRIGATE_URL ? parseInt(LATEST_RETRIES, 10) || 10 : null,
};

for (const [key, value] of Object.entries(constants)) {
  if (value === null) {
    delete constants[key];
  }
}

constants = Object.keys(constants)
  .sort()
  .reduce((obj, key) => {
    obj[key] = constants[key];
    return obj;
  }, {});

module.exports = constants;
