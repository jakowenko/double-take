const { promisify } = require('util');
const { createCanvas, loadImage } = require('canvas');
const sizeOf = promisify(require('image-size'));

const MASKS = require('../constants/config').masks();

module.exports = async (event, tmp) => {
  const MASK = MASKS
    ? MASKS.filter(({ camera }) => camera === event.camera).map(({ mask, visible, size }) => ({
        mask,
        visible,
        size,
      }))[0]
    : null;

  if (!MASK) return false;

  const coordinates = [];

  const items = Array.isArray(MASK.mask) ? MASK.mask : [MASK.mask];
  items.forEach((item) => {
    coordinates.push([]);
    item.split(',').forEach((value, i) => {
      if (i % 2 === 0) {
        coordinates[coordinates.length - 1].push({ x: value });
      } else {
        const objectLength = coordinates[coordinates.length - 1].length - 1;
        coordinates[coordinates.length - 1][objectLength].y = value;
        coordinates[coordinates.length - 1][objectLength].size = MASK.size;
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
    coordinate.forEach(({ x, y, size }) => {
      const [maskWidth] = size ? size.replace(/\s+/g, '').toLowerCase().split('x') : [null];
      const ratio = maskWidth ? width / maskWidth : 1;

      ctx.lineTo(x * ratio, y * ratio);
    });
    ctx.closePath();
    ctx.fill();
  });

  return { visible: MASK.visible, buffer: canvas.toBuffer('image/jpeg') };
};
