const fs = require('fs');
const archiver = require('archiver');
const { STORAGE } = require('../constants')();

const zip = (path) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path);
    const archive = archiver('zip');
    output.on('close', () => resolve());
    archive.on('warning', (error) => reject(error));
    archive.on('error', (error) => reject(error));
    archive.pipe(output);
    archive.directory(STORAGE.PATH, false);
    archive.finalize();
  });
};

module.exports.zip = async (req, res) => {
  const path = `${STORAGE.TMP.PATH}/export.zip`;
  await zip(path);
  res.download(path, async (error) => {
    if (error) return res.error(error);
    await fs.promises.unlink(path);
  });
};
