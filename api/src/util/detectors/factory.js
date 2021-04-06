const logger = require('../logger.util');

const detectors = require('.');

/**
 * @param detector {string} Name of the detector to get
 */
module.exports.get = (detector) => {
  try {
    return detectors[detector];
  } catch (error) {
    logger.log(`${detector} factory error: ${error.message}`);
  }
};
