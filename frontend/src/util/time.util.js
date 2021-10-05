import { DateTime } from 'luxon';

export default {
  format: (ISO) => {
    try {
      const time = localStorage.getItem('time');
      if (time) {
        const { timezone, format } = JSON.parse(time);
        return format ? DateTime.fromISO(ISO).setZone(timezone.toUpperCase()).toFormat(format) : ISO;
      }
      return ISO;
    } catch (error) {
      return ISO;
    }
  },
  ago: (ISO) => {
    const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
    const dateTime = DateTime.fromISO(ISO);
    const diff = dateTime.diffNow().shiftTo(...units);
    const unit = units.find((u) => diff.get(u) !== 0) || 'second';
    const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    return relativeFormatter.format(Math.trunc(diff.as(unit)), unit);
  },
};
