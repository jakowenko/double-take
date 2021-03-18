const { DateTime } = require('luxon');
const { TZ, DATE_TIME_FORMAT } = require('../constants');

module.exports.current = () => {
  return DATE_TIME_FORMAT !== undefined
    ? DateTime.now().setZone(TZ.toUpperCase()).toFormat(DATE_TIME_FORMAT)
    : DateTime.now().setZone(TZ.toUpperCase()).toString();
};

module.exports.unix = () => {
  return DateTime.now().toMillis();
};
