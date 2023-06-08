package face

// #cgo CXXFLAGS: -std=c++1z -Wall -O3 -DNDEBUG -march=native
// #cgo LDFLAGS: -ldlib -lblas -lcblas -llapack -ljpeg
// #include <stdlib.h>
// #include <stdint.h>
// #include "facerec.h"
import "C"
import (
	"image"
	"io/ioutil"
	"math"
	"os"
	"unsafe"
)

const (
	rectLen  = 4
	descrLen = 128
	shapeLen = 2

	// We get first 2^20 elements of array of shapes
	// (68 shapes per face in case of shape_predictor_68_face_landmarks.dat.bz2).
	// 68*shapeLen is bigger than rectLen and descrLen.
	maxElements  = 1 << 20
	maxFaceLimit = maxElements / (68 * shapeLen)
)

// A Recognizer creates face descriptors for provided images and
// classifies them into categories.
type Recognizer struct {
	ptr *C.facerec
}

// Face holds coordinates and descriptor of the human face.
type Face struct {
	Rectangle  image.Rectangle
	Descriptor Descriptor
	Shapes     []image.Point
}

// Descriptor holds 128-dimensional feature vector.
type Descriptor [128]float32

func SquaredEuclideanDistance(d1 Descriptor, d2 Descriptor) (sum float64) {
	for i := range d1 {
		sum = sum + math.Pow(float64(d2[i]-d1[i]), 2)
	}

	return sum
}

// New creates new face with the provided parameters.
func New(r image.Rectangle, d Descriptor) Face {
	return Face{r, d, []image.Point{}}
}

func NewWithShape(r image.Rectangle, s []image.Point, d Descriptor) Face {
	return Face{r, d, s}
}

// NewRecognizer returns a new recognizer interface. modelDir points to
// directory with shape_predictor_5_face_landmarks.dat and
// dlib_face_recognition_resnet_model_v1.dat files.
func NewRecognizer(modelDir string) (rec *Recognizer, err error) {
	cModelDir := C.CString(modelDir)
	defer C.free(unsafe.Pointer(cModelDir))
	ptr := C.facerec_init(cModelDir)

	if ptr.err_str != nil {
		defer C.facerec_free(ptr)
		defer C.free(unsafe.Pointer(ptr.err_str))
		err = makeError(C.GoString(ptr.err_str), int(ptr.err_code))
		return
	}

	rec = &Recognizer{ptr}
	return
}

func NewRecognizerWithConfig(modelDir string, size int, padding float32, jittering int) (rec *Recognizer, err error) {
	rec, err = NewRecognizer(modelDir)
	if err != nil {
		return
	}
	cSize := C.ulong(size)
	cPadding := C.double(padding)
	cJittering := C.int(jittering)
	C.facerec_config(rec.ptr, cSize, cPadding, cJittering)
	return
}

func (rec *Recognizer) recognize(type_ int, imgData []byte, maxFaces int) (faces []Face, err error) {
	if len(imgData) == 0 {
		err = ImageLoadError("Empty image")
		return
	}
	if maxFaces > maxFaceLimit {
		maxFaces = maxFaceLimit
	}
	cImgData := (*C.uint8_t)(&imgData[0])
	cLen := C.int(len(imgData))
	cMaxFaces := C.int(maxFaces)
	cType := C.int(type_)

	ret := C.facerec_recognize(rec.ptr, cImgData, cLen, cMaxFaces, cType)
	defer C.free(unsafe.Pointer(ret))

	if ret.err_str != nil {
		defer C.free(unsafe.Pointer(ret.err_str))
		err = makeError(C.GoString(ret.err_str), int(ret.err_code))
		return
	}

	numFaces := int(ret.num_faces)
	if numFaces == 0 {
		return
	}
	numShapes := int(ret.num_shapes)

	// Copy faces data to Go structure.
	defer C.free(unsafe.Pointer(ret.shapes))
	defer C.free(unsafe.Pointer(ret.rectangles))
	defer C.free(unsafe.Pointer(ret.descriptors))

	rDataLen := numFaces * rectLen
	rDataPtr := unsafe.Pointer(ret.rectangles)
	rData := (*[maxElements]C.long)(rDataPtr)[:rDataLen:rDataLen]

	dDataLen := numFaces * descrLen
	dDataPtr := unsafe.Pointer(ret.descriptors)
	dData := (*[maxElements]float32)(dDataPtr)[:dDataLen:dDataLen]

	sDataLen := numFaces * numShapes * shapeLen
	sDataPtr := unsafe.Pointer(ret.shapes)
	sData := (*[maxElements]C.long)(sDataPtr)[:sDataLen:sDataLen]

	faces = make([]Face, numFaces-1)
	for i := 0; i < numFaces; i++ {
		face := Face{}
		x0 := int(rData[i*rectLen])
		y0 := int(rData[i*rectLen+1])
		x1 := int(rData[i*rectLen+2])
		y1 := int(rData[i*rectLen+3])
		face.Rectangle = image.Rect(x0, y0, x1, y1)
		copy(face.Descriptor[:], dData[i*descrLen:(i+1)*descrLen])
		face.Shapes = make([]image.Point, numShapes)
		for j := 0; j < numShapes; j++ {
			shapeX := int(sData[(i*numShapes+j)*shapeLen])
			shapeY := int(sData[(i*numShapes+j)*shapeLen+1])
			face.Shapes[j] = image.Point{shapeX, shapeY}
		}
		faces = append(faces, face)
	}
	return
}

