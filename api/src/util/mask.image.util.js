const { promisify } = require('util');
const { createCanvas, loadImage } = require('canvas');
const sizeOf = promisify(require('image-size'));

const { MASKS } = require('../constants');

module.exports = async (event, tmp) => {
  const masks = MASKS
    ? MASKS.filter(({ CAMERA }) => CAMERA === event.camera).map(({ MASK }) => MASK)
    : [];
  const coordinates = [];
  masks.forEach((mask) => {
    coordinates.push([]);
    mask.split(',').forEach((value, i) => {
      if (i % 2 === 0) {
        coordinates[coordinates.length - 1].push({ x: value });
      } else {
        const objectLength = coordinates[coordinates.length - 1].length - 1;
        coordinates[coordinates.length - 1][objectLength].y = value;
      }
    });
  });

  if (!coordinates.length) return false;

  const { width, height } = await sizeOf(tmp);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = await loadImage(tmp);
  ctx.fillStyle = '#000';
  ctx.drawImage(image, 0, 0);
  coordinates.forEach((coordinate) => {
    ctx.beginPath();
    coordinate.forEach(({ x, y }, i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  });

  return canvas.toBuffer('image/jpeg');
};
