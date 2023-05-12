package recognizer

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"os"

	goFace "github.com/Kagami/go-face"
)

// Data descriptor of the human face.
type Data struct {
	Id         string
	Descriptor goFace.Descriptor
}

// Face holds coordinates and descriptor of the human face.
type Face struct {
	Data
	Rectangle image.Rectangle
	Distance  float32
}

/*
A Recognizer creates face descriptors for provided images and
classifies them into categories.
*/
type Recognizer struct {
	Tolerance float32
	rec       *goFace.Recognizer
	UseCNN    bool
	UseGray   bool
	Dataset   []Data
}

/*
Init initialise a recognizer interface.
*/
func (_this *Recognizer) Init(Path string) error {

	_this.Tolerance = 0.4
	_this.UseCNN = false
	_this.UseGray = true

	_this.Dataset = make([]Data, 0)

	rec, err := goFace.NewRecognizer(Path)

	if err == nil {
		_this.rec = rec
	}

	return err

}

/*
Close frees resources taken by the Recognizer. Safe to call multiple
times. Don't use Recognizer after close call.
*/
func (_this *Recognizer) Close() {

	_this.rec.Close()

}

/*
AddImageToDataset add a sample image to the dataset
*/
func (_this *Recognizer) AddImageToDataset(Path string, Id string) error {

	file := Path
	var err error

	if _this.UseGray {

		file, err = _this.createTempGrayFile(file, Id)

		if err != nil {
			return err
		}

		defer os.Remove(file)

	}

	var faces []goFace.Face

	if _this.UseCNN {
		faces, err = _this.rec.RecognizeFileCNN(file)
	} else {
		faces, err = _this.rec.RecognizeFile(file)
	}

	if err != nil {
		return err
	}

	if len(faces) == 0 {
		return errors.New(fmt.Sprintf("%s: Not a face on the image (%s)", Path, Id))
	}

	if len(faces) > 1 {
		return errors.New(fmt.Sprintf("%s: ot a single face on the image (%s)", Path, Id))
	}

	f := Data{}
	f.Id = Id
	f.Descriptor = faces[0].Descriptor

	_this.Dataset = append(_this.Dataset, f)

	return nil

}

/*
SetSamples sets known descriptors so you can classify the new ones.
*/
func (_this *Recognizer) SetSamples() {

	var samples []goFace.Descriptor
	var avengers []int32

	for i, f := range _this.Dataset {
		samples = append(samples, f.Descriptor)
		avengers = append(avengers, int32(i))
	}

	_this.rec.SetSamples(samples, avengers)

}

/*
RecognizeSingle returns face if it's the only face on the image or nil otherwise.
Only JPEG format is currently supported.
*/
func (_this *Recognizer) RecognizeSingle(Path string) (goFace.Face, error) {

	file := Path
	var err error

	if _this.UseGray {

		file, err = _this.createTempGrayFile(file, "64ab59ac42d69274f06eadb11348969e")

		if err != nil {
			return goFace.Face{}, err
		}

		defer os.Remove(file)

	}

	var idFace *goFace.Face

	if _this.UseCNN {
		idFace, err = _this.rec.RecognizeSingleFileCNN(file)
	} else {
		idFace, err = _this.rec.RecognizeSingleFile(file)
	}

	if err != nil {
		return goFace.Face{}, fmt.Errorf("Can't recognize: %v", err)

	}
	if idFace == nil {
		return goFace.Face{}, fmt.Errorf("Not a single face on the image")
	}

	return *idFace, nil

}

/*
RecognizeMultiples returns all faces found on the provided image, sorted from
left to right. Empty list is returned if there are no faces, error is
returned if there was some error while decoding/processing image.
Only JPEG format is currently supported.
*/
func (_this *Recognizer) RecognizeMultiples(Path string) ([]goFace.Face, error) {

	file := Path
	var err error

	if _this.UseGray {

		file, err = _this.createTempGrayFile(file, "64ab59ac42d69274f06eadb11348969e")

		if err != nil {
			return nil, err
		}

		defer os.Remove(file)

	}

	var idFaces []goFace.Face

	if _this.UseCNN {
		idFaces, err = _this.rec.RecognizeFileCNN(file)
	} else {
		idFaces, err = _this.rec.RecognizeFile(file)
	}

	if err != nil {
		return nil, fmt.Errorf("Can't recognize: %v", err)
	}

	return idFaces, nil

}

/*
Classify returns all faces identified in the image. Empty list is returned if no match.
*/
func (_this *Recognizer) Classify(Path string) ([]Face, error) {

	face, err := _this.RecognizeSingle(Path)

	if err != nil {
		return nil, err
	}

	personID, distance := _this.rec.ClassifyThreshold(face.Descriptor, _this.Tolerance)
	if personID < 0 {
		return nil, fmt.Errorf("Can't classify")
	}

	facesRec := make([]Face, 0)
	aux := Face{Data: _this.Dataset[personID], Rectangle: face.Rectangle, Distance: distance}
	facesRec = append(facesRec, aux)

	return facesRec, nil

}

/*
ClassifyMultiples returns all faces identified in the image. Empty list is returned if no match.
*/
func (_this *Recognizer) ClassifyMultiples(Path string) ([]Face, error) {

	faces, err := _this.RecognizeMultiples(Path)

	if err != nil {
		return nil, fmt.Errorf("Can't recognize: %v", err)
	}

	facesRec := make([]Face, 0)

	for _, f := range faces {

		personID, distance := _this.rec.ClassifyThreshold(f.Descriptor, _this.Tolerance)
		if personID < 0 {
			continue
		}

		aux := Face{Data: _this.Dataset[personID], Rectangle: f.Rectangle, Distance: distance}

		facesRec = append(facesRec, aux)

	}

	return facesRec, nil

}

/*
fileExists check se file exist
*/
func fileExists(FileName string) bool {
	file, err := os.Stat(FileName)
	return (err == nil) && !file.IsDir()
}

/*
jsonMarshal Marshal interface to array of byte
*/
func jsonMarshal(t interface{}) ([]byte, error) {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	err := encoder.Encode(t)
	return buffer.Bytes(), err
}
