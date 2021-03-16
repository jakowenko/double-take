const { expressValidator } = require('./validate.util');

const { query } = expressValidator;

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

module.exports.train = () => {
  return [
    query('output').default('html').isIn(['html', 'json']).withMessage('not a valid output type'),
    query('attempts').default(1).isInt().withMessage('not a valid number'),
  ];
};
