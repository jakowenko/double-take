module.exports = {
  auth: false,
  token: {
    image: '24h',
  },
  confidence: {
    match: 60,
    unknown: 40,
  },
  save: {
    matches: true,
    unknown: true,
  },
  objects: {
    face: { min_area_match: 10000 },
  },
  time: { timezone: 'UTC' },
  frigate: {
    attempts: { latest: 10, snapshot: 0 },
    image: { height: 500 },
  },
  purge: {
    matches: 168,
    unknown: 8,
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
