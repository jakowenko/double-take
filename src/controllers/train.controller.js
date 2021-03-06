const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { writer } = require('../util/fs.util');
const sleep = require('../util/sleep.util');
const train = require('../util/train.util');

const { FRIGATE_URL, STORAGE_PATH, DETECTORS } = require('../constants');

module.exports.delete = async (req, res) => {
  const { names, files } = await train.data();
  const promises = [];

  DETECTORS.forEach((detector) => {
    promises.push(train.remove({ detector, names, files }));
  });
  const results = await Promise.all(promises);

  res.json(results);
};

module.exports.camera = async (req, res) => {
  const { name, camera } = req.params;
  const { count } = req.query.count ? req.query : { count: 5 };

  if (!fs.existsSync(`${STORAGE_PATH}/names/${name}`)) {
    fs.mkdirSync(`${STORAGE_PATH}/names/${name}`);
  }

  try {
    const showHTML = req.query.html === '';
    const files = [];
    for (let i = 0; i < count; i++) {
      const cameraStream = await axios({
        method: 'get',
        url: `${FRIGATE_URL}/api/${camera}/latest.jpg`,
        responseType: 'stream',
      });
      const file = `${STORAGE_PATH}/names/${name}/frigate-events-${uuidv4()}.jpg`;
      await writer(cameraStream.data, file);
      files.push({ name, file });
      await sleep(1);
    }

    const outputs = await train.queue(files);

    let html = `
      <html>
      <head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
          body { background: #eaeaea; }
          .wrapper {
            width: 95%;
            max-width: 1000px;
            margin: auto;
            font-size: 12px;
            margin-top: 15px;
          }
          .wrapper:first-child {
            margin-top: 0;
          }
          .wrapper > img {
            width: 100%;
          }
          .detector {
            background: #fff;
            padding: 10px;
          }
        </style>
      </head>
      <body>`;

    outputs.forEach((attempt) => {
      const bitmap = fs.readFileSync(attempt.file);
      const buffer = Buffer.from(bitmap).toString('base64');
      html += `<div class='wrapper'>`;
      html += `<img src='data:image/jpg;base64,${buffer}'>`;

      const notFound = [];
      DETECTORS.forEach((detector) => {
        const { success, code } = attempt[detector];
        if (success === false || code === 28) notFound.push(true);
        html += `<div class='detector'>
                    <strong>${detector}</strong>
                    <br>
                    ${JSON.stringify(attempt[detector])}
                  </div>
                `;
      });
      html += `</div>`;

      if (notFound.length === DETECTORS.length && fs.existsSync(attempt.file)) {
        fs.unlinkSync(attempt.file);
      }
    });

    html += `</body></html>`;

    if (showHTML) {
      return res.send(html);
    }

    res.json({
      camera,
      name,
      results: outputs,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports.init = async (req, res) => {
  const { files } = await train.data();
  const outputs = await train.queue(files);
  res.json(outputs);
};
