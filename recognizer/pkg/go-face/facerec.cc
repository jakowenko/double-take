#include <shared_mutex>
#include <dlib/dnn.h>
#include <dlib/image_loader/image_loader.h>
#include <dlib/image_processing/frontal_face_detector.h>
#include <dlib/graph_utils.h>
#include "facerec.h"
#include "jpeg_mem_loader.h"
#include "classify.h"

using namespace dlib;

template <template <int,template<typename>class,int,typename> class block, int N, template<typename>class BN, typename SUBNET>
using residual = add_prev1<block<N,BN,1,tag1<SUBNET>>>;

template <template <int,template<typename>class,int,typename> class block, int N, template<typename>class BN, typename SUBNET>
using residual_down = add_prev2<avg_pool<2,2,2,2,skip1<tag2<block<N,BN,2,tag1<SUBNET>>>>>>;

template <int N, template <typename> class BN, int stride, typename SUBNET>
using block  = BN<con<N,3,3,1,1,relu<BN<con<N,3,3,stride,stride,SUBNET>>>>>;

template <int N, typename SUBNET> using ares      = relu<residual<block,N,affine,SUBNET>>;
template <int N, typename SUBNET> using ares_down = relu<residual_down<block,N,affine,SUBNET>>;

template <typename SUBNET> using alevel0 = ares_down<256,SUBNET>;
template <typename SUBNET> using alevel1 = ares<256,ares<256,ares_down<256,SUBNET>>>;
template <typename SUBNET> using alevel2 = ares<128,ares<128,ares_down<128,SUBNET>>>;
template <typename SUBNET> using alevel3 = ares<64,ares<64,ares<64,ares_down<64,SUBNET>>>>;
template <typename SUBNET> using alevel4 = ares<32,ares<32,ares<32,SUBNET>>>;

template <long num_filters, typename SUBNET> using con5d = con<num_filters,5,5,2,2,SUBNET>;
template <long num_filters, typename SUBNET> using con5  = con<num_filters,5,5,1,1,SUBNET>;

template <typename SUBNET> using downsampler  = relu<affine<con5d<32, relu<affine<con5d<32, relu<affine<con5d<16,SUBNET>>>>>>>>>;
template <typename SUBNET> using rcon5  = relu<affine<con5<45,SUBNET>>>;

using cnn_anet_type = loss_mmod<con<1,9,9,1,1,rcon5<rcon5<rcon5<downsampler<input_rgb_image_pyramid<pyramid_down<6>>>>>>>>;

using anet_type = loss_metric<fc_no_bias<128,avg_pool_everything<
                            alevel0<
                            alevel1<
                            alevel2<
                            alevel3<
                            alevel4<
                            max_pool<3,3,2,2,relu<affine<con<32,7,7,2,2,
                            input_rgb_image_sized<150>
                            >>>>>>>>>>>>;

static const size_t RECT_LEN = 4;
static const size_t DESCR_LEN = 128;
static const size_t SHAPE_LEN = 2;
static const size_t RECT_SIZE = RECT_LEN * sizeof(long);
static const size_t DESCR_SIZE = DESCR_LEN * sizeof(float);
static const size_t SHAPE_SIZE = SHAPE_LEN * sizeof(long);

static std::vector<matrix<rgb_pixel>> jitter_image(
    const matrix<rgb_pixel>& img,
    int count
);

class FaceRec {
public:
	FaceRec(const char* model_dir) {
		detector_ = get_frontal_face_detector();

		std::string dir = model_dir;
		std::string shape_predictor_path = dir + "/shape_predictor_68_face_landmarks.dat";
		std::string resnet_path = dir + "/dlib_face_recognition_resnet_model_v1.dat";
		std::string cnn_resnet_path = dir + "/mmod_human_face_detector.dat";

		deserialize(shape_predictor_path) >> sp_;
		deserialize(resnet_path) >> net_;
		deserialize(cnn_resnet_path) >> cnn_net_;

		jittering = 0;
		size = 150;
		padding = 0.25;
	}

