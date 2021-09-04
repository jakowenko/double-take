/* eslint-disable no-underscore-dangle */
const { OK, NO_CONTENT, SERVER_ERROR } = require('../constants/http-status');

const respond = Object.assign(
  (res, input) => {
    return respond[input instanceof Error ? 'error' : 'success'](res, input);
  },
  {
    success: (res, input) => {
      const status = res.statusCode ? res.statusCode : !input ? NO_CONTENT : OK;
      if (!input) return { status };
      return { status, body: input };
    },
    error: (res, input) => {
      const status = res.statusCode || SERVER_ERROR;
      const body = { error: input.message };
      return { status, body };
    },
  }
);

module.exports = (req, res, next) => {
  res.statusCode = null;
  const _send = res.send;
  const _end = res.end;

  res.send = (input) => {
    if (input instanceof Error && res.statusCode === SERVER_ERROR) console.error(input);

    const { status, body } = res.parsed
      ? { status: res.statusCode, body: input }
      : respond(res, input);

    res.status(status);

    if (body && typeof body === 'object' && !res.parsed) {
      res.parsed = true;
      res.json.call(res, body);
      return;
    }

    _send.call(res, body);
  };

  res.error = (input) => {
    const error = input instanceof Error ? input : new Error(input);
    res.send.call(res, error);
  };

  res.end = (input) => {
    res.statusCode = OK;
    _end.call(res, input);
  };

  next();
};
