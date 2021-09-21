const detectors = require('.');

/**
 * @param detector {string} Name of the detector to get
 */
module.exports.get = (detector) => {
  try {
    return detectors[detector];
  } catch (error) {
    error.message = `${detector} factory error: ${error.message}`;
    console.error(error);
  }
};
