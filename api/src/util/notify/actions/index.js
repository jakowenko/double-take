const factory = require('../factory');
const { NOTIFY } = require('../../../constants')();
const SERVICES = require('../../../constants/config').notify_services();
const ONLY_UNKNOWN = require('../../../constants/config').notify_unknown();

module.exports.send = (service, output) => factory.get(service).send(output);

/**
 * Publishes the output of the camera analysis to the specified services.
 *
 * @param {object} output - The output of the camera analysis.
 * @param {object} camera - The camera object.
 * @param {object} zones - The zones object.
 * @return {undefined} No return value.
 */
module.exports.publish = (output, camera, zones) => {
  if (ONLY_UNKNOWN && !output.unknown) {
    return;
  }

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

/**
 * Checks if the given camera and zones are approved for the specified service.
 *
 * @param {string} service - The service to check against.
 * @param {Object} options - The options object containing the camera and zones.
 * @param {string} options.camera - The camera to check.
 * @param {Array} options.zones - The zones to check.
 * @return {boolean|string} - Returns true if the camera and zones are approved,
 *                           otherwise returns an error message.
 */
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
