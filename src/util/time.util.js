const moment = require('moment-timezone');
const { TZ, TIME_FORMAT } = require('../constants');

module.exports.current = () => {
  return TZ.toUpperCase() === 'UTC'
    ? moment().utc().format(TIME_FORMAT)
    : moment().tz(TZ).format(TIME_FORMAT);
};

module.exports.unix = () => {
  return moment().unix();
};
