const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const actions = require('./actions');
const { DETECTORS } = require('../../constants')();
const config = require('../../constants/config');
const math = require('mathjs');

const { COMPREFACE } = DETECTORS || {};

/**
 * Calculates the orientation coefficient vector after applying rotations in pitch, roll, and yaw.
 *
 * The function takes three angles (pitch, roll, and yaw), converts them from degrees to radians,
 * and computes the resultant orientation as a 3D vector based on the rotation matrices for each axis.
 * The rotations are applied in the order of yaw, pitch, and then roll.
 *
 * @param {number} pitch - The rotation angle around the X-axis in degrees.
 * @param {number} roll - The rotation angle around the Y-axis in degrees.
 * @param {number} yaw - The rotation angle around the Z-axis in degrees.
 * @returns {Array} An array representing the direction vector of the pose after the rotation.
 */
function calculateOrientationCoefficient(pitch, roll, yaw) {
  // Convert angles from degrees to radians
  const pitchRad = math.unit(pitch, 'deg').toNumber('rad');
  const rollRad = math.unit(roll, 'deg').toNumber('rad');
  const yawRad = math.unit(yaw, 'deg').toNumber('rad');

  // Rotation matrices for Roll, Pitch, and Yaw
  const Rx = math.matrix([
    [1, 0, 0],
    [0, Math.cos(rollRad), -Math.sin(rollRad)],
    [0, Math.sin(rollRad), Math.cos(rollRad)],
  ]);

  const Ry = math.matrix([
    [Math.cos(pitchRad), 0, Math.sin(pitchRad)],
    [0, 1, 0],
    [-Math.sin(pitchRad), 0, Math.cos(pitchRad)],
  ]);

  const Rz = math.matrix([
    [Math.cos(yawRad), -Math.sin(yawRad), 0],
    [Math.sin(yawRad), Math.cos(yawRad), 0],
    [0, 0, 1],
  ]);

  // Combined rotation matrix (Rz * Ry * Rx)
  const R = math.multiply(Rz, Ry, Rx);

  // Assuming initial pose direction is along the Z-axis
  const initialPose = [0, 0, 1];

  // Calculating the new pose direction
  const poseDirection = math.multiply(R, initialPose);

  return poseDirection.toArray();
}

function isFacingCamera(pitch, roll, yaw) {
  // Validate pitch, roll, and yaw as numbers
  if (typeof pitch !== 'number' || typeof roll !== 'number' || typeof yaw !== 'number') {
    throw new Error('Invalid input: pitch, roll, and yaw must be numbers');
  }

  const poseDirection = calculateOrientationCoefficient(pitch, roll, yaw);

  // Check if poseDirection has at least three elements
  if (!Array.isArray(poseDirection) || poseDirection.length < 3) {
    throw new Error('poseDirection must be an array with at least three elements');
  }

  // Extract components for better readability
  const xComponent = Math.abs(poseDirection[0]);
  const yComponent = Math.abs(poseDirection[1]);
  const zComponent = Math.abs(poseDirection[2]);

  // Check if the Z-component is negative and dominant
  return poseDirection[2] < 0 && zComponent > xComponent && zComponent > yComponent;
}




module.exports.calculateOrientationCoefficient = calculateOrientationCoefficient;
module.exports.isFacingCamera = isFacingCamera;

module.exports.recognize = async ({ key, test }) => {
  const { URL, KEY, DET_PROB_THRESHOLD, FACE_PLUGINS } = COMPREFACE;
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    timeout: COMPREFACE.TIMEOUT * 1000,
    headers: {
      ...formData.getHeaders(),
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/recognize?face_plugins=${FACE_PLUGINS}`,
    validateStatus() {
      return true;
    },
    params: {
      det_prob_threshold: test ? 0.8 : DET_PROB_THRESHOLD,
    },
    data: formData,
  });
};

module.exports.train = ({ name, key }) => {
  const { URL, KEY } = COMPREFACE;
  const formData = new FormData();
  formData.append('file', fs.createReadStream(key));
  return axios({
    method: 'post',
    timeout: COMPREFACE.TIMEOUT * 1000,
    headers: {
      ...formData.getHeaders(),
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/faces`,
    params: {
      subject: name,
    },
    data: formData,
  });
};

module.exports.remove = ({ name }) => {
  const { URL, KEY } = COMPREFACE;
  return axios({
    method: 'delete',
    timeout: COMPREFACE.TIMEOUT * 1000,
    headers: {
      'x-api-key': KEY,
    },
    url: `${URL}/api/v1/recognition/faces`,
    params: {
      subject: name,
    },
    validateStatus() {
      return true;
    },
  });
};

module.exports.normalize = ({ camera, data }) => {
  if (!data.result) {
    if (data.code === 28) return [];
    throw new Error(data.message);
  }
  const { MATCH, UNKNOWN } = config.detect(camera);
  const normalized = data.result.flatMap((obj) => {
    const [face] = obj.subjects;
    const confidence = face ? parseFloat((face.similarity * 100).toFixed(2)) : 0;
    const { box } = obj;
    const output = {
      name: face && confidence >= UNKNOWN.CONFIDENCE ? face.subject.toLowerCase() : 'unknown',
      confidence,
      match:
        confidence >= MATCH.CONFIDENCE &&
        (box.x_max - box.x_min) * (box.y_max - box.y_min) >= MATCH.MIN_AREA,
      box: {
        top: box.y_min,
        left: box.x_min,
        width: box.x_max - box.x_min,
        height: box.y_max - box.y_min,
      },
    };
    const tdx = (box.x_max + box.x_min) / 2;
    const tdy = (box.y_max + box.y_min) / 2;
    if (obj.age)
      output.age = {
        ...obj.age,
        probability: parseFloat((obj.age.probability * 100).toFixed(2)),
      };
    if (obj.gender)
      output.gender = {
        ...obj.gender,
        probability: parseFloat((obj.gender.probability * 100).toFixed(2)),
      };
    if (obj.mask)
      output.mask = {
        ...obj.mask,
        probability: parseFloat((obj.mask.probability * 100).toFixed(2)),
      };
    if (obj.pose)
      output.pose = {
        ...obj.pose,
        yAxisX: 70 * (-Math.cos(obj.pose.yaw) * Math.sin(obj.pose.roll)) + tdx,
        yAxisY:
          Math.cos(obj.pose.pitch) * Math.cos(obj.pose.roll) -
          Math.sin(obj.pose.pitch) * Math.sin(obj.pose.yaw) * Math.sin(obj.pose.roll) +
          tdy,
        orientation: calculateOrientationCoefficient(obj.pose.pitch, obj.pose.roll, obj.pose.yaw),
      };
    const checks = actions.checks({ MATCH, UNKNOWN, ...output });
    if (checks.length) output.checks = checks;
    return checks !== false ? output : [];
  });
  return normalized;
};
