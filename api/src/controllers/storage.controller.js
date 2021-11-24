const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const sizeOf = require('probe-image-size');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { jwt } = require('../util/auth.util');
const filesystem = require('../util/fs.util');
const database = require('../util/db.util');
const { tryParseJSON } = require('../util/validators.util');
const { BAD_REQUEST } = require('../constants/http-status');
const { AUTH, SERVER, UI } = require('../constants')();
const { PATH } = require('../constants')().STORAGE.MEDIA;
const { QUALITY, WIDTH } = require('../constants')().UI.THUMBNAILS;

module.exports.matches = async (req, res) => {
  const { box: showBox } = req.query;
  const { filename } = req.params;
  const source = `${PATH}/matches/${filename}`;

  if (!fs.existsSync(source)) {
    return res.status(BAD_REQUEST).error(`${source} does not exist`);
  }

  if (showBox === 'true') {
    const db = database.connect();
    const match = db.prepare('SELECT * FROM match WHERE filename = ?').bind(filename).get();

    if (!match || !tryParseJSON(match.response)) {
      const buffer = fs.readFileSync(source);
      res.set('Content-Type', 'image/jpeg');
      return res.end(buffer);
    }
    const response = JSON.parse(match.response);

    const fontSize = 18;
    const textPadding = 10;
    const lineWidth = 4;

    const { width, height } = await sizeOf(fs.createReadStream(source)).catch((/* error */) => ({
      width: 0,
      height: 0,
    }));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const image = await loadImage(source);
    registerFont(`${__dirname}/../static/fonts/Roboto/Roboto-Medium.ttf`, {
      family: 'Roboto-Medium',
    });
    ctx.drawImage(image, 0, 0);
    ctx.font = `${fontSize}px Roboto-Medium`;
    ctx.textBaseline = 'top';

    const textHeight = fontSize + textPadding;

    response.forEach((obj) => {
      const { detector } = obj;
      obj.results.forEach(({ name, confidence, box }) => {
        const text = `${name} - ${confidence}%`;
        const textWidth = ctx.measureText(text).width + textPadding;

        let fillStyle = '#78cc86';
        if (detector === 'compreface') fillStyle = '#095fd7';
        if (detector === 'deepstack') fillStyle = '#d66b11';
        if (detector === 'facebox') fillStyle = '#5f39a4';

        ctx.fillStyle = fillStyle;
        if (confidence > 0) {
          ctx.fillRect(box.left - lineWidth / 2, box.top - textHeight, textWidth, textHeight);
          ctx.fillStyle = '#fff';
          ctx.fillText(
            text,
            box.left + textPadding / 2 - lineWidth / 2,
            box.top - textHeight + textPadding / 2
          );
        }

        ctx.strokeStyle = fillStyle;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        ctx.rect(box.left, box.top, box.width, box.height);
        ctx.stroke();
      });
    });

    const buffer = canvas.toBuffer('image/jpeg');
    res.set('Content-Type', 'image/jpeg');
    return res.end(buffer);
  }

  const buffer =
    req.query.thumb === ''
      ? await sharp(source, { failOnError: false })
          .jpeg({ quality: QUALITY })
          .resize(WIDTH)
          .withMetadata()
          .toBuffer()
      : fs.readFileSync(source);
  res.set('Content-Type', 'image/jpeg');
  return res.end(buffer);
};

module.exports.train = async (req, res) => {
  const { name, filename } = req.params;
  const source = `${PATH}/train/${name}/${filename}`;

  if (!fs.existsSync(source)) return res.status(BAD_REQUEST).error(`${source} does not exist`);

  const buffer =
    req.query.thumb === ''
      ? await sharp(source).jpeg({ quality: QUALITY }).resize(WIDTH).withMetadata().toBuffer()
      : fs.readFileSync(source);
  res.set('Content-Type', 'image/jpeg');

  res.set('Content-Type', 'image/jpeg');
  return res.end(buffer);
};

module.exports.delete = async (req, res) => {
  const { files } = req.body;
  if (files && files.length) {
    const db = database.connect();
    db.prepare(
      `DELETE FROM file WHERE id IN (${files.map((obj) => `'${obj.id}'`).join(',')})`
    ).run();
    db.prepare(
      `DELETE FROM train WHERE fileId IN (${files.map((obj) => `'${obj.id}'`).join(',')})`
    ).run();
    files.forEach((obj) => {
      filesystem.delete(`${PATH}/${obj.key}`);
    });
  }
  res.send({ success: true });
};

module.exports.latest = async (req, res) => {
  const { filename } = req.params;
  const { box } = req.query;
  const name = filename.replace('.jpg', '');
  const source = `${PATH}/latest/${filename}`;

  if (!fs.existsSync(source)) return res.status(BAD_REQUEST).error(`${source} does not exist`);

  const db = database.connect();
  const [nameMatch] = db
    .prepare(
      `SELECT t.id, filename, value FROM (
          SELECT match.id, filename, json_extract(value, '$.results') results
          FROM match, json_each( match.response)
          ) t, json_each(t.results)
        WHERE json_extract(value, '$.name') IN (${database.params([name])})
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 1`
    )
    .all(name);

  const [cameraMatch] = db
    .prepare(
      `SELECT t.id, t.event, filename, value FROM (
          SELECT match.id, event, filename, json_extract(value, '$.results') results
          FROM match, json_each( match.response)
          ) t, json_each(t.results)
        WHERE json_extract(t.event, '$.camera') IN (${database.params([name])})
        GROUP BY t.id
        ORDER BY t.id DESC
        LIMIT 1`
    )
    .all(name);

  if ((!nameMatch && !cameraMatch) || box !== 'true') {
    res.set('Content-Type', 'image/jpeg');
    return res.end(fs.readFileSync(source));
  }

  const { filename: originalFilename } = nameMatch || cameraMatch;

  const request = await axios({
    method: 'get',
    url: `http://0.0.0.0:${SERVER.PORT}${UI.PATH}/api/storage/matches/${originalFilename}?box=true`,
    headers: AUTH ? { authorization: jwt.sign({ route: 'storage' }) } : null,
    responseType: 'arraybuffer',
  });

  res.set('Content-Type', 'image/jpeg');
  res.end(request.data);
};
