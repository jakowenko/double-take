const { DateTime } = require('luxon');
const { TIME } = require('../constants')();
const { schedule } = require('../constants/config')();

module.exports = {
  checks: (camera) => {
    const checks = [];
    if (!schedule || !Array.isArray(schedule.disable)) return checks;
    const date = DateTime.now().setZone(TIME.TIMEZONE.toUpperCase());
    const weekDay = date.weekdayLong.toLowerCase();
    schedule.disable.forEach((obj) => {
      const { days = [], times = [], cameras = [] } = obj;
      const dayCameraMatch = days.includes(weekDay) && cameras.includes(camera);

      if (dayCameraMatch) {
        times.forEach((time) => {
          let [start, end] = time.split('-');
          start = DateTime.fromISO(start, { zone: TIME.TIMEZONE.toUpperCase() });
          end = DateTime.fromISO(end).setZone(TIME.TIMEZONE.toUpperCase(), {
            zone: TIME.TIMEZONE.toUpperCase(),
          });

          if (date >= start && date < end) checks.push(obj);
        });
      }
    });
    return checks;
  },
};
