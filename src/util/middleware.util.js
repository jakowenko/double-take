const { expressValidator } = require('./validate.util');

const { query } = expressValidator;

module.exports.recognize = (isGET) => {
  let validations = [
    query('results').default('best').isIn(['best', 'all']).withMessage('not a valid result type'),
    query('break').default(true).isIn([true, false]),
    query('processing')
      .default('parallel')
      .isIn(['parallel', 'serial'])
      .withMessage('not a valid processing type'),
  ];
  if (isGET === true) {
    validations = validations.concat([
      query('url').isURL().withMessage('not a valid url'),
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