	std::tuple<std::vector<rectangle>, std::vector<descriptor>, std::vector<full_object_detection>>
	Recognize(const matrix<rgb_pixel>& img,int max_faces,int type) {
		std::vector<rectangle> rects;
		std::vector<descriptor> descrs;
		std::vector<full_object_detection> shapes;

		if(type == 0) {
			std::lock_guard<std::mutex> lock(detector_mutex_);
			rects = detector_(img);
		} else{
			std::lock_guard<std::mutex> lock(cnn_net_mutex_);
			auto dets = cnn_net_(img);
            for (auto&& d : dets) {
                rects.push_back(d.rect);
            }
		}

		// Short circuit.
		if (rects.size() == 0 || (max_faces > 0 && rects.size() > (size_t)max_faces))
			return {std::move(rects), std::move(descrs), std::move(shapes)};

		std::sort(rects.begin(), rects.end());

		for (const auto& rect : rects) {
			auto shape = sp_(img, rect);
			shapes.push_back(shape);
			matrix<rgb_pixel> face_chip;
			extract_image_chip(img, get_face_chip_details(shape, size, padding), face_chip);
			std::lock_guard<std::mutex> lock(net_mutex_);
			if (jittering > 0) {
				descrs.push_back(mean(mat(net_(jitter_image(std::move(face_chip), jittering)))));
			} else {
				descrs.push_back(net_(face_chip));
			}
		}

		return {std::move(rects), std::move(descrs), std::move(shapes)};
	}

	std::tuple<std::vector<rectangle>>
	Detect(const matrix<rgb_pixel>& img,int max_faces,int type) {
		std::vector<rectangle> rects;
		
		if(type == 0) {
			std::lock_guard<std::mutex> lock(detector_mutex_);
			rects = detector_(img);
		} else{
			std::lock_guard<std::mutex> lock(cnn_net_mutex_);
			auto dets = cnn_net_(img);
            for (auto&& d : dets) {
				std::cout << "ignore:" << d.ignore << " confidence:" << d.detection_confidence << " label:" <<d.label << std::endl;
                rects.push_back(d.rect);
            }
		}

		// Short circuit.
		return {std::move(rects)};

	}

	std::tuple<std::vector<rectangle>, std::vector<descriptor>, std::vector<full_object_detection>>
	RecognizeOnly(const matrix<rgb_pixel>& img,int max_faces, std::vector<rectangle> rects) {
		std::vector<descriptor> descrs;
		std::vector<full_object_detection> shapes;
		if (rects.size() == 0 || (max_faces > 0 && rects.size() > (size_t)max_faces))
			return {std::move(rects), std::move(descrs), std::move(shapes)};


		std::sort(rects.begin(), rects.end());

		for (const auto& rect : rects) {
			auto shape = sp_(img, rect);
			shapes.push_back(shape);
			matrix<rgb_pixel> face_chip;
			extract_image_chip(img, get_face_chip_details(shape, size, padding), face_chip);
			std::lock_guard<std::mutex> lock(net_mutex_);
			if (jittering > 0) {
				descrs.push_back(mean(mat(net_(jitter_image(std::move(face_chip), jittering)))));
			} else {
				descrs.push_back(net_(face_chip));
			}
		}

		return {std::move(rects), std::move(descrs), std::move(shapes)};
	}


	void SetSamples(std::vector<descriptor>&& samples, std::vector<int>&& cats) {
		std::unique_lock<std::shared_mutex> lock(samples_mutex_);
		samples_ = std::move(samples);
		cats_ = std::move(cats);
	}

	std::tuple<int, float>  Classify(const descriptor& test_sample, float tolerance) {
		std::shared_lock<std::shared_mutex> lock(samples_mutex_);
		return classify(samples_, cats_, test_sample, tolerance);
	}

    void Config(unsigned long new_size, double new_padding, int new_jittering) {
        size = new_size;
        padding = new_padding;
        jittering = new_jittering;
    }
private:
	std::mutex detector_mutex_;
	std::mutex net_mutex_;
	std::mutex cnn_net_mutex_;
	std::shared_mutex samples_mutex_;
	frontal_face_detector detector_;
	shape_predictor sp_;
	anet_type net_;
	cnn_anet_type cnn_net_;
	std::vector<descriptor> samples_;
	std::vector<int> cats_;
	int jittering;
	unsigned long size;
	double padding;
};

// Plain C interface for Go.

facerec* facerec_init(const char* model_dir) {
	facerec* rec = (facerec*)calloc(1, sizeof(facerec));
	try {
		FaceRec* cls = new FaceRec(model_dir);
		rec->cls = (void*)cls;
	} catch(serialization_error& e) {
		rec->err_str = strdup(e.what());
		rec->err_code = SERIALIZATION_ERROR;
	} catch (std::exception& e) {
		rec->err_str = strdup(e.what());
		rec->err_code = UNKNOWN_ERROR;
	}
	return rec;
}
void facerec_config(facerec* rec, unsigned long size, double padding, int jittering) {
	FaceRec* cls = (FaceRec*)(rec->cls);
	cls->Config(size,padding,jittering);
}