func (rec *Recognizer) recognizeBRG(type_ int, DataBRG []byte, width, height, maxFaces, downsample int) (faces []Face, err error) {
	if len(DataBRG) == 0 {
		err = ImageLoadError("Empty image")
		return
	}
	if len(DataBRG) != (width * height * 3) {
		err = ImageLoadError("Incorrect image data size")
		return
	}

	if maxFaces > maxFaceLimit {
		maxFaces = maxFaceLimit
	}
	cImgDataBRG := (*C.uint8_t)(&DataBRG[0])
	cMaxFaces := C.int(maxFaces)
	cType := C.int(type_)
	cWidth := C.int(width)
	cHeight := C.int(height)
	cDownSample := C.int(downsample)

	ret := C.facerec_recognize_brg(rec.ptr, cImgDataBRG, cWidth, cHeight, cMaxFaces, cType, cDownSample)
	defer C.free(unsafe.Pointer(ret))

	if ret.err_str != nil {
		defer C.free(unsafe.Pointer(ret.err_str))
		err = makeError(C.GoString(ret.err_str), int(ret.err_code))
		return
	}

	numFaces := int(ret.num_faces)
	if numFaces == 0 {
		return
	}
	numShapes := int(ret.num_shapes)

	// Copy faces data to Go structure.
	defer C.free(unsafe.Pointer(ret.shapes))
	defer C.free(unsafe.Pointer(ret.rectangles))
	defer C.free(unsafe.Pointer(ret.descriptors))

	rDataLen := numFaces * rectLen
	rDataPtr := unsafe.Pointer(ret.rectangles)
	rData := (*[maxElements]C.long)(rDataPtr)[:rDataLen:rDataLen]

	dDataLen := numFaces * descrLen
	dDataPtr := unsafe.Pointer(ret.descriptors)
	dData := (*[maxElements]float32)(dDataPtr)[:dDataLen:dDataLen]

	sDataLen := numFaces * numShapes * shapeLen
	sDataPtr := unsafe.Pointer(ret.shapes)
	sData := (*[maxElements]C.long)(sDataPtr)[:sDataLen:sDataLen]

	for i := 0; i < numFaces; i++ {
		face := Face{}
		x0 := int(rData[i*rectLen])
		y0 := int(rData[i*rectLen+1])
		x1 := int(rData[i*rectLen+2])
		y1 := int(rData[i*rectLen+3])
		face.Rectangle = image.Rect(x0, y0, x1, y1)
		copy(face.Descriptor[:], dData[i*descrLen:(i+1)*descrLen])
		for j := 0; j < numShapes; j++ {
			shapeX := int(sData[(i*numShapes+j)*shapeLen])
			shapeY := int(sData[(i*numShapes+j)*shapeLen+1])
			face.Shapes = append(face.Shapes, image.Point{shapeX, shapeY})
		}
		faces = append(faces, face)
	}
	return
}

func (rec *Recognizer) detectBRG(type_ int, DataBRG []byte, width, height, maxFaces int) (faces []Face, err error) {
	if len(DataBRG) == 0 {
		err = ImageLoadError("Empty image")
		return
	}
	if len(DataBRG) != (width * height * 3) {
		err = ImageLoadError("Incorrect image data size")
		return
	}

	if maxFaces > maxFaceLimit {
		maxFaces = maxFaceLimit
	}
	cImgDataBRG := (*C.uint8_t)(&DataBRG[0])
	cMaxFaces := C.int(maxFaces)
	cType := C.int(type_)
	cWidth := C.int(width)
	cHeight := C.int(height)

	ret := C.facerec_detect_brg(rec.ptr, cImgDataBRG, cWidth, cHeight, cMaxFaces, cType)
	defer C.free(unsafe.Pointer(ret))

	if ret.err_str != nil {
		defer C.free(unsafe.Pointer(ret.err_str))
		err = makeError(C.GoString(ret.err_str), int(ret.err_code))
		return
	}

	numFaces := int(ret.num_faces)
	if numFaces == 0 {
		return
	}

	// Copy faces data to Go structure.
	defer C.free(unsafe.Pointer(ret.shapes))
	defer C.free(unsafe.Pointer(ret.rectangles))
	defer C.free(unsafe.Pointer(ret.descriptors))

	rDataLen := numFaces * rectLen
	rDataPtr := unsafe.Pointer(ret.rectangles)
	rData := (*[maxElements]C.long)(rDataPtr)[:rDataLen:rDataLen]
	faces = make([]Face, numFaces-1)
	for i := 0; i < numFaces; i++ {
		face := Face{}
		x0 := int(rData[i*rectLen])
		y0 := int(rData[i*rectLen+1])
		x1 := int(rData[i*rectLen+2])
		y1 := int(rData[i*rectLen+3])
		face.Rectangle = image.Rect(x0, y0, x1, y1)
		faces = append(faces, face)
	}
	return
}

