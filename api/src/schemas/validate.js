const { Validator } = require('jsonschema');
const { config, detect, zones } = require('.');

module.exports = (object) => {
  const v = new Validator();
  v.addSchema(detect);
  v.addSchema(zones);

  const { errors } = v.validate(object, config);
  if (errors.length)
    console.error(`${errors.length} validation ${errors.length === 1 ? 'error' : 'errors'}`);
  errors.forEach((error) => {
    const path = !error.path.length ? 'config' : error.path.join('.');
    const instance = typeof error.instance === 'string' ? ` (${error.instance})` : '';
    console.error(`${path}${instance} ${error.message}`);
  });
};