faceret* facerec_recognize_brg(facerec* rec, const uint8_t* brg_data, int width, int height, int max_faces,int type, int downsample) {
	faceret* ret = (faceret*)calloc(1, sizeof(faceret));
	FaceRec* cls = (FaceRec*)(rec->cls);
	int height_ds, width_ds;
	height_ds=height/downsample;
	width_ds=width/downsample;
	std::vector<rectangle> rects;
	std::vector<descriptor> descrs;
	std::vector<full_object_detection> shapes;
	matrix<rgb_pixel> img_rgb{height, width};
	matrix<rgb_pixel> img_rgb_ds{height_ds, width_ds};

	try {
		int x=0;
		int y=0;
		int x_ds=0;
		int y_ds=0;
		int count = width*height*3;
		for (int i = 0; i < count; i=i+3)
		{

			img_rgb(y, x)=rgb_pixel{brg_data[i+2], brg_data[i+1], brg_data[i]};
			x_ds = x/downsample;
			y_ds = y/downsample;
			if (x%downsample == 0 && y%downsample==0 && x_ds < width_ds && y_ds < height_ds) {
				img_rgb_ds(y_ds,x_ds)=img_rgb(y, x);
			}
			if (x > 0 && x%(width-1) == 0) {
				x = 0;
				y++;
				
			} else {
				x++;
			}

		}

		std::tie(rects) = cls->Detect(img_rgb_ds, max_faces, type);
		ret->num_faces=rects.size();
		if (downsample>0 && ret->num_faces>0) {
			for (int i = 0; i < ret->num_faces; i++)
			{
				rects[i].set_left(rects[i].left()*downsample);
				rects[i].set_top(rects[i].top()*downsample);
				rects[i].set_right(rects[i].right()*downsample);
				rects[i].set_bottom(rects[i].bottom()*downsample);

			}
			
		}
		std::tie(rects, descrs, shapes) = cls->RecognizeOnly(img_rgb, max_faces, rects);
	} catch(image_load_error& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = IMAGE_LOAD_ERROR;
		return ret;
	} catch (std::exception& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = UNKNOWN_ERROR;
		return ret;
	}
	ret->num_faces = descrs.size();

	if (ret->num_faces == 0)
		return ret;
	ret->rectangles = (long*)malloc(ret->num_faces * RECT_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		long* dst = ret->rectangles + i * RECT_LEN;
		dst[0] = rects[i].left();
		dst[1] = rects[i].top();
		dst[2] = rects[i].right();
		dst[3] = rects[i].bottom();
	}
	ret->descriptors = (float*)malloc(ret->num_faces * DESCR_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		void* dst = (uint8_t*)(ret->descriptors) + i * DESCR_SIZE;
		void* src = (void*)&descrs[i](0,0);
		memcpy(dst, src, DESCR_SIZE);
	}
	ret->num_shapes = shapes[0].num_parts();
	ret->shapes = (long*)malloc(ret->num_faces * ret->num_shapes * SHAPE_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		long* dst = ret->shapes + i * ret->num_shapes * SHAPE_LEN;
		const auto& shape = shapes[i];
		for (int j = 0; j < ret->num_shapes; j++) {
			dst[j*SHAPE_LEN] = shape.part(j).x();
			dst[j*SHAPE_LEN+1] = shape.part(j).y();
		}
	}
	return ret;
}

faceret* facerec_detect_brg(facerec* rec, const uint8_t* brg_data, int width, int height, int max_faces,int type) {
	faceret* ret = (faceret*)calloc(1, sizeof(faceret));
	FaceRec* cls = (FaceRec*)(rec->cls);
	
	std::vector<rectangle> rects;
	matrix<rgb_pixel> img_rgb{height, width};

	try {
		int x=0;
		int y=0;
		int count = width*height*3;
		for (int i = 0; i < count; i=i+3)
		{
			img_rgb(y, x)=rgb_pixel{brg_data[i+2], brg_data[i+1], brg_data[i]};
			if (x > 0 && x%(width-1) == 0) {
				x = 0;
				y++;
				
			} else {
				x++;
			}

		}

		std::tie(rects) = cls->Detect(img_rgb, max_faces,type);
	} catch(image_load_error& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = IMAGE_LOAD_ERROR;
		return ret;
	} catch (std::exception& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = UNKNOWN_ERROR;
		return ret;
	}
	ret->num_faces = rects.size();

	if (ret->num_faces == 0)
		return ret;
	ret->rectangles = (long*)malloc(ret->num_faces * RECT_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		long* dst = ret->rectangles + i * RECT_LEN;
		dst[0] = rects[i].left();
		dst[1] = rects[i].top();
		dst[2] = rects[i].right();
		dst[3] = rects[i].bottom();
	}
	return ret;
}


