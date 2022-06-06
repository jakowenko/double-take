const os = require('os');
const schedule = require('node-schedule');
const axios = require('axios');
const { version } = require('../../package.json');
const { TELEMETRY } = require('../constants')();

module.exports.cron = async () => {
  if (process.env.NODE_ENV !== 'production' || !TELEMETRY) return;
  await this.track();
  schedule.scheduleJob('*/30 * * * *', () => this.track());
};

module.exports.track = async () =>
  axios({
    method: 'post',
    url: 'https://api.double-take.io/v1/telemetry',
    timeout: 5 * 1000,
    data: {
      version,
      arch: os.arch(),
      ha_addon: !!process.env.HA_ADDON,
    },
    validateStatus: () => true,
  }).catch((/* error */) => {});
