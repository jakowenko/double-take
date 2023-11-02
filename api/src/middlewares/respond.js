/* eslint-disable no-underscore-dangle */
const { OK, NO_CONTENT, SERVER_ERROR } = require('../constants/http-status');

const respond = Object.assign(
  (res, input) => {
    return respond[input instanceof Error ? 'error' : 'success'](res, input);
  },
  {
    success: (res, input) => {
      const status = res.customStatusCode ? res.customStatusCode : !input ? NO_CONTENT : OK;
      if (!input) return { status };
      return { status, body: input };
    },
    error: (res, input) => {
      const status = res.customStatusCode || SERVER_ERROR;
      const body = { error: input.message };
      return { status, body };
    },
  }
);

module.exports = (req, res, next) => {
  const _send = res.send;
  const _status = res.status;

  res.send = (input) => {
    const { status, body } = res.parsed
      ? { status: res.statusCode, body: input }
      : respond(res, input);

    res.status(status);

    if (input instanceof Error && res.statusCode === SERVER_ERROR) console.error(input);

    if (body && typeof body === 'object' && !res.parsed) {
      res.parsed = true;
      res.json.call(res, body);
      return;
    }

    return _send.call(res, body);
  };

  res.status = (input) => {
    res.customStatusCode = input;
    return _status.call(res, input);
  };

  res.error = (input) => {
    const error = input instanceof Error ? input : new Error(input);
    return res.send.call(res, error);
  };

  next();
};