faceret* facerec_recognize(facerec* rec, const uint8_t* img_data, int len, int max_faces,int type) {
	faceret* ret = (faceret*)calloc(1, sizeof(faceret));
	FaceRec* cls = (FaceRec*)(rec->cls);
	matrix<rgb_pixel> img;
	std::vector<rectangle> rects;
	std::vector<descriptor> descrs;
	std::vector<full_object_detection> shapes;

	try {
		// TODO(Kagami): Support more file types?
		load_mem_jpeg(img, img_data, len);
		std::tie(rects, descrs, shapes) = cls->Recognize(img, max_faces,type);
	} catch(image_load_error& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = IMAGE_LOAD_ERROR;
		return ret;
	} catch (std::exception& e) {
		ret->err_str = strdup(e.what());
		ret->err_code = UNKNOWN_ERROR;
		return ret;
	}
	ret->num_faces = descrs.size();

	if (ret->num_faces == 0)
		return ret;
	ret->rectangles = (long*)malloc(ret->num_faces * RECT_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		long* dst = ret->rectangles + i * RECT_LEN;
		dst[0] = rects[i].left();
		dst[1] = rects[i].top();
		dst[2] = rects[i].right();
		dst[3] = rects[i].bottom();
	}
	ret->descriptors = (float*)malloc(ret->num_faces * DESCR_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		void* dst = (uint8_t*)(ret->descriptors) + i * DESCR_SIZE;
		void* src = (void*)&descrs[i](0,0);
		memcpy(dst, src, DESCR_SIZE);
	}
	ret->num_shapes = shapes[0].num_parts();
	ret->shapes = (long*)malloc(ret->num_faces * ret->num_shapes * SHAPE_SIZE);
	for (int i = 0; i < ret->num_faces; i++) {
		long* dst = ret->shapes + i * ret->num_shapes * SHAPE_LEN;
		const auto& shape = shapes[i];
		for (int j = 0; j < ret->num_shapes; j++) {
			dst[j*SHAPE_LEN] = shape.part(j).x();
			dst[j*SHAPE_LEN+1] = shape.part(j).y();
		}
	}
	return ret;
}

void facerec_set_samples(
	facerec* rec,
	const float* c_samples,
	const int32_t* c_cats,
	int len
) {
	FaceRec* cls = (FaceRec*)(rec->cls);
	std::vector<descriptor> samples;
	samples.reserve(len);
	for (int i = 0; i < len; i++) {
		descriptor sample = mat(c_samples + i*DESCR_LEN, DESCR_LEN, 1);
		samples.push_back(std::move(sample));
	}
	std::vector<int> cats(c_cats, c_cats + len);
	cls->SetSamples(std::move(samples), std::move(cats));
}

face_class* facerec_classify(facerec* rec, const float* c_test_sample, float tolerance) {
	face_class* ret = (face_class*)calloc(1, sizeof(face_class));
	FaceRec* cls = (FaceRec*)(rec->cls);
	descriptor test_sample = mat(c_test_sample, DESCR_LEN, 1);
	std::tie(ret->idx, ret->distance) = cls->Classify(test_sample, tolerance);
	return ret;
}

void facerec_free(facerec* rec) {
	if (rec) {
		if (rec->cls) {
			FaceRec* cls = (FaceRec*)(rec->cls);
			delete cls;
			rec->cls = NULL;
		}
		free(rec);
	}
}

static std::vector<matrix<rgb_pixel>> jitter_image(
    const matrix<rgb_pixel>& img,
    int count
)
{
    // All this function does is make count copies of img, all slightly jittered by being
    // zoomed, rotated, and translated a little bit differently. They are also randomly
    // mirrored left to right.
    thread_local dlib::rand rnd;

    std::vector<matrix<rgb_pixel>> crops;
    for (int i = 0; i < count; ++i)
        crops.push_back(jitter_image(img,rnd));

    return crops;
}
