const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const sizeOf = require('probe-image-size');

const config = require('../constants/config');

module.exports.buffer = async (event, tmp) => {
  const MASK = config.masks(event.camera);

  if (!MASK) return false;

  const coordinates = [];

  const items = Array.isArray(MASK.coordinates) ? MASK.coordinates : [MASK.coordinates];
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

  const { width, height } = await sizeOf(fs.createReadStream(tmp)).catch((/* error */) => ({
    width: 0,
    height: 0,
  }));

  if (event.type === 'mqtt' && width === height) return false;

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
