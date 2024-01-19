const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const actions = require('./actions');
const { DETECTORS } = require('../../constants')();
const config = require('../../constants/config');

const { COMPREFACE } = DETECTORS || {};

function calculateOrientationCoefficient(
  pitch,
  roll,
  yaw,
  maxPitch = 30,
  maxRoll = 30,
  maxYaw = 30
) {
  const normalizedPitch = pitch / maxPitch;
  const normalizedRoll = roll / maxRoll;
  const normalizedYaw = yaw / maxYaw;

  const distance = Math.sqrt(
    normalizedPitch * normalizedPitch +
      normalizedRoll * normalizedRoll +
      normalizedYaw * normalizedYaw
  );

  return 1 - Math.min(distance, 1); // Ensures the coefficient stays within 0 to 1 range
}

module.exports.calculateOrientationCoefficient = calculateOrientationCoefficient;

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
