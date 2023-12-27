const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const actions = require('./actions');
const { DETECTORS } = require('../../constants')();
const config = require('../../constants/config');

const { AISERVER } = DETECTORS || {};

const recognize = async ({ key }) => {
  const { URL } = AISERVER;
  const formData = new FormData();
  try {
    formData.append('image', fs.createReadStream(key));
  } catch (error) {
    throw new Error(`An error occurred while reading the file: ${error.message}`);
  }
  const reqconfig = {
    method: 'post',
    timeout: AISERVER.TIMEOUT * 1000,
    headers: { ...formData.getHeaders() },
    url: `${URL}/v1/vision/face/recognize`,
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  };
  try {
    return await axios(reqconfig);
  } catch (error) {
    console.error('Recognition request failed:', error);
    throw error;
  }
};

const train = ({ name, key }) => {
  const { URL } = AISERVER;
  const formData = new FormData();
  formData.append('image', fs.createReadStream(key));
  formData.append('userid', name);

  return axios({
    method: 'post',
    timeout: AISERVER.TIMEOUT * 1000,
    headers: { ...formData.getHeaders() },
    url: `${URL}/v1/vision/face/register`,
    data: formData,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  }).catch((error) => {
    // Handle network errors or other axios-related issues
    console.error('Training failed:', error);
    throw error;
  });
};

const remove = ({ name }) => {
  const { URL } = AISERVER;
  const formData = new FormData();
  formData.append('userid', name);

  return axios({
    method: 'post',
    timeout: AISERVER.TIMEOUT * 1000,
    url: `${URL}/v1/vision/face/delete`,
    headers: formData.getHeaders(),
    data: formData,
  }).catch((error) => {
    console.error('Error during removal:', error);
    throw error; // Re-throw the error after logging or perform error-specific actions
  });
};

const normalize = ({ camera, data }) => {
  if (!data || !data.success) {
    // compare with CoderProjectAI sources
    // https://github.com/codeproject/CodeProject.AI-Server/blob/main/src/modules/FaceProcessing/intelligencelayer/face.py#L528
    if (data?.code === 500 && data?.error === 'No face found in image') {
      console.log('ai.server found no face in image');
      return [];
    }
    console.warn('unexpected ai.server data', data);
    return [];
  }

  // Ensure config.detect(camera) returns a valid object with MATCH and UNKNOWN properties
  const detectionConfig = config.detect(camera) || {};
  const { MATCH, UNKNOWN } = detectionConfig;
  if (!Array.isArray(data.predictions)) {
    console.warn('unexpected ai.server predictions data', data.predictions);
    return [];
  }
  const normalized = data.predictions.reduce((acc, obj) => {
    if (!obj) return acc; // skip if obj is null or undefined

    const confidence = parseFloat((obj.confidence * 100).toFixed(2));
    const userid = obj.userid || obj.plate || 'unknown';

    const output = {
      name: confidence >= UNKNOWN.CONFIDENCE ? userid.toLowerCase() : 'unknown',
      confidence,
      match:
        confidence >= MATCH.CONFIDENCE &&
        (obj.x_max - obj.x_min) * (obj.y_max - obj.y_min) >= MATCH.MIN_AREA,
      box: {
        top: obj.y_min,
        left: obj.x_min,
        width: obj.x_max - obj.x_min,
        height: obj.y_max - obj.y_min,
      },
    };
    let checks;
    try {
      checks = actions.checks({ ...detectionConfig, ...output });
    } catch (e) {
      console.error('Error performing checks on output', e);
      return acc;
    }

    if (Array.isArray(checks) && checks.length > 0) {
      output.checks = checks;
    }

    acc.push(output);

    return acc;
  }, []);

  return normalized;
};
module.exports = { recognize, train, remove, normalize };
