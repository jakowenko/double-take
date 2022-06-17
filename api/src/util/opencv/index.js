const { Canvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { OPENCV } = require('../../constants')();

let isLoaded = false;

const installDOM = () => {
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
};

/**
 * Loads opencv.js.
 *
 * Installs HTML Canvas emulation to support `cv.imread()` and `cv.imshow`
 *
 * Mounts given local folder `localRootDir` in emscripten filesystem folder `rootDir`. By default it will mount the local current directory in emscripten `/work` directory. This means that `/work/foo.txt` will be resolved to the local file `./foo.txt`
 * @param {string} rootDir The directory in emscripten filesystem in which the local filesystem will be mount.
 * @param {string} localRootDir The local directory to mount in emscripten filesystem.
 * @returns {Promise} resolved when the library is ready to use.
 */
module.exports.load = (rootDir = '/work', localRootDir = process.cwd()) => {
  if (global.Module && global.Module.onRuntimeInitialized && global.cv && global.cv.imread) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    installDOM();
    global.Module = {
      onRuntimeInitialized() {
        // We change emscripten current work directory to 'rootDir' so relative paths are resolved
        // relative to the current local folder, as expected
        global.cv.FS.chdir(rootDir);
        isLoaded = true;
        console.verbose('opencv loaded');
        resolve();
      },
      preRun() {
        // preRun() is another callback like onRuntimeInitialized() but is called just before the
        // library code runs. Here we mount a local folder in emscripten filesystem and we want to
        // do this before the library is executed so the filesystem is accessible from the start
        const { FS } = global.Module;
        // create rootDir if it doesn't exists
        if (!FS.analyzePath(rootDir).exists) {
          FS.mkdir(rootDir);
        }
        // FS.mount() is similar to Linux/POSIX mount operation. It basically mounts an external
        // filesystem with given format, in given current filesystem directory.
        FS.mount(global.Module.FS.filesystems.NODEFS, { root: localRootDir }, rootDir);
      },
    };
    global.cv = require('./lib');
  });
};

module.exports.faceCount = async (path) => {
  try {
    if (!isLoaded) {
      console.warn('opencv not loaded yet');
      return;
    }
    const { cv } = global;
    const image = await loadImage(path);
    const src = cv.imread(image);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    const faces = new cv.RectVector();
    const faceCascade = new cv.CascadeClassifier();
    faceCascade.load('./api/src/util/opencv/haarcascade_frontalface_default.xml');
    faceCascade.detectMultiScale(
      gray,
      faces,
      OPENCV.SCALE_FACTOR,
      OPENCV.MIN_NEIGHBORS,
      0,
      new cv.Size(OPENCV.MIN_SIZE_WIDTH, OPENCV.MIN_SIZE_HEIGHT)
    );
    const faceCount = faces.size();
    src.delete();
    gray.delete();
    faceCascade.delete();
    faces.delete();
    return faceCount;
  } catch (error) {
    console.error(`opencv error: `, error.message || error);
    return 1;
  }
};

module.exports.shouldLoad = () => OPENCV || false;
