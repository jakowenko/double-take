const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const writer = require('../util/writer.util');

const {
  FRIGATE_URL,
  COMPREFACE_URL,
  FACEBOX_URL,
  COMPREFACE_API_KEY,
  STORAGE_PATH,
} = require('../constants');

const trainingData = async () => {
  const tmpImages = [];
  let tmpFolders = await fs.promises.readdir(`${STORAGE_PATH}/names`);
  tmpFolders = tmpFolders.filter((folder) => folder.toUpperCase() !== '.DS_STORE');
  for (const folder of tmpFolders) {
    const files = await fs.promises.readdir(`${STORAGE_PATH}/names/${folder}`);
    const images = files.filter(
      (file) => file.toLowerCase().includes('.jpg') || file.toLowerCase().includes('.png')
    );
    images.forEach((image) => {
      tmpImages.push(image);
    });
  }

  return { names: tmpFolders, files: tmpImages };
};

const train = async ({ name, file, detector }) => {
  const formData = new FormData();

  if (detector === 'compreface') {
    formData.append('file', fs.createReadStream(file));
    const request = await axios({
      method: 'post',
      headers: {
        ...formData.getHeaders(),
        'x-api-key': COMPREFACE_API_KEY,
      },
      url: `${COMPREFACE_URL}/api/v1/faces`,
      params: {
        subject: name,
      },
      validateStatus() {
        // if no face is found don't break loop HTTP 400
        return true;
      },
      data: formData,
    });
    return request.data;
  }

  if (detector === 'facebox') {
    formData.append('file', fs.createReadStream(file));
    const request = await axios({
      method: 'post',
      headers: {
        ...formData.getHeaders(),
      },
      url: `${FACEBOX_URL}/facebox/teach`,
      params: {
        name,
        id: path.basename(file),
      },
      validateStatus() {
        return true;
      },
      data: formData,
    });
    return request.data;
  }
};

const remove = async ({ names, detector, files }) => {
  if (detector === 'compreface') {
    const output = [];
    for (let i = 0; i < names.length; i++) {
      const request = await axios({
        method: 'delete',
        headers: {
          'x-api-key': COMPREFACE_API_KEY,
        },
        url: `${COMPREFACE_URL}/api/v1/faces`,
        params: {
          subject: names[i],
        },
      });
      output.push(request.data);
    }
    return output;
  }
  if (detector === 'facebox') {
    const output = [];
    for (let i = 0; i < files.length; i++) {
      console.log(files[i]);
      const request = await axios({
        method: 'delete',
        url: `${FACEBOX_URL}/facebox/teach/${files[i]}`,
        validateStatus() {
          return true;
        },
      });
      console.log(request.data);
      output.push(request.data);
    }
    return output;
  }
};

module.exports.delete = async (req, res) => {
  const { names, files } = await trainingData();
  const promises = [];

  if (FACEBOX_URL) promises.push(remove({ detector: 'facebox', names, files }));
  if (COMPREFACE_URL) promises.push(remove({ detector: 'compreface', names }));
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
    const output = [];
    for (let i = 0; i < count; i++) {
      const cameraStream = await axios({
        method: 'get',
        url: `${FRIGATE_URL}/api/${camera}/latest.jpg`,
        responseType: 'stream',
      });
      const file = `${STORAGE_PATH}/names/${name}/frigate-events-${uuidv4()}.jpg`;
      await writer(cameraStream.data, file);

      const promises = [];
      if (FACEBOX_URL) promises.push(train({ name, file, detector: 'facebox' }));
      if (COMPREFACE_URL) promises.push(train({ name, file, detector: 'compreface' }));
      const results = await Promise.all(promises);
      output.push(results);
    }

    res.json({
      camera,
      name,
      results: output,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: error.message });
  }
};

// const init = async () => {
//   let folders = await fs.promises.readdir('./faces');
//   folders = folders.filter((folder) => folder.toUpperCase() !== '.DS_STORE');
//   for (const folder of folders) {
//     const files = await fs.promises.readdir(`./faces/${folder}`);
//     const images = files.filter(
//       (file) => file.toLowerCase().includes('.jpg') || file.toLowerCase().includes('.png')
//     );

//     for (const image of images) {
//       await train({ subject: folder, image });
//     }
//   }
// };
