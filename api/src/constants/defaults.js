module.exports = {
  telemetry: true,
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
    attempts: { latest: 10, snapshot: 10, mqtt: true, delay: 0 },
    image: { height: 500 },
    labels: ['person'],
    update_sub_labels: false,
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
      opencv_face_required: false,
    },
    deepstack: {
      timeout: 15,
      opencv_face_required: false,
    },
    facebox: {
      timeout: 15,
      opencv_face_required: false,
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
    path: '',
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
      quality: 95,
      width: 500,
    },
  },
};
