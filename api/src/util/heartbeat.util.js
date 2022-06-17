const os = require('os');
const { DateTime } = require('luxon');
const schedule = require('node-schedule');
const axios = require('axios');
const { version } = require('../../package.json');
const { TELEMETRY } = require('../constants')();
const DETECTORS = require('../constants/config').detectors();

module.exports.cron = async () => {
  if (process.env.NODE_ENV !== 'production' || !TELEMETRY) return;
  await this.track();
  schedule.scheduleJob(`${DateTime.now().toFormat('m')} * * * *`, () => this.track());
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
      detectors: DETECTORS,
    },
    validateStatus: () => true,
  }).catch((/* error */) => {});
