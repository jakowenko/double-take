const { Validator } = require('jsonschema');
const { config, detect, zones } = require('.');

module.exports = (object, log = true) => {
  const v = new Validator();
  v.addSchema(detect);
  v.addSchema(zones);

  const messages = [];
  const { errors } = v.validate(object, config);
  if (errors.length)
    console.error(`${errors.length} validation ${errors.length === 1 ? 'error' : 'errors'}`);
  errors.forEach((error) => {
    const path = !error.path.length ? 'config' : error.path.join('.');
    const instance = typeof error.instance === 'string' ? ` (${error.instance})` : '';
    const message = `${path}${instance} ${error.message}`;
    if (log) console.error(message);
    messages.push(message);
  });
  return messages;
};
