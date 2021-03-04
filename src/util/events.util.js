const { v4: uuidv4 } = require('uuid');

module.exports.test = () => {
  return {
    camera: `TEST`,
    label: 'person',
    score: '1',
    id: `TEST-${uuidv4()}`,
  };
};
