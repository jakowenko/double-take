#include <stdio.h>
#include <setjmp.h>
#include <jpeglib.h>
#include <dlib/image_loader/image_loader.h>
#include "jpeg_mem_loader.h"

// Based on dlib's JPEG loader and libjpeg example.
struct jpeg_loader_error_mgr {
	jpeg_error_mgr pub;  // "public" fields
	jmp_buf setjmp_buffer;  // For return to caller
};

static void jpeg_loader_error_exit(j_common_ptr cinfo) {
	// cinfo->err really points to a jpeg_loader_error_mgr struct, so coerce pointer.
	jpeg_loader_error_mgr* myerr = (jpeg_loader_error_mgr*)cinfo->err;
	// Return control to the setjmp point.
	longjmp(myerr->setjmp_buffer, 1);
}

static void jpeg_loader_emit_message(j_common_ptr cinfo, int msg_level) {
	// Just exit on any warning because file is probably corrupted.
	if (msg_level < 0)
		jpeg_loader_error_exit(cinfo);
}

// From memory JPEG loader because dlib lacks one.
void load_mem_jpeg(dlib::matrix<dlib::rgb_pixel>& img, const uint8_t* img_data, int len) {
	jpeg_decompress_struct cinfo;

	jpeg_loader_error_mgr jerr;
	cinfo.err = jpeg_std_error(&jerr.pub);
	jerr.pub.error_exit = jpeg_loader_error_exit;
	jerr.pub.emit_message = jpeg_loader_emit_message;
	if (setjmp(jerr.setjmp_buffer)) {
		char buffer[JMSG_LENGTH_MAX];
		(jerr.pub.format_message)((j_common_ptr)&cinfo, buffer);
		jpeg_destroy_decompress(&cinfo);
		throw dlib::image_load_error(std::string("jpeg_mem_loader: decode error: ") + buffer);
	}

	jpeg_create_decompress(&cinfo);
#if defined(LIBJPEG_TURBO_VERSION_NUMBER) && LIBJPEG_TURBO_VERSION_NUMBER >= 1004090
	jpeg_mem_src(&cinfo, img_data, len);
#else
	jpeg_mem_src(&cinfo, (uint8_t*)img_data, len);
#endif
	jpeg_read_header(&cinfo, TRUE);
	jpeg_start_decompress(&cinfo);

	if (cinfo.output_components != 3) {
		jpeg_destroy_decompress(&cinfo);
		throw dlib::image_load_error("jpeg_mem_loader: unsupported pixel size");
	}

	img.set_size(cinfo.output_height, cinfo.output_width);
	while (cinfo.output_scanline < cinfo.output_height) {
		uint8_t* buffer_array[1] = { (uint8_t*)&img(cinfo.output_scanline, 0) };
		jpeg_read_scanlines(&cinfo, buffer_array, 1);
	}

	jpeg_finish_decompress(&cinfo);
	jpeg_destroy_decompress(&cinfo);
}
