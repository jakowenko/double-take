const os = require('os');
const schedule = require('node-schedule');
const axios = require('axios');
const { version } = require('../../package.json');
const { TELEMETRY } = require('../constants')();

module.exports.cron = async () => {
  if (process.env.NODE_ENV !== 'production' || !TELEMETRY) return;
  await this.track('start');
  schedule.scheduleJob('*/15 * * * *', () => this.track('heartbeat'));
};

module.exports.track = async (type) => {
  try {
    await axios({
      method: 'post',
      url: 'https://analytics.jako.io/api/event',
      data: {
        name: 'pageview',
        url: `http://localhost/${type}`,
        domain: 'double-take-api',
        props: JSON.stringify({
          version,
          arch: os.arch(),
        }),
      },
      validateStatus: () => true,
    });
    // eslint-disable-next-line no-empty
  } catch (error) {}
};
