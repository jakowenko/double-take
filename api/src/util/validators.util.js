const axios = require('axios');

module.exports.tryParseJSON = (json) => {
  try {
    const o = JSON.parse(json);
    if (o && typeof o === 'object') {
      return o;
    }
  } catch (e) {
    return false;
  }
  return false;
};

module.exports.doesUrlResolve = async (url) => {
  try {
    const instance = axios.create({
      timeout: 1000,
    });
    const data = await instance({
      method: 'get',
      url,
    });
    return data;
  } catch (error) {
    error.message = `url resolve error: ${error.message}`;
    console.error(error);
    return false;
  }
};
