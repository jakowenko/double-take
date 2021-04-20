const fs = require('fs');
const { promisify } = require('util');
const sizeOf = promisify(require('image-size'));
const { ExifTool } = require('exiftool-vendored');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { tryParseJSON } = require('../util/validators.util');
const { respond, HTTPError } = require('../util/respond.util');
const { BAD_REQUEST } = require('../constants/http-status');

const { STORAGE_PATH } = require('../constants');

module.exports.matches = async (req, res) => {
  try {
    const { name, filename } = req.params;
    const source = `${STORAGE_PATH}/matches/${name}/${filename}`;

    if (!fs.existsSync(source)) {
      throw HTTPError(BAD_REQUEST, `${source} does not exist`);
    }

    if (req.query.box === 'true') {
      const exiftool = new ExifTool({ taskTimeoutMillis: 1000 });
      const { UserComment: exif } = await exiftool.read(source);
      exiftool.end();

      const match = tryParseJSON(exif);
      if (!match) {
        const buffer = fs.readFileSync(source);
        res.set('Content-Type', 'image/jpeg');
        return res.end(buffer);
      }
      const { box } = match;

      const text = `${match.name} - ${match.confidence}%`;
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
      ctx.fillStyle = '#4caf50';
      const textWidth = ctx.measureText(text).width + textPadding;
      const textHeight = fontSize + textPadding;
      ctx.fillRect(box.left - lineWidth / 2, box.top - textHeight, textWidth, textHeight);
      ctx.fillStyle = '#fff';
      ctx.fillText(
        text,
        box.left + textPadding / 2 - lineWidth / 2,
        box.top - textHeight + textPadding / 2
      );

      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      ctx.rect(box.left, box.top, box.width, box.height);
      ctx.stroke();

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
