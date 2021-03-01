require('dotenv').config();

const {
  PORT,
  DETECTORS,
  MQTT_HOST,
  MQTT_TOPIC,
  MQTT_TOPIC_MATCHES,
  FACEBOX_URL,
  COMPREFACE_URL,
  FRIGATE_URL,
  COMPREFACE_API_KEY,
  SNAPSHOT_RETRIES,
  LATEST_RETRIES,
  CONFIDENCE,
} = process.env;

const constants = {
  PORT: PORT || 3000,
  DETECTORS: DETECTORS ? DETECTORS.replace(/ /g, '').split(',') : null,
  MQTT_HOST: MQTT_HOST ? `mqtt://${MQTT_HOST}` : null,
  MQTT_TOPIC: MQTT_HOST ? MQTT_TOPIC || 'frigate/events' : null,
  MQTT_TOPIC_MATCHES: MQTT_HOST ? MQTT_TOPIC_MATCHES || 'frigate-events/matches' : null,
  FACEBOX_URL: FACEBOX_URL || null,
  COMPREFACE_URL: COMPREFACE_URL || null,
  FRIGATE_URL: FRIGATE_URL || null,
  COMPREFACE_API_KEY: COMPREFACE_URL ? COMPREFACE_API_KEY || null : null,
  SNAPSHOT_RETRIES: FRIGATE_URL ? parseInt(SNAPSHOT_RETRIES, 10) || 10 : null,
  LATEST_RETRIES: FRIGATE_URL ? parseInt(LATEST_RETRIES, 10) || 10 : null,
  CONFIDENCE: FRIGATE_URL ? parseInt(CONFIDENCE, 10) || 50 : null,
  STORAGE_PATH: './.storage',
};

for (const [key, value] of Object.entries(constants)) {
  if (value === null) {
    delete constants[key];
  }
}

module.exports = constants;
