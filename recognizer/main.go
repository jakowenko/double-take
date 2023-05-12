package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strconv"
	"time"

	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"syscall"

	recognizer "github.com/leandroveronezi/go-recognizer"
	_ "github.com/mattn/go-sqlite3"
	daemon "github.com/sevlyar/go-daemon"
)

var daemonize = flag.Bool("d", false, `Run in background`)
var port = flag.Uint("port", 5000, "Listening port")
var storageDir = flag.String("storage", ".storage", "Directory with database file and images folders")
var modelsDir = flag.String("models", "models", "Directory with models files")
var numTrainImages = flag.Uint("trainlimit", 0, "Number of images for each person to train. default: no limit")
var cnn = flag.Bool("cnn", false, `Use CNN`)
var signal = flag.String("s", "", `Send signal to the daemon:
  quit — graceful shutdown
  stop — fast shutdown
  reload — reloading the configuration file`)

var (
	stop = make(chan struct{})
	done = make(chan struct{})
)

const (
	dbFilename = "database.db"
	//storageDir = "./.storage"
)

type DummyResponse struct {
	Success bool `json:"success"`
	Code    uint `json:"code"`
}

type FaceRecognitionResponse struct {
	Success     bool   `json:"success"`
	Faces       []Face `json:"predictions"`
	Count       int    `json:"count"`
	Message     string `json:"messge"`
	Code        uint   `json:"code"`
	InferenceMs int    `json:"inferenceMs"`
}

type Face struct {
	Name       string  `json:"userid"`
	Confidence float32 `json:"confidence"`
	XMin       float64 `json:"x_min"`
	YMin       float64 `json:"y_min"`
	XMax       float64 `json:"x_max"`
	YMax       float64 `json:"y_max"`
}

type FaceListResponse struct {
	Success bool     `json:"success"`
	Faces   []string `json:"faces"`
	Code    uint     `json:"code"`
}

func respondJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	jsonData, err := json.Marshal(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Fprint(w, string(jsonData))
}

func addFile(rec *recognizer.Recognizer, path, id string) {
	startTime := time.Now()
	err := rec.AddImageToDataset(path, id)
	if err != nil {
		log.Println(err)
		return
	}
	elapsedTime := time.Since(startTime)
	log.Printf("[%s] Trained image %s for %s\n", elapsedTime, path, id)
}

func main() {
	flag.Parse()
	daemon.AddCommand(daemon.StringFlag(signal, "quit"), syscall.SIGQUIT, termHandler)
	daemon.AddCommand(daemon.StringFlag(signal, "stop"), syscall.SIGTERM, termHandler)
	daemon.AddCommand(daemon.StringFlag(signal, "reload"), syscall.SIGHUP, reloadHandler)
	if *daemonize == true {

		cntxt := &daemon.Context{
			PidFileName: filepath.Join(*storageDir, "recognizer.pid"),
			PidFilePerm: 0644,
			LogFileName: filepath.Join(*storageDir, "recognizer.log"),
			LogFilePerm: 0640,
			WorkDir:     "./",
			Umask:       027,
			//Args:        []string{"[go-daemon sample]"},
		}

		if len(daemon.ActiveFlags()) > 0 {
			d, err := cntxt.Search()
			if err != nil {
				log.Fatalf("Unable send signal to the daemon: %s", err.Error())
			}
			daemon.SendCommands(d)
			return
		}

		d, err := cntxt.Reborn()
		if err != nil {
			log.Fatalln(err)
		}
		if d != nil {
			return
		}
		defer cntxt.Release()

		log.Println("- - - - - - - - - - - - - - -")
		log.Println("daemon started")

		go looper()

		err = daemon.ServeSignals()
		if err != nil {
			log.Printf("Error: %s", err.Error())
		}

		log.Println("daemon terminated")

	} else {
		worker()
	}
}

func looper() {
LOOP:
	for {
		worker()
		select {
		case <-stop:
			break LOOP
		default:
		}
	}
	done <- struct{}{}
}

