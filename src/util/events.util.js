const { v4: uuidv4 } = require('uuid');

module.exports.manual = (req, res, next) => {
  req.body = {
    manual: true,
    camera: 'double-take',
    id: uuidv4(),
  };
  next();
};
