const fs = require('fs');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const { createCanvas, loadImage, registerFont } = require('canvas');
const database = require('../util/db.util');
// const { ExifTool } = require('exiftool-vendored');
const { tryParseJSON } = require('../util/validators.util');
const { respond, HTTPError } = require('../util/respond.util');
const { BAD_REQUEST } = require('../constants/http-status');

const { STORAGE_PATH } = require('../constants');

module.exports.matches = async (req, res) => {
  try {
    const { box: showBox } = req.query;
    const { filename } = req.params;
    const source = `${STORAGE_PATH}/matches/${filename}`;

    if (!fs.existsSync(source)) {
      throw HTTPError(BAD_REQUEST, `${source} does not exist`);
    }

    if (showBox === 'true') {
      // const exiftool = new ExifTool({ taskTimeoutMillis: 1000 });
      // const { UserComment: exif } = await exiftool.read(source);
      // exiftool.end();

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

      const { width, height } = await sizeOf(source);
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
          ctx.fillRect(box.left - lineWidth / 2, box.top - textHeight, textWidth, textHeight);
          ctx.fillStyle = '#fff';
          ctx.fillText(
            text,
            box.left + textPadding / 2 - lineWidth / 2,
            box.top - textHeight + textPadding / 2
          );

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

    const buffer = fs.readFileSync(source);
    res.set('Content-Type', 'image/jpeg');
    return res.end(buffer);
  } catch (error) {
    respond(error, res);
  }
};
