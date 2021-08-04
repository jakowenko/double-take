const { createLogger, format, transports } = require('winston');
const util = require('util');
const { core: SYSTEM_CORE } = require('../constants/system');

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
  console.error = (...args) => logger.error(...args);
};
