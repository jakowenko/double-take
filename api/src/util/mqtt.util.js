const filesystem = require('fs');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const mqtt = require('mqtt');
const fs = require('./fs.util');
const { jwt } = require('./auth.util');
const { AUTH, SERVER, MQTT, FRIGATE, CAMERAS, STORAGE, UI } = require('../constants')();
const config = require('../constants/config');

let PREVIOUS_MQTT_LENGTHS = [];
let JUST_SUBSCRIBED = false;
let CLIENT = false;
const PERSON_RESET_TIMEOUT = {};
let STATUS;

const logStatus = (status, console) => {
  STATUS = status;
  console(`MQTT: ${status}`);
};

const cameraTopics = () => {
  return CAMERAS
    ? Object.keys(CAMERAS)
        .filter((key) => CAMERAS[key]?.SNAPSHOT && CAMERAS[key]?.SNAPSHOT?.TOPIC)
        .map((key) => {
          return CAMERAS[key].SNAPSHOT.TOPIC;
        })
    : [];
};

const processMessage = ({ topic, message }) => {
  const init = async () => {
    if ((topic.includes('/snapshot') || cameraTopics().includes(topic)) && !JUST_SUBSCRIBED)
      await processMessage({ topic, message }).snapshot();
    if (topic.includes('/events')) await processMessage({ topic, message }).frigate();
  };

  const snapshot = async () => {
    const foundCamera = CAMERAS
      ? Object.keys(CAMERAS).find((key) => CAMERAS[key]?.SNAPSHOT?.TOPIC === topic)
      : null;
    const camera = (foundCamera || topic.split('/')[1]).toLowerCase();
    const filename = `${uuidv4()}.jpg`;
    const buffer = Buffer.from(message);

    const { ATTEMPTS } = foundCamera ? { ATTEMPTS: { MQTT: true } } : config.frigate({ camera });

    if (!ATTEMPTS.MQTT || PREVIOUS_MQTT_LENGTHS.includes(buffer.length)) return;
    PREVIOUS_MQTT_LENGTHS.unshift(buffer.length);

    fs.writer(`${STORAGE.TMP.PATH}/${filename}`, buffer);
    await axios({
      method: 'get',
      url: `http://0.0.0.0:${SERVER.PORT}${UI.PATH}/api/recognize`,
      headers: AUTH ? { authorization: jwt.sign({ route: 'recognize' }) } : null,
      params: {
        url: `http://0.0.0.0:${SERVER.PORT}${UI.PATH}/api/${STORAGE.TMP.PATH}/${filename}`,
        type: 'mqtt',
        camera,
      },
      validateStatus: () => true,
    });
    fs.delete(`${STORAGE.TMP.PATH}/${filename}`, buffer);
    // only store last 10 mqtt lengths
    PREVIOUS_MQTT_LENGTHS = PREVIOUS_MQTT_LENGTHS.slice(0, 10);
  };

  const frigate = async () => {
    const payload = JSON.parse(message.toString());
    if (payload.type === 'end') return;

    await axios({
      method: 'post',
      url: `http://0.0.0.0:${SERVER.PORT}${UI.PATH}/api/recognize`,
      headers: AUTH ? { authorization: jwt.sign({ route: 'recognize' }) } : null,
      data: {
        ...payload,
        topic,
      },
      validateStatus: () => true,
    });
  };

  return { init, snapshot, frigate };
};

module.exports.connect = () => {
  if (!MQTT || !MQTT.HOST) return;

  try {
    CLIENT = mqtt.connect(`mqtt://${MQTT.HOST}`, {
      reconnectPeriod: 10000,
      username: MQTT.USERNAME || MQTT.USER,
      password: MQTT.PASSWORD || MQTT.PASS,
      clientId: MQTT.CLIENT_ID || `double-take-${Math.random().toString(16).substr(2, 8)}`,
      key: MQTT.TLS.KEY ? filesystem.readFileSync(MQTT.TLS.KEY) : null,
      cert: MQTT.TLS.CERT ? filesystem.readFileSync(MQTT.TLS.CERT) : null,
      ca: MQTT.TLS.CA ? filesystem.readFileSync(MQTT.TLS.CA) : null,
      rejectUnauthorized: MQTT.TLS.REJECT_UNAUTHORIZED === true,
    });

    CLIENT.on('connect', () => {
      logStatus('connected', console.log);
      this.publish({ topic: 'double-take/errors' });
      this.available('online');
      this.subscribe();
    })
      .on('error', (err) => logStatus(err.message, console.error))
      .on('offline', () => logStatus('offline', console.error))
      .on('disconnect', () => logStatus('disconnected', console.error))
      .on('reconnect', () => logStatus('reconnecting', console.warn))
      .on('message', async (topic, message) => processMessage({ topic, message }).init());
  } catch (error) {
    logStatus(error.message, console.error);
  }
};

module.exports.available = async (state) => {
  if (CLIENT) this.publish({ topic: 'double-take/available', retain: true, message: state });
};

