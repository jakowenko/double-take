const { createLogger, format, transports } = require('winston');
const util = require('util');
const { STORAGE } = require('../constants');

const combineMessageAndSplat = () => {
  return {
    transform: (info /* , opts */) => {
      info.message = util.format(info.message, ...(info[Symbol.for('splat')] || []));
      return info;
    },
  };
};

module.exports.init = () => {
  const logFormat = format.combine(combineMessageAndSplat(), format.simple());

  const logger = createLogger({
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), logFormat),
      }),
      new transports.File({
        filename: `${STORAGE.PATH}/messages.log`,
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
  console.error = (...args) => logger.error(...args);
};
