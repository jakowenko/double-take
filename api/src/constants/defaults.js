module.exports = {
  server: { port: 3000 },
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
  notify: {
    gotify: {
      priority: 5,
    },
  },
};
