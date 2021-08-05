const { BAD_REQUEST } = require('../constants/http-status');

module.exports.respond = (input, res) => {
  try {
    const isError = input instanceof Error;
    const status = input && input.status ? input.status : BAD_REQUEST;
    const firstChar = parseInt(status.toString().charAt(0), 10);
    let message = { success: true };

    if (firstChar === 4 || firstChar === 5) message = { error: input.message };

    if (firstChar === 2) message = input.message ? input.message : message;

    if (isError && !input.http) console.error(input);

    return res.status(status).json(message);
  } catch (error) {
    console.error(input || error);
  }
};

module.exports.HTTPSuccess = (status, message) => {
  return { status, message };
};

module.exports.HTTPError = (status, message) => {
  if (message.includes('warn:')) {
    message = message.replace('warn:', '').trim();
    console.warn(message);
  } else console.error(message);

  if (typeof message === 'string') {
    const error = new Error(message);
    error.status = status;
    error.http = true;
    return error;
  }
  if (typeof message === 'object') {
    return { status, message, http: true };
  }

  return { status, message: true, http: true };
};
