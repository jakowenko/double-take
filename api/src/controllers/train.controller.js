const fs = require('fs');
const sharp = require('sharp');
const time = require('../util/time.util');
const database = require('../util/db.util');
const train = require('../util/train.util');
const filesystem = require('../util/fs.util');
const { jwt } = require('../util/auth.util');
const { BAD_REQUEST } = require('../constants/http-status');
const { AUTH, STORAGE } = require('../constants');
const { tryParseJSON } = require('../util/validators.util');

module.exports.get = async (req, res) => {
  const token = AUTH ? jwt.sign({ route: 'storage' }) : null;
  const db = database.connect();
  let files = req.query.name
    ? db
        .prepare(
          'SELECT id, name, filename, createdAt FROM file WHERE name = ? AND isActive = 1 ORDER BY name ASC, id DESC'
        )
        .all(req.query.name)
    : db
        .prepare(
          'SELECT id, name, filename, createdAt FROM file WHERE isActive = 1 ORDER BY name ASC, id DESC'
        )
        .all();

  files.forEach((file) => {
    file.results = [];
    const trainings = db.prepare('SELECT * FROM train WHERE fileId = ?').all(file.id);
    trainings.forEach(({ detector, meta, createdAt }) => {
      meta = JSON.parse(meta);
      delete meta.detector;
      file.results.push({
        detector,
        result: tryParseJSON(JSON.stringify(meta)) || null,
        createdAt,
      });
    });
  });

  files = await Promise.all(
    files.map(async (obj) => {
      const { id, name, filename, results, createdAt } = obj;

      const key = `train/${name}/${filename}`;

      const output = {
        id,
        name,
        file: {
          key,
          filename,
        },
        results,
        createdAt,
        token,
      };

      if (fs.existsSync(`${STORAGE.PATH}/${key}`)) {
        const base64 = await sharp(`${STORAGE.PATH}/${key}`)
          .jpeg({ quality: 70 })
          .resize(500)
          .withMetadata()
          .toBuffer();
        output.file.base64 = base64.toString('base64');
      }

      return output;
    })
  );
  res.send(files);
};

module.exports.delete = async (req, res) => {
  const { name } = req.params;
  const ids = req.body;
  const results = await train.remove(name, { ids });

  res.send(results);
};

module.exports.add = async (req, res) => {
  const { name } = req.params;
  const { urls, files: matchFiles } = req.body;

  let files = [];

  if (req.files) {
    await Promise.all(
      req.files.map(async (obj) => {
        const { originalname, buffer } = obj;
        const ext = `.${originalname.split('.').pop()}`;
        const filename = `${originalname.replace(ext, '')}-${time.unix()}${ext}`;
        await filesystem.writer(`${STORAGE.PATH}/train/${name}/${filename}`, buffer);
        files.push({ name, filename });
      })
    );
  } else if (matchFiles) {
    for (let i = 0; i < matchFiles.length; i++) {
      const filename = matchFiles[i];
      filesystem.copy(
        `${STORAGE.PATH}/matches/${filename}`,
        `${STORAGE.PATH}/train/${name}/${filename}`
      );
      files.push({ name, filename });
    }
  } else {
    files = (urls ? await filesystem.saveURLs(urls, `train/${name}`) : []).map((filename) => ({
      filename,
      name,
    }));
  }

  train.add(name, { files });
  res.send({ message: `training queued for ${name}` });
};

module.exports.retrain = async (req, res) => {
  const { name } = req.params;
  await train.remove(name);
  train.add(name);
  res.send({ success: true });
};

module.exports.patch = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const [currentFile] = database.get.filesById([id]);

  if (!currentFile) {
    return res.status(BAD_REQUEST).error('no file found');
  }

  filesystem.move(
    `${STORAGE.PATH}/train/${currentFile.name}/${currentFile.filename}`,
    `${STORAGE.PATH}/train/${name}/${currentFile.filename}`
  );

  train.add(name, { files: [{ name, filename: currentFile.filename }] });

  res.send({ success: true });
};

module.exports.upload = async (req, res) => {
  const { name } = req.params;
  const files = [];

  await Promise.all(
    req.files.map(async (obj) => {
      const { originalname, buffer } = obj;
      const ext = `.${originalname.split('.').pop()}`;
      const filename = `${originalname.replace(ext, '')}-${time.unix()}${ext}`;
      await filesystem.writer(`${STORAGE.PATH}/train/${name}/${filename}`, buffer);
      files.push({ name, filename });
    })
  );

  train.add(name, { files });

  res.send({ success: true });
};

module.exports.status = async (req, res) => res.send(train.status());
