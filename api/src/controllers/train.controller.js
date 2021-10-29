const fs = require('fs');
const sizeOf = require('probe-image-size');
const { getOrientation } = require('get-orientation');
const time = require('../util/time.util');
const database = require('../util/db.util');
const train = require('../util/train.util');
const filesystem = require('../util/fs.util');
const { jwt } = require('../util/auth.util');
const { BAD_REQUEST } = require('../constants/http-status');
const { AUTH, STORAGE, UI } = require('../constants')();
const { tryParseJSON } = require('../util/validators.util');

module.exports.get = async (req, res) => {
  const limit = UI.PAGINATION.LIMIT;
  const { page } = req.query;
  const token = AUTH ? jwt.sign({ route: 'storage' }) : null;
  const db = database.connect();
  let files = req.query.name
    ? db
        .prepare(
          'SELECT id, name, filename, createdAt FROM file WHERE name = ? AND isActive = 1 ORDER BY id DESC LIMIT ?,?'
        )
        .bind(req.query.name, limit * (page - 1), limit)
        .all()
    : db
        .prepare(
          'SELECT id, name, filename, createdAt FROM file WHERE isActive = 1 ORDER BY  id DESC LIMIT ?,?'
        )
        .bind(limit * (page - 1), limit)
        .all();

  const [total] = req.query.name
    ? db
        .prepare('SELECT COUNT(*) count FROM file WHERE name = ? AND isActive = 1')
        .bind(req.query.name)
        .all()
    : db.prepare('SELECT COUNT(*) count FROM file WHERE isActive = 1').all();

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
      const { width, height } = await sizeOf(
        fs.createReadStream(`${STORAGE.MEDIA.PATH}/${key}`)
      ).catch((/* error */) => ({ width: 0, height: 0 }));
      const orientation = await getOrientation(
        fs.readFileSync(`${STORAGE.MEDIA.PATH}/${key}`)
      ).catch((/* error */) => 0);

      const output = {
        id,
        name,
        file: {
          key,
          filename,
          width: orientation === 6 ? height : width,
          height: orientation === 6 ? width : height,
        },
        results,
        createdAt,
        token,
      };

      return output;
    })
  );
  res.send({ limit, total: total.count, files });
};

module.exports.delete = async (req, res) => {
  const { name } = req.params;
  const ids = req.body;
  const results = await train.remove(name, { ids });

  res.send(results);
};

module.exports.add = async (req, res) => {
  const { name } = req.params;
  const { urls, ids } = req.body;

  let files = [];

  if (req.files) {
    await Promise.all(
      req.files.map(async (obj) => {
        const { originalname, buffer, mimetype } = obj;
        if (!['image/jpeg', 'image/png'].includes(mimetype)) {
          console.warn(`training incorrect mime type: ${mimetype}`);
          return;
        }
        const ext = `.${originalname.split('.').pop()}`;
        const filename = `${originalname.replace(ext, '')}-${time.unix()}${ext}`;
        await filesystem.writer(`${STORAGE.MEDIA.PATH}/train/${name}/${filename}`, buffer);
        files.push({ name, filename });
      })
    );
  } else if (ids) {
    ids.forEach((id) => {
      const db = database.connect();
      const [match] = db.prepare('SELECT filename FROM match WHERE id = ?').bind(id).all();
      filesystem.copy(
        `${STORAGE.MEDIA.PATH}/matches/${match.filename}`,
        `${STORAGE.MEDIA.PATH}/train/${name}/${match.filename}`
      );
      files.push({ name, filename: match.filename });
    });
  } else {
    files = (urls ? await filesystem.saveURLs(urls, `train/${name}`) : []).map((filename) => ({
      filename,
      name,
    }));
  }

  if (files.length) train.add(name, { files });
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
    `${STORAGE.MEDIA.PATH}/train/${currentFile.name}/${currentFile.filename}`,
    `${STORAGE.MEDIA.PATH}/train/${name}/${currentFile.filename}`
  );

  train.add(name, { files: [{ name, filename: currentFile.filename }] });

  res.send({ success: true });
};

module.exports.status = async (req, res) => res.send(train.status());
