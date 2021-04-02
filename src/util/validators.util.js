const { expressValidator } = require('./validate.util');

const { query, body } = expressValidator;

module.exports.recognize = ({ get }) => {
  let validations = [
    query('results').default('best').isIn(['best', 'all']).withMessage('not a valid result type'),
    query('break').default(true).isIn([true, false]),
    query('processing')
      .default('parallel')
      .isIn(['parallel', 'serial'])
      .withMessage('not a valid processing type'),
  ];
  if (get) {
    validations = validations.concat([
      query('camera').default('double-take'),
      query('room').default('Double Take'),
      query('url').isURL(),
      query('attempts').default(1).isInt().withMessage('not a valid number'),
    ]);
  }

  return validations;
};

module.exports.manage = () => {
  return {
    ui: () => {
      return [query('limit').default(50).isInt().withMessage('not a limit number')];
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

module.exports.train = () => {
  return [
    query('output').default('html').isIn(['html', 'json']).withMessage('not a valid output type'),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ];
};

module.exports.objects = () => {
  return [
    query('url').isURL(),
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
