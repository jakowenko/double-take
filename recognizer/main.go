package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"strconv"

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

type Face struct {
	Name       string  `json:"name"`
	Confidence float32 `json:"confidence"`
	x          float64 `json: "x"`
	y          float64 `json: "y"`
	w          float64 `json: "w"`
	h          float64 `json: "h"`
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
	err := rec.AddImageToDataset(path, id)
	if err != nil {
		log.Println(err)
		return
	}
	log.Printf("Trained image %s for %s\n", path, id)
}

func main() {
	flag.Parse()
	daemon.AddCommand(daemon.StringFlag(signal, "quit"), syscall.SIGQUIT, termHandler)
	daemon.AddCommand(daemon.StringFlag(signal, "stop"), syscall.SIGTERM, termHandler)
	daemon.AddCommand(daemon.StringFlag(signal, "reload"), syscall.SIGHUP, reloadHandler)
	if *daemonize == true {

		cntxt := &daemon.Context{
			PidFileName: "recognizer.pid",
			PidFilePerm: 0644,
			LogFileName: "recognizer.log",
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
	defer rec.Close()

	db, err := sql.Open("sqlite3", filepath.Join(*storageDir, dbFilename))
	if err != nil {
		log.Println(err)
		return
	}
	defer db.Close()

	var rows *sql.Rows
	if *numTrainImages > 0 {
		rows, err = db.Query(`SELECT id, filename, name
			FROM (
			SELECT id, filename, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY id DESC) AS rn
			FROM train WHERE json_extract(meta, '$.success') = 1
			) AS t
			WHERE rn <= ` + strconv.Itoa(int(*numTrainImages)))
	} else {
		rows, err = db.Query(`SELECT id, filename, name FROM train WHERE json_extract(meta, '$.success') = 1 ORDER BY name ASC`)
	}
	if err != nil {
		log.Println(err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id, filename, name string
		if err := rows.Scan(&id, &filename, &name); err != nil {
			log.Println(err)
			return
		}
		addFile(&rec, filepath.Join(*storageDir, "train", name, filename), name)
	}

	rec.SetSamples()

	http.HandleFunc("/recognize", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

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

		// Respond with the first recognized face and its confidence level
		if len(faces) > 0 {
			for _, f := range faces {
				//log.Printf("Response: %s", f)
				respondJSON(w, Face{Name: f.Id, Confidence: 1 - f.Distance, x: float64(f.Rectangle.Min.X),
					y: float64(f.Rectangle.Min.Y),
					w: float64(f.Rectangle.Dx()),
					h: float64(f.Rectangle.Dy())})
			}
		} else {
			response := map[string]string{"message": "No known faces recognized."}
			respondJSON(w, response)
			log.Println("No known faces recognized.")
		}
	})

	// Serve a simple HTML form for file uploads
	http.HandleFunc("/", staticHandler)

	log.Printf("Start listenion on port %s\n\n", ":"+strconv.Itoa(int(*port)))
	http.ListenAndServe(":"+strconv.Itoa(int(*port)), nil)

}

func staticHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, `<html>
		<body>
			<form action="/recognize" method="post" enctype="multipart/form-data">
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
