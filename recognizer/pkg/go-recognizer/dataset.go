package recognizer

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
)

/*
SaveDataset saves Dataset data to a json file
*/
func (_this *Recognizer) SaveDataset(Path string) error {

	data, err := jsonMarshal(_this.Dataset)

	if err != nil {
		return err
	}

	return ioutil.WriteFile(Path, data, 0777)

}

/*
LoadDataset loads the data from the json file into the Dataset
*/
func (_this *Recognizer) LoadDataset(Path string) error {

	if !fileExists(Path) {
		return errors.New("file not found")
	}

	file, err := os.OpenFile(Path, os.O_RDONLY, 0777)
	if err != nil {
		return err
	}

	Dataset := make([]Data, 0)
	err = json.NewDecoder(file).Decode(&Dataset)
	if err != nil {
		return err
	}

	_this.Dataset = append(_this.Dataset, Dataset...)

	return nil

}
