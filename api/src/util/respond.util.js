const { BAD_REQUEST } = require('../constants/http-status');

module.exports.respond = (err, res) => {
  try {
    const status = err && err.status ? err.status : BAD_REQUEST;
    const firstChar = parseInt(status.toString().charAt(0), 10);
    let message = { success: true };

    if (firstChar === 4 || firstChar === 5) {
      message = { error: err.message };
    }

    if (firstChar === 2) {
      message = err.message ? err.message : message;
    }

    return res.status(status).json(message);
  } catch (error) {
    console.error(err.toString());
  }
};

module.exports.HTTPSuccess = (status, message) => {
  return { status, message };
};

module.exports.HTTPError = (status, message) => {
  if (typeof message === 'string') {
    const error = new Error(message);
    error.status = status;
    return error;
  }
  if (typeof message === 'object') {
    return { status, message };
  }

  return { status, message: true };
};
// this.HTTPError.prototype = Object.create(Error.prototype);
