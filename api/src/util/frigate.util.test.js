const { checks } = require('./frigate.util');

describe('checks', () => {
  it('should throw an error if Frigate URL is not configured', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'label',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: 'IDS',
    };

    try {
      await checks(params);
    } catch (error) {
      expect(error.message).toBe('Frigate URL not configured');
    }
  });

  it('should return an error message if camera is not on the approved list', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'label',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: 'IDS',
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera1', 'camera2'],
      ZONES: [],
      LABELS: [],
      MIN_AREA: 0,
    };

    try {
      await checks(params, FRIGATE);
    } catch (error) {
      expect(error).toBe('123 - camera not on approved list');
    }
  });

  it('should return an error message if camera zone is not on the approved list', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'label',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: 'IDS',
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera'],
      ZONES: [
        { CAMERA: 'camera', ZONE: 'zone1' },
        { CAMERA: 'camera', ZONE: 'zone2' },
      ],
      LABELS: [],
      MIN_AREA: 0,
    };

    try {
      await checks(params, FRIGATE);
    } catch (error) {
      expect(error).toBe('123 - camera zone not on approved list');
    }
  });

  it('should return an error message if the label is not in the approved labels list', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'unknownLabel',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: 'IDS',
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera'],
      ZONES: [],
      LABELS: ['label1', 'label2'],
      MIN_AREA: 0,
    };

    try {
      await checks(params, FRIGATE);
    } catch (error) {
      expect(error).toBe('123 - unknownLabel label not in (label1, label2)');
    }
  });

  it('should return an error message if the object area is smaller than the minimum area', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'label',
      camera: 'camera',
      area: 5,
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: 'IDS',
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera'],
      ZONES: [],
      LABELS: [],
      MIN_AREA: 10,
    };

    try {
      await checks(params, FRIGATE);
    } catch (error) {
      expect(error).toBe('skipping object area smaller than 10 (5)');
    }
  });

  it('should return an error message if the ID has already been processed', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'label',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: ['123', '456'],
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera'],
      ZONES: [],
      LABELS: [],
      MIN_AREA: 0,
    };

    try {
      await checks(params, FRIGATE);
    } catch (error) {
      expect(error).toBe('already processed 123');
    }
  });

  it('should return true if all checks pass', async () => {
    const params = {
      id: '123',
      frigateEventType: 'type',
      topic: 'topic',
      label: 'person',
      camera: 'camera',
      area: 'area',
      zones: 'zones',
      PROCESSING: 'PROCESSING',
      IDS: [],
    };

    const FRIGATE = {
      URL: 'https://frigate.example.com',
      CAMERAS: ['camera'],
      ZONES: [],
      LABELS: ['label'],
      MIN_AREA: 0,
    };

    const result = await checks(params, FRIGATE);

    expect(result).toBe(true);
  });
});
