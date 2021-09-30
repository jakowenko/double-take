const { createLogger, format, transports } = require('winston');
const util = require('util');
const { core: SYSTEM_CORE } = require('../constants/system');
const { LOGS } = require('../constants')();
const mqtt = require('./mqtt.util');
const redact = require('./redact-secrets.util');

const combineMessageAndSplat = () => {
  return {
    transform: (info /* , opts */) => {
      info.message = util.format(redact(info.message), ...redact(info[Symbol.for('splat')] || []));
      return info;
    },
  };
};

module.exports.init = () => {
  const logFormat = format.combine(combineMessageAndSplat(), format.simple());

  const logger = createLogger({
    silent: LOGS.LEVEL === 'silent',
    level: LOGS.LEVEL,
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          logFormat,
          format.printf((info) => `${info.level}: ${info.message}`)
        ),
      }),
      new transports.File({
        filename: `${SYSTEM_CORE.storage.path}/messages.log`,
        format: format.combine(
          logFormat,
          format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
          format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
      }),
    ],
  });

  console.log = (...args) => logger.info(...args);
  console.info = (...args) => logger.info(...args);
  console.warn = (...args) => logger.warn(...args);
  console.error = (...args) => {
    const isError = args[0] instanceof Error;
    const message = isError
      ? args[0].stack
        ? args[0].stack.includes(args[0].message)
          ? args[0].stack
          : `${args[0].message}\n${args[0].stack}`
        : args[0].toString()
      : args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');

    if (isError) logger.error(message);
    else logger.error(...args);

    mqtt.publish({
      topic: 'double-take/errors',
      message: isError
        ? JSON.stringify(args[0], Object.getOwnPropertyNames(args[0]))
        : JSON.stringify({ message }),
    });
  };
  console.http = (...args) => logger.http(...args);
  console.verbose = (...args) => logger.verbose(...args);
  console.debug = (...args) => logger.debug(...args);
  console.silly = (...args) => logger.silly(...args);
};
