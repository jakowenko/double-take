package main

import (
	"fmt"
	"path/filepath"

	"github.com/leandroveronezi/go-recognizer"
)

const fotosDir = "fotos"
const dataDir = "models"

func main() {

	rec := recognizer.Recognizer{}
	err := rec.Init(dataDir)

	if err != nil {
		fmt.Println(err)
		return
	}

	rec.Tolerance = 0.4
	rec.UseGray = true
	rec.UseCNN = false
	defer rec.Close()

	faces, err := rec.RecognizeMultiples(filepath.Join(fotosDir, "elenco3.jpg"))

	if err != nil {
		fmt.Println(err)
		return
	}

	img, err := rec.DrawFaces2(filepath.Join(fotosDir, "elenco3.jpg"), faces)

	if err != nil {
		fmt.Println(err)
		return
	}

	rec.SaveImage("faces2.jpg", img)

}
