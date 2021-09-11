module.exports = {
  auth: false,
  token: {
    image: '24h',
  },
  detect: {
    match: {
      save: true,
      base64: false,
      confidence: 60,
      purge: 168,
      min_area: 10000,
    },
    unknown: {
      save: true,
      base64: false,
      confidence: 40,
      purge: 8,
      min_area: 0,
    },
  },
  time: { timezone: 'UTC' },
  frigate: {
    attempts: { latest: 10, snapshot: 0, mqtt: true, delay: 0 },
    image: { height: 500 },
  },
  mqtt: {
    topics: {
      frigate: 'frigate/events',
      matches: 'double-take/matches',
      cameras: 'double-take/cameras',
      homeassistant: 'homeassistant',
    },
  },
  detectors: {
    compreface: {
      det_prob_threshold: 0.8,
    },
  },
  notify: {
    gotify: {
      priority: 5,
    },
  },
};
