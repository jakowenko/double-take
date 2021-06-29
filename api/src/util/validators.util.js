const axios = require('axios');
const logger = require('./logger.util');
const { expressValidator } = require('./validate.util');

const { query, param /* , body */ } = expressValidator;

module.exports.recognize = ({ get }) => {
  let validations = [
    query('results').default('best').isIn(['best', 'all']).withMessage('not a valid result type'),
    query('break').default(true).isIn([true, false]),
    query('type').default('manual'),
  ];
  if (get) {
    validations = validations.concat([
      query('camera').default('double-take'),
      query('url').isLength({ min: 1 }),
      query('attempts').default(1).isInt().withMessage('not a valid number'),
    ]);
  }

  return validations;
};

module.exports.manage = () => {
  return {
    ui: () => {
      return [query('limit').default(30).isInt().withMessage('not a limit number')];
    },
    delete: () => {
      return [];
      // return [body('key').isString().withMessage('not a valid key')];
    },
    move: () => {
      return [];
      // return [
      //   body('folder').isString().withMessage('not a valid folder'),
      //   body('key').isString().withMessage('not a valid key'),
      //   body('filename').isString().withMessage('not a valid filename'),
      // ];
    },
  };
};

module.exports.storage = () => {
  return {
    matches: () => {
      return [query('bbox').default(false).isIn([true, false])];
    },
  };
};

module.exports.config = () => [query('format').default('json').isIn(['json', 'yaml'])];

module.exports.objects = () => {
  return [
    query('url').isLength({ min: 1 }),
    query('break').default(true).isIn([true, false]),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ];
};

module.exports.cameras = () => {
  return [
    param('camera').isLength({ min: 1 }),
    query('break').default(true).isIn([true, false]),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ];
};

module.exports.tryParseJSON = (json) => {
  try {
    const o = JSON.parse(json);
    if (o && typeof o === 'object') {
      return o;
    }
    // eslint-disable-next-line no-empty
  } catch (e) {}

  return false;
};

module.exports.doesUrlResolve = async (url) => {
  try {
    const instance = axios.create({
      timeout: 1000,
    });
    const data = await instance({
      method: 'get',
      url,
    });
    return data;
  } catch (error) {
    logger.log(`url resolve error: ${error.message}`);
    return false;
  }
};
