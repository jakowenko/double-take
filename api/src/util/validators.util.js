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
