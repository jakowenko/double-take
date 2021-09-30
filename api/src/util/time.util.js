const { DateTime } = require('luxon');
const { TIMEZONE, FORMAT } = require('../constants')().TIME;

module.exports.current = () => {
  return FORMAT
    ? DateTime.now().setZone(TIMEZONE.toUpperCase()).toFormat(FORMAT)
    : DateTime.now().setZone(TIMEZONE.toUpperCase()).toString();
};

module.exports.utc = () => {
  return DateTime.now().setZone('UTC').toString();
};

module.exports.unix = () => {
  return DateTime.now().toMillis();
};

module.exports.ago = (date) => {
  const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

  const dateTime = DateTime.fromISO(date.toISOString());
  const diff = dateTime.diffNow().shiftTo(...units);
  const unit = units.find((u) => diff.get(u) !== 0) || 'second';

  const relativeFormatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });
  return relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
};