func (rec *Recognizer) recognizeFile(type_ int, imgPath string, maxFaces int) (face []Face, err error) {
	fd, err := os.Open(imgPath)
	if err != nil {
		return
	}
	defer fd.Close()
	imgData, err := ioutil.ReadAll(fd)
	if err != nil {
		return
	}
	return rec.recognize(type_, imgData, maxFaces)
}

// Recognize returns all faces found on the provided image, sorted from
// left to right. Empty list is returned if there are no faces, error is
// returned if there was some error while decoding/processing image.
// Only JPEG format is currently supported. Thread-safe.
func (rec *Recognizer) Recognize(imgData []byte) (faces []Face, err error) {
	return rec.recognize(0, imgData, 0)
}

func (rec *Recognizer) RecognizeCNN(imgData []byte) (faces []Face, err error) {
	return rec.recognize(1, imgData, 0)
}

func (rec *Recognizer) RecognizeBRG(DataBRG []byte, width, height int, modelType string, downsample int) (faces []Face, err error) {
	model := 0
	if modelType == "cnn" {
		model = 1
	}
	if downsample < 1 {
		downsample = 1
	}
	return rec.recognizeBRG(model, DataBRG, width, height, 0, downsample)
}

func (rec *Recognizer) DetectBRG(DataBRG []byte, width, height int, modelType ...string) (faces []Face, err error) {
	model := 0
	if (len(modelType) > 0) && (modelType[0] == "cnn") {
		model = 1
	}
	return rec.detectBRG(model, DataBRG, width, height, 0)
}

// RecognizeSingle returns face if it's the only face on the image or
// nil otherwise. Only JPEG format is currently supported. Thread-safe.
func (rec *Recognizer) RecognizeSingle(imgData []byte) (face *Face, err error) {
	faces, err := rec.recognize(0, imgData, 1)
	if err != nil || len(faces) != 1 {
		return
	}
	face = &faces[0]
	return
}

func (rec *Recognizer) RecognizeSingleCNN(imgData []byte) (face *Face, err error) {
	faces, err := rec.recognize(1, imgData, 1)
	if err != nil || len(faces) != 1 {
		return
	}
	face = &faces[0]
	return
}

// Same as Recognize but accepts image path instead.
func (rec *Recognizer) RecognizeFile(imgPath string) (faces []Face, err error) {
	return rec.recognizeFile(0, imgPath, 0)
}

func (rec *Recognizer) RecognizeFileCNN(imgPath string) (faces []Face, err error) {
	return rec.recognizeFile(1, imgPath, 0)
}

// Same as RecognizeSingle but accepts image path instead.
func (rec *Recognizer) RecognizeSingleFile(imgPath string) (face *Face, err error) {
	faces, err := rec.recognizeFile(0, imgPath, 1)
	if err != nil || len(faces) != 1 {
		return
	}
	face = &faces[0]
	return
}

func (rec *Recognizer) RecognizeSingleFileCNN(imgPath string) (face *Face, err error) {
	faces, err := rec.recognizeFile(1, imgPath, 1)
	if err != nil || len(faces) != 1 {
		return
	}
	face = &faces[0]
	return
}

// SetSamples sets known descriptors so you can classify the new ones.
// Thread-safe.
func (rec *Recognizer) SetSamples(samples []Descriptor, cats []int32) {
	if len(samples) == 0 || len(samples) != len(cats) {
		return
	}
	cSamples := (*C.float)(unsafe.Pointer(&samples[0]))
	cCats := (*C.int32_t)(unsafe.Pointer(&cats[0]))
	cLen := C.int(len(samples))
	C.facerec_set_samples(rec.ptr, cSamples, cCats, cLen)
}

// Classify returns class ID for the given descriptor. Negative index is
// returned if no match. Thread-safe.
func (rec *Recognizer) Classify(testSample Descriptor) (int, float32) {
	cTestSample := (*C.float)(unsafe.Pointer(&testSample))
	res := C.facerec_classify(rec.ptr, cTestSample, -1)
	return int(res.idx), float32(res.distance)
}

// Same as Classify but allows to specify max distance between faces to
// consider it a match. Start with 0.6 if not sure.
func (rec *Recognizer) ClassifyThreshold(testSample Descriptor, tolerance float32) (int, float32) {
	cTestSample := (*C.float)(unsafe.Pointer(&testSample))
	cTolerance := C.float(tolerance)
	res := C.facerec_classify(rec.ptr, cTestSample, cTolerance)
	return int(res.idx), float32(res.distance)
}

// Close frees resources taken by the Recognizer. Safe to call multiple
// times. Don't use Recognizer after close call.
func (rec *Recognizer) Close() {
	C.facerec_free(rec.ptr)
	rec.ptr = nil
}
