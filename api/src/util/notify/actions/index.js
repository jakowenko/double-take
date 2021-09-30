const factory = require('../factory');
const { NOTIFY } = require('../../../constants')();
const SERVICES = require('../../../constants/config').notify();

module.exports.send = (service, output) => factory.get(service).send(output);

module.exports.publish = (output, camera, zones) => {
  if (!output.unknown && !output.matches.length) {
    return;
  }

  for (const service of SERVICES) {
    const check = this.checks(service, { camera, zones });
    if (check === true) {
      this.send(service, output).catch((error) => {
        console.error(`${service} send error: ${error.message}`);
      });
    } else {
      console.error(`${service}: ${check}`);
    }
  }
};

module.exports.checks = (service, { camera, zones }) => {
  const { CAMERAS, ZONES } = NOTIFY[service.toUpperCase()];
  if (CAMERAS && !CAMERAS.includes(camera)) {
    return `${camera} not on approved list`;
  }

  if (ZONES) {
    const [cameraMatch] = ZONES.filter(({ CAMERA }) => camera === CAMERA);

    if (cameraMatch) {
      const [match] = ZONES.filter(({ CAMERA, ZONE }) => camera === CAMERA && zones.includes(ZONE));

      if (!match) {
        return `${camera} zone not on approved list`;
      }
    }
  }

  return true;
};
