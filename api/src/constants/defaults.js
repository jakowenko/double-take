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
    labels: ['person'],
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
      timeout: 15,
    },
    deepstack: {
      timeout: 15,
    },
    facebox: {
      timeout: 15,
    },
  },
  notify: {
    gotify: {
      priority: 5,
    },
  },
  logs: {
    level: 'info',
  },
  ui: {
    theme: 'bootstrap4-dark-blue',
    editor: {
      theme: 'nord_dark',
    },
    logs: {
      lines: 500,
    },
    pagination: {
      limit: 50,
    },
    thumbnails: {
      quality: 80,
      width: 300,
    },
  },
};