func worker() {

	rec := recognizer.Recognizer{}
	err := rec.Init(*modelsDir)

	if err != nil {
		log.Println(err)
		return
	}
	//rec.Tolerance = 0.4
	rec.UseCNN = *cnn
	defer rec.Close()

	db, err := sql.Open("sqlite3", filepath.Join(*storageDir, dbFilename)+"?mode=ro")
	if err != nil {
		log.Println(err)
		return
	}
	defer db.Close()

	var rows *sql.Rows
	if *numTrainImages > 0 {
		rows, err = db.Query(`SELECT id, filename, name, createdAt
			FROM (
			SELECT id, filename, name, createdAt, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id DESC) AS rn
			FROM train WHERE json_extract(meta, '$.status') < 300 AND json_extract(meta, '$.status') >= 200
			) AS t
			WHERE rn <= ` + strconv.Itoa(int(*numTrainImages)) + ` GROUP BY filename`)
	} else {
		rows, err = db.Query(`SELECT id, filename, name, createdAt FROM train WHERE json_extract(meta, '$.status') < 300 AND json_extract(meta, '$.status') >= 200 GROUP BY filename ORDER BY name ASC`)
	}
	if err != nil {
		log.Println(err)
		return
	}
	defer rows.Close()

	faceList := map[string]uint{}
	latestUpdate := time.Unix(0, 0)
	for rows.Next() {
		var id, filename, name string
		var createdAt time.Time
		if err := rows.Scan(&id, &filename, &name, &createdAt); err != nil {
			log.Println(err)
			return
		}
		addFile(&rec, filepath.Join(*storageDir, "train", name, filename), name)
		faceList[name] += 1
		if createdAt.After(latestUpdate) {
			latestUpdate = createdAt
		}
	}

	rec.SetSamples()

	http.HandleFunc("/v1/vision/face/recognize", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		startTime := time.Now()
		file, _, err := r.FormFile("image")
		if err != nil {
			http.Error(w, "Invalid file", http.StatusBadRequest)
			return
		}
		defer file.Close()

		tempFile, err := ioutil.TempFile("", "upload-*.jpg")
		if err != nil {
			log.Printf("Error processing file: %v", err)
			http.Error(w, "Error processing file", http.StatusInternalServerError)
			return
		}
		defer tempFile.Close()

		fileBytes, _ := ioutil.ReadAll(file)
		tempFile.Write(fileBytes)

		faces, err := rec.ClassifyMultiples(tempFile.Name())
		if err != nil {
			http.Error(w, "Error recognizing faces", http.StatusInternalServerError)
			return
		}
		var resFaces []Face
		message := ""
		// Respond with the first recognized face and its confidence level
		if len(faces) > 0 {
			for _, f := range faces {
				//log.Printf("Response: %s", f)
				resFaces = append(resFaces, Face{
					Name:       f.Id,
					Confidence: 1 - f.Distance,
					XMin:       float64(f.Rectangle.Min.X),
					YMin:       float64(f.Rectangle.Min.Y),
					XMax:       float64(f.Rectangle.Dx() + f.Rectangle.Min.X),
					YMax:       float64(f.Rectangle.Dy() + f.Rectangle.Min.Y),
				})
			}
			message = "A face was recognised"

		} else {
			message = "No known faces recognized."
			log.Println(message)
		}
		elapsedTime := time.Since(startTime)
		res := FaceRecognitionResponse{
			Success:     len(resFaces) > 0,
			Faces:       resFaces,
			Count:       len(resFaces),
			Message:     message,
			Code:        200,
			InferenceMs: int(elapsedTime.Milliseconds()),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	// Serve a simple HTML form for file uploads
	http.HandleFunc("/", staticHandler)

	http.HandleFunc("/v1/vision/face/list", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}
		var faces []string
		for name, _ := range faceList {
			faces = append(faces, name)
		}

		res := FaceListResponse{
			Success: true,
			Faces:   faces,
			Code:    200,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	})

	http.HandleFunc("/v1/vision/face/register", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		res := DummyResponse{
			Success: true,
			Code:    200,
		}
		json.NewEncoder(w).Encode(res)
	})
	http.HandleFunc("/v1/vision/face/delete", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		res := DummyResponse{
			Success: true,
			Code:    200,
		}
		json.NewEncoder(w).Encode(res)
	})

	log.Printf("Start listenion on port %s\n\n", ":"+strconv.Itoa(int(*port)))
	http.ListenAndServe(":"+strconv.Itoa(int(*port)), nil)

}

/*
func inBackgroundUpdate(latest time.Time, db *sql.DB) {
	ticker := time.NewTicker(5 * time.Minute)
	var rows *sql.Rows
	for _ = range ticker.C {
		fmt.Println("Ticking..")
		stmt, err := db.Prepare("SELECT id, filename, name, createdAt FROM train WHERE json_extract(meta, '$.success') = 1 AND createdAt > ? ORDER BY name ASC")
		if err != nil {
			log.Print(err)
		}
		defer stmt.Close()

		rows, err = stmt.Query(latest)
		if err != nil {
			log.Print(err)
		}
		defer rows.Close()
		for rows.Next() {
			var id, filename, name string
			var createdAt time.Time
			if err := rows.Scan(&id, &filename, &name, &createdAt); err != nil {
				log.Println(err)
				return
			}
			if createdAt.After(latest) {
				latest = createdAt
				addFile(&rec, filepath.Join(*storageDir, "train", name, filename), name)
				faceList[name] += 1
			}
		}
	}
}*/

func staticHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `<html>
		<body>
			<form action="/v1/vision/face/recognize" method="post" enctype="multipart/form-data">
				<input type="file" name="image">
				<input type="submit" value="Recognize">
			</form>
		</body>
		</html>`)
}

func termHandler(sig os.Signal) error {
	log.Println("terminating...")
	stop <- struct{}{}
	if sig == syscall.SIGQUIT {
		<-done
	}
	return daemon.ErrStop
}

func reloadHandler(sig os.Signal) error {
	log.Println("Not implemented yet :)")
	return nil
}
