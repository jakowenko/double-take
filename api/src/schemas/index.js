module.exports.config = {
  type: 'object',
  required: ['detectors'],
  properties: {
    auth: { type: 'boolean' },
    token: {
      type: 'object',
      properties: {
        image: { type: ['string', 'number'] },
      },
    },
    mqtt: {
      type: 'object',
      required: ['host'],
      properties: {
        host: { type: 'string' },
        topics: {
          type: 'object',
          properties: {
            frigate: { type: 'string' },
            homeassistant: { type: ['string', 'boolean'] },
            matches: { type: 'string' },
            cameras: { type: 'string' },
          },
        },
      },
    },
    detect: { $ref: '/detect' },
    frigate: {
      type: 'object',
      required: ['url'],
      properties: {
        url: { type: 'string' },
        labels: { type: 'array' },
        attempts: {
          type: 'object',
          properties: {
            latest: { type: 'number' },
            snapshot: { type: 'number' },
            mqtt: { type: 'boolean' },
            delay: { type: 'number' },
          },
        },
        image: {
          type: 'object',
          properties: {
            height: { type: 'number' },
          },
        },
        cameras: {
          type: 'array',
        },
        zones: { $ref: '/zones' },
        events: {
          type: 'object',
          patternProperties: {
            '.*': {
              properties: {
                attempts: {
                  type: 'object',
                  properties: {
                    latest: { type: 'number' },
                    snapshot: { type: 'number' },
                    mqtt: { type: 'boolean' },
                    delay: { type: 'number' },
                  },
                },
                image: {
                  type: 'object',
                  properties: {
                    height: { type: 'number' },
                    latest: { type: 'string' },
                    snapshot: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    cameras: {
      type: 'object',
      patternProperties: {
        '.*': {
          properties: {
            masks: {
              type: 'object',
              required: ['coordinates', 'size'],
              properties: {
                coordinates: { type: ['string', 'array'] },
                visible: { type: 'boolean' },
                size: { type: 'string' },
              },
            },
            detect: { $ref: '/detect' },
            snapshot: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                topic: { type: 'string' },
              },
            },
          },
        },
      },
    },
    detectors: {
      type: 'object',
      anyOf: [{ required: ['compreface'] }, { required: ['deepstack'] }, { required: ['facebox'] }],
      properties: {
        compreface: {
          type: 'object',
          required: ['url', 'key'],
          properties: {
            url: { type: 'string' },
            opencv_face_required: { type: 'boolean' },
          },
        },
        deepstack: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' },
            opencv_face_required: { type: 'boolean' },
          },
        },
        facebox: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' },
            opencv_face_required: { type: 'boolean' },
          },
        },
      },
    },
    notify: {
      type: 'object',
      properties: {
        gotify: {
          type: 'object',
          required: ['url'],
          properties: {
            url: { type: 'string' },
            cameras: { type: 'array' },
            zones: { $ref: '/zones' },
          },
        },
      },
    },
    time: {
      type: 'object',
      properties: {
        format: { type: ['string', 'null'] },
        timezone: { type: 'string' },
      },
    },
    logs: {
      type: 'object',
      properties: {
        level: { type: 'string' },
      },
    },
    ui: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        pagination: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
          },
        },
        thumbnails: {
          type: 'object',
          properties: {
            quality: { type: 'number' },
            width: { type: 'number' },
          },
        },
        logs: {
          type: 'object',
          properties: {
            lines: { type: 'number' },
          },
        },
      },
    },
  },
};

module.exports.detect = {
  id: '/detect',
  type: 'object',
  properties: {
    match: {
      type: 'object',
      properties: {
        save: { type: 'boolean' },
        base64: { type: ['string', 'boolean'] },
        confidence: { type: 'number' },
        purge: { type: 'number' },
        min_area: { type: 'number' },
        stop_on_match: { type: 'boolean' },
      },
    },
    unknown: {
      type: 'object',
      properties: {
        save: { type: 'boolean' },
        base64: { type: ['string', 'boolean'] },
        confidence: { type: 'number' },
        purge: { type: 'number' },
        min_area: { type: 'number' },
      },
    },
  },
};

module.exports.zones = {
  id: '/zones',
  type: 'array',
  items: {
    properties: {
      camera: { type: 'string' },
      zone: { type: 'string' },
    },
  },
};
