package main

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"

	"path/filepath"
	"testing"

	recognizer "github.com/leandroveronezi/go-recognizer"
)

func BenchmarkAddFile(b *testing.B) {
	err := downloadModels()
	if err != nil {

		return
	}
	rec := recognizer.Recognizer{}
	err = rec.Init(*modelsDir)
	if err != nil {
		b.Fatalf("Recognizer initialization failed: %v", err)
	}
	rec.UseCNN = *cnn
	defer rec.Close()

	path := TempFileName("", ".jpg")
	err = downloadFile(path, "https://thispersondoesnotexist.com")
	if err != nil {
		b.Fatalf("Download face image failed: %v", err)
		return
	}
	id := "testId" // replace with your test id

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		addFile(&rec, path, id)
	}
}

func BenchmarkDownloadModels(b *testing.B) {
	for i := 0; i < b.N; i++ {
		err := downloadModels()
		if err != nil {
			b.Fatalf("Failed to download models: %v", err)
		}
		// Assuming we want to re-download for each benchmark iteration, we'll delete the files after download.
		err = os.RemoveAll(*modelsDir)
		if err != nil {
			b.Fatalf("Failed to clean up: %v", err)
		}
	}
}
func TempFileName(prefix, suffix string) string {
	randBytes := make([]byte, 16)
	rand.Read(randBytes)
	tempdir := os.TempDir()
	os.MkdirAll(tempdir, os.ModePerm)
	return filepath.Join(tempdir, prefix+hex.EncodeToString(randBytes)+suffix)
}
func downloadFile(filepath string, url string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}