module.exports.subscribe = () => {
  const topics = [];

  topics.push(...cameraTopics());

  if (FRIGATE?.URL && MQTT.TOPICS.FRIGATE) {
    const isArray = Array.isArray(MQTT.TOPICS.FRIGATE);

    const frigateTopics = isArray ? MQTT.TOPICS.FRIGATE : [MQTT.TOPICS.FRIGATE];
    topics.push(...frigateTopics);
    frigateTopics.forEach((topic) => {
      const [prefix] = topic.split('/');
      topics.push(
        ...(FRIGATE.CAMERAS
          ? FRIGATE.CAMERAS.map((camera) => `${prefix}/${camera}/person/snapshot`)
          : [`${prefix}/+/person/snapshot`])
      );
    });
  }

  if (topics.length) {
    CLIENT.subscribe(topics, (err) => {
      if (err) {
        console.error(`MQTT: error subscribing to ${topics.join(', ')}`);
        return;
      }
      console.log(`MQTT: subscribed to ${topics.join(', ')}`);
      JUST_SUBSCRIBED = true;
      setTimeout(() => (JUST_SUBSCRIBED = false), 5000);
    });
  }
};

module.exports.recognize = (data) => {
  try {
    if (!MQTT || !MQTT.HOST) return;
    const baseData = JSON.parse(JSON.stringify(data));
    const { id, duration, timestamp, attempts, zones, matches, misses, unknowns, counts, token } =
      baseData;
    const camera = baseData.camera.toLowerCase();

    const payload = {
      base: {
        id,
        duration,
        timestamp,
        attempts,
        camera,
        zones,
        token,
      },
    };
    payload.unknown = { ...payload.base, unknown: unknowns[0], unknowns };
    payload.match = { ...payload.base };
    payload.camera = {
      ...payload.base,
      matches,
      misses,
      unknowns,
      personCount: counts.person,
      counts,
    };
    payload.cameraReset = {
      ...payload.camera,
      personCount: 0,
      counts: {
        person: 0,
        match: 0,
        miss: 0,
        unknown: 0,
      },
    };

    const messages = [];

    messages.push({
      topic: `${MQTT.TOPICS.CAMERAS}/${camera}/person`,
      retain: true,
      message: counts.person.toString(),
    });

    if (unknowns.length) {
      messages.push({
        topic: `${MQTT.TOPICS.MATCHES}/unknown`,
        retain: false,
        message: JSON.stringify(payload.unknown),
      });

      if (MQTT.TOPICS.HOMEASSISTANT) {
        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/unknown/config`,
          retain: true,
          message: JSON.stringify({
            name: 'double_take_unknown',
            icon: 'mdi:account',
            value_template: '{{ value_json.camera }}',
            state_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/unknown/state`,
            json_attributes_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/unknown/state`,
            availability_topic: 'double-take/available',
            unique_id: `double_take_unknown`,
          }),
        });

        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/unknown/state`,
          retain: true,
          message: JSON.stringify(payload.unknown),
        });
      }
    }

    matches.forEach((match) => {
      const topic = match.name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '');
      const name = match.name.replace(/\s+/g, '_');

      messages.push({
        topic: `${MQTT.TOPICS.MATCHES}/${topic}`,
        retain: false,
        message: JSON.stringify({
          ...payload.match,
          match,
        }),
      });

      if (MQTT.TOPICS.HOMEASSISTANT) {
        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${topic}/config`,
          retain: true,
          message: JSON.stringify({
            name: `double_take_${name}`,
            icon: 'mdi:account',
            value_template: '{{ value_json.camera }}',
            state_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${topic}/state`,
            json_attributes_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${topic}/state`,
            availability_topic: 'double-take/available',
            unique_id: `double_take_${name}`,
          }),
        });

        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${topic}/state`,
          retain: true,
          message: JSON.stringify({
            ...payload.match,
            match,
          }),
        });
      }
    });

    if (matches.length || misses.length || unknowns.length) {
      messages.push({
        topic: `${MQTT.TOPICS.CAMERAS}/${camera}`,
        retain: false,
        message: JSON.stringify(payload.camera),
      });

      if (MQTT.TOPICS.HOMEASSISTANT) {
        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${camera}/config`,
          retain: true,
          message: JSON.stringify({
            name: `double_take_${camera}`,
            icon: 'mdi:camera',
            value_template: '{{ value_json.counts.person }}',
            state_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${camera}/state`,
            json_attributes_topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${camera}/state`,
            availability_topic: 'double-take/available',
            unique_id: `double_take_${camera}`,
          }),
        });

        messages.push({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${camera}/state`,
          retain: true,
          message: JSON.stringify(payload.camera),
        });
      }
    }

    this.publish(messages);

    clearTimeout(PERSON_RESET_TIMEOUT[camera]);
    PERSON_RESET_TIMEOUT[camera] = setTimeout(() => {
      this.publish({ topic: `${MQTT.TOPICS.CAMERAS}/${camera}/person`, retain: true, message: '0' });
      if (MQTT.TOPICS.HOMEASSISTANT) {
        this.publish({
          topic: `${MQTT.TOPICS.HOMEASSISTANT}/sensor/double-take/${camera}/state`,
          retain: true,
          message: JSON.stringify(payload.cameraReset),
        });
      }
    }, 30000);
  } catch (error) {
    error.message = `MQTT: recognize error: ${error.message}`;
    console.error(error);
  }
};

module.exports.publish = (data) => {
  if (!CLIENT) return;
  const multiple = Array.isArray(data);
  const single = data && !multiple && typeof data === 'object';

  if (!single && !multiple) console.error('MQTT: publish error');

  const messages = single ? [{ ...data }] : data;
  messages.forEach((message) => CLIENT.publish(message.topic, message.message, { retain: message.retain === true }));
};

module.exports.status = () => ({
  connected: CLIENT.connected || false,
  status: STATUS || false,
});
