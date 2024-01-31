const path = require('path');

module.exports.contains = (a, b) => {
  return !(
    b.left < a.left ||
    b.top < a.top ||
    b.left + b.width > a.left + a.width ||
    b.top + b.height > a.top + a.height
  );
};

module.exports.oxfordComma = (array) =>
  array.length > 2
    ? array
        .slice(0, array.length - 1)
        .concat(`and ${array.slice(-1)}`)
        .join(', ')
    : array.join(' and ');

/**
 * Retrieves the frontend application path.
 *
 * This function determines the frontend path based on either an environment variable or a CLI argument.
 * It first checks for the 'FRONTEND' environment variable. If not found, it looks for a '--frontend-path'
 * argument in the command-line invocation. If neither is specified, it defaults to a 'frontend' directory
 * relative to the current working directory.
 *
 * @returns {string} The absolute path to the frontend directory with a trailing slash.
 */
module.exports.getFrontendPath = () => {
  const envPath = process.env.FRONTEND;
  const cliArgIndex = process.argv.findIndex((arg) => arg === '--frontend-path');
  // console.table(process.argv);
  if (envPath) {
    return `${envPath}/`;
  }
  if (cliArgIndex > -1 && process.argv[cliArgIndex + 1]) {
    // Return the next argument after the '--frontend-path', assuming it's the path value.
    return `${process.argv[cliArgIndex + 1]}/`;
  }

  return `${path.join(process.cwd(), 'frontend')}/`; // Default value if no env or cli arg is provided.
};
