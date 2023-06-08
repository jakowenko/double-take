package face

// #include <stdint.h>
// #include "facerec.h"
import "C"

// An ImageLoadError is returned when provided image file is corrupted.
type ImageLoadError string

func (e ImageLoadError) Error() string {
	return string(e)
}

// An SerializationError is returned when provided model is corrupted.
type SerializationError string

func (e SerializationError) Error() string {
	return string(e)
}

// An UnknownError represents some nonclassified error.
type UnknownError string

func (e UnknownError) Error() string {
	return string(e)
}

// makeError constructs Go error for passed error info.
func makeError(s string, code int) error {
	switch code {
	case C.IMAGE_LOAD_ERROR:
		return ImageLoadError(s)
	case C.SERIALIZATION_ERROR:
		return SerializationError(s)
	default:
		return UnknownError(s)
	}
}
