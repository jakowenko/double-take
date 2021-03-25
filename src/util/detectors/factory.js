const logger = require('../logger.util');

const {
    compreface,
    deepstack,
    facebox
} = require('./all')

/**
 * @param detector {string} Name of the detector to get
 */
module.exports.get = (detector) => {
    logger.log(`trying to use detector '${detector}'`)
    switch (detector) {
        case 'compreface':
            logger.log(`using detector 'compreface'`)
            return compreface;
        case 'deepstack':
            logger.log(`using detector 'deepstack'`)
            return deepstack;
        case 'facebox':
            logger.log(`using detector 'facebox'`)
            return facebox;
    }
}
