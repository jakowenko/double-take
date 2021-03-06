const { v4: uuidv4 } = require('uuid');

module.exports.test = (req, res, next) => {
  req.body = {
    isTestEvent: true,
    type: 'Test Event',
    before: {
      camera: `test-camera`,
      label: 'person',
      score: '1',
      id: `test-event-${uuidv4()}`,
    },
  };
  next();
};
