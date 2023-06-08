#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
	IMAGE_LOAD_ERROR,
	SERIALIZATION_ERROR,
	UNKNOWN_ERROR,
} err_code;

typedef struct facerec {
	void* cls;
	const char* err_str;
	err_code err_code;
	int jittering;
	unsigned long size;
	double padding;
} facerec;

typedef struct faceret {
	int num_faces;
	long* rectangles;
	float* descriptors;
	int num_shapes;
	long* shapes;
	const char* err_str;
	err_code err_code;
} faceret;

typedef struct face_class {
	int idx;
	float distance;
} face_class ;

facerec* facerec_init(const char* model_dir);
faceret* facerec_recognize(facerec* rec, const uint8_t* img_data, int len, int max_faces,int type);
faceret* facerec_recognize_brg(facerec* rec, const uint8_t* img_data, int width, int height, int max_faces,int type, int downsample);
faceret* facerec_detect_brg(facerec* rec, const uint8_t* img_data, int width, int height, int max_faces,int type);
void facerec_set_samples(facerec* rec, const float* descriptors, const int32_t* cats, int len);
face_class* facerec_classify(facerec* rec, const float* descriptor, float tolerance);
void facerec_free(facerec* rec);
void facerec_config(facerec* rec, unsigned long size, double padding, int jittering);
#ifdef __cplusplus
}
#endif
