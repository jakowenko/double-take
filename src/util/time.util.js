const moment = require('moment-timezone');
const { TZ } = require('../constants');

module.exports.current = () => {
  return moment().tz(TZ).format('MM/DD/YYYY hh:mm:ss A');
};
