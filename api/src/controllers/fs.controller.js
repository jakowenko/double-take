const { promisify } = require('util');
const fs = require('fs');
const sharp = require('sharp');
const { ExifTool } = require('exiftool-vendored');
const sizeOf = promisify(require('image-size'));
const time = require('../util/time.util');
const filesystem = require('../util/fs.util');
const { respond, HTTPSuccess } = require('../util/respond.util');
const { OK } = require('../constants/http-status');
const { STORAGE_PATH } = require('../constants');
const { tryParseJSON } = require('../util/validators.util');

module.exports.folders = () => {
  return {
    list: async (req, res) => {
      try {
        const folders = await filesystem.folders().train();
        respond(HTTPSuccess(OK, folders), res);
      } catch (error) {
        respond(error, res);
      }
    },
    create: (req, res) => {
      try {
        const { name } = req.params;
        if (!fs.existsSync(`${STORAGE_PATH}/train/${name}`)) {
          fs.mkdirSync(`${STORAGE_PATH}/train/${name}`);
        }
        respond(HTTPSuccess(OK, { sucess: true }), res);
      } catch (error) {
        respond(error, res);
      }
    },
  };
};

module.exports.files = () => {
  return {
    list: async (req, res) => {
      try {
        let files = await filesystem.files().matches();
        const exiftool = new ExifTool({ taskTimeoutMillis: 1000 });
        files = await Promise.all(
          files.map(async (file) => {
            const { UserComment: exif } = await exiftool.read(`${STORAGE_PATH}/${file.key}`);
            const data = tryParseJSON(exif);
            const { box, confidence, duration, detector } =
              data !== false
                ? data
                : { confidence: null, duration: null, box: { width: null, height: null } };
            const { birthtime: createdAt } = fs.statSync(`${STORAGE_PATH}/${file.key}`);
            const base64 = await sharp(`${STORAGE_PATH}/${file.key}`).resize(500).toBuffer();

            const { width: ogWidth, height: ogHeight } = await sizeOf(
              `${STORAGE_PATH}/${file.key}`
            );

            const bbox = {
              top: box.width ? `${(box.top / ogHeight) * 100}%` : 0,
              width: box.width ? `${(box.width / ogWidth) * 100}%` : 0,
              height: box.width ? `${(box.height / ogHeight) * 100}%` : 0,
              left: box.width ? `${(box.left / ogWidth) * 100}%` : 0,
            };

            return {
              ...file,
              dimensions: box.width ? `${box.width}x${box.height}` : null,
              bbox: box.width
                ? `width: ${bbox.width}; height: ${bbox.height}; top: ${bbox.top}; left: ${bbox.left};`
                : null,
              confidence: confidence ? `${confidence}%` : null,
              duration: duration ? `${duration} sec` : null,
              detector: detector || null,
              ago: time.ago(createdAt),
              match: data.match,
              type: data.type,
              base64: base64.toString('base64'),
            };
          })
        );
        exiftool.end();

        respond(HTTPSuccess(OK, files), res);
      } catch (error) {
        respond(error, res);
      }
    },
    move: async (req, res) => {
      try {
        const { folder, files } = req.body;
        files.forEach((file) => {
          filesystem.move(
            `${STORAGE_PATH}/${file.key}`,
            `${STORAGE_PATH}/train/${folder}/${file.filename}`
          );
        });
        respond(HTTPSuccess(OK, { sucess: true }), res);
      } catch (error) {
        respond(error, res);
      }
    },
    delete: (req, res) => {
      try {
        const files = req.body;
        files.forEach((file) => {
          filesystem.delete(`${STORAGE_PATH}/${file.key}`);
        });
        respond(HTTPSuccess(OK, { sucess: true }), res);
      } catch (error) {
        respond(error, res);
      }
    },
  };
};
