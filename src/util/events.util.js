const { v4: uuidv4 } = require('uuid');

module.exports.manual = (req, res, next) => {
  req.body = {
    isTestEvent: true,
    type: 'Manual Event',
    before: {
      camera: `manual`,
      label: 'person',
      score: '1',
      id: `manual-event-${uuidv4()}`,
    },
  };
  next();
};
