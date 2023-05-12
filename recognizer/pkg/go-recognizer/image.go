package recognizer

import (
	"crypto/rand"
	"encoding/hex"
	goFace "github.com/Kagami/go-face"
	"github.com/disintegration/imaging"
	"github.com/fogleman/gg"
	"github.com/golang/freetype/truetype"
	"golang.org/x/image/font/gofont/goregular"
	"image"
	"image/color"
	"image/jpeg"
	"os"
	"path/filepath"
)

/*
LoadImage Load an image from file
*/
func (_this *Recognizer) LoadImage(Path string) (image.Image, error) {

	existingImageFile, err := os.Open(Path)
	if err != nil {
		return nil, err
	}
	defer existingImageFile.Close()

	imageData, _, err := image.Decode(existingImageFile)
	if err != nil {
		return nil, err
	}

	return imageData, nil

}

/*
SaveImage Save an image to jpeg file
*/
func (_this *Recognizer) SaveImage(Path string, Img image.Image) error {

	outputFile, err := os.Create(Path)
	if err != nil {
		return err
	}

	err = jpeg.Encode(outputFile, Img, nil)

	if err != nil {
		return err
	}

	return outputFile.Close()

}

/*
GrayScale Convert an image to grayscale
*/
func (_this *Recognizer) GrayScale(imgSrc image.Image) image.Image {

	return imaging.Grayscale(imgSrc)

}

/*
createTempGrayFile create a temporary image in grayscale
*/
func (_this *Recognizer) createTempGrayFile(Path, Id string) (string, error) {

	name := _this.tempFileName(Id, ".jpeg")

	img, err := _this.LoadImage(Path)

	if err != nil {
		return "", err
	}

	img = _this.GrayScale(img)
	err = _this.SaveImage(name, img)

	if err != nil {
		return "", err
	}

	return name, nil

}

// tempFileName generates a temporary filename
func (_this *Recognizer) tempFileName(prefix, suffix string) string {
	randBytes := make([]byte, 16)
	rand.Read(randBytes)
	return filepath.Join(os.TempDir(), prefix+hex.EncodeToString(randBytes)+suffix)
}

/*
DrawFaces draws the faces identified in the original image
*/
func (_this *Recognizer) DrawFaces(Path string, F []Face) (image.Image, error) {

	img, err := _this.LoadImage(Path)

	if err != nil {
		return nil, err
	}

	font, err := truetype.Parse(goregular.TTF)
	if err != nil {
		return nil, err
	}

	face := truetype.NewFace(font, &truetype.Options{Size: 24})

	dc := gg.NewContextForImage(img)
	dc.SetFontFace(face)

	for _, f := range F {

		dc.SetRGB255(0, 0, 255)

		x := float64(f.Rectangle.Min.X)
		y := float64(f.Rectangle.Min.Y)
		w := float64(f.Rectangle.Dx())
		h := float64(f.Rectangle.Dy())

		dc.DrawString(f.Id, x, y+h+20)

		dc.DrawRectangle(x, y, w, h)
		dc.SetLineWidth(4.0)
		dc.SetStrokeStyle(gg.NewSolidPattern(color.RGBA{R: 0, G: 0, B: 255, A: 255}))
		dc.Stroke()

	}

	img = dc.Image()

	return img, nil

}

/*
DrawFaces2 draws the faces in the original image
*/
func (_this *Recognizer) DrawFaces2(Path string, F []goFace.Face) (image.Image, error) {

	aux := make([]Face, 0)

	for _, f := range F {

		auxFace := Face{}
		auxFace.Rectangle = f.Rectangle
		auxFace.Descriptor = f.Descriptor

		aux = append(aux, auxFace)

	}

	return _this.DrawFaces(Path, aux)

}
