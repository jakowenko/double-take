const fs = require('fs');

module.exports = async (stream, file) => {
  return new Promise((resolve) => {
    const out = fs.createWriteStream(file);
    stream.pipe(out);
    out.on('finish', () => {
      resolve();
    });
  });
};
