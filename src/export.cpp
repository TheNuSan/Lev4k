#include "export.h"

#include <windows.h>
#include <GL/gl.h>
#include "glext.h"

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

#define EXPORT_PNG 1
#define KEEP_EXISTING_FRAMES 1

bool FileExists(const char *fileName)
{
	DWORD       fileAttr;
	fileAttr = GetFileAttributes(fileName);
	if (0xFFFFFFFF == fileAttr && GetLastError() == ERROR_FILE_NOT_FOUND)
		return false;
	return true;
}

int saveScreenshot(unsigned long time)
{
	CreateDirectory("export", NULL);

	static char filename[100];
#if EXPORT_PNG
	sprintf(filename, "export/img_%08lu.png", time);
#else
	sprintf(filename, "export/img_%08lu.jpg", time);
#endif

#if KEEP_EXISTING_FRAMES
	if (FileExists(filename)) {
		return 0;
	}
#endif


	GLint viewport[4];
	glGetIntegerv(GL_VIEWPORT, viewport);

	int x = viewport[0];
	int y = viewport[1];
	int width = viewport[2];
	int height = viewport[3];

	char *data = (char*)malloc((size_t)(width * height * 3)); // 3 components (R, G, B)

	if (!data)
		return 0;

	glPixelStorei(GL_PACK_ALIGNMENT, 1);
	glReadPixels(x, y, width, height, GL_RGB, GL_UNSIGNED_BYTE, data);

	stbi_flip_vertically_on_write(1);
#if EXPORT_PNG
	int saved = stbi_write_png(filename, width, height, 3, data, 0);
#else
	int saved = stbi_write_jpg(filename, width, height, 3, data, 90);
#endif

	free(data);

	return saved;
}

#define DR_WAV_IMPLEMENTATION
#include "dr_wav.h"

int writeWavBuffer(const char* fileName, float* soundBuffer, int sampleCount, int sampleRate, int channelCount)
{
	drwav_data_format format;
    format.container = drwav_container_riff;
	format.format = DR_WAVE_FORMAT_IEEE_FLOAT;
    format.channels = channelCount;
    format.sampleRate = sampleRate;
    format.bitsPerSample = 32;

	drwav_uint64 totalSampleCount = sampleCount * channelCount * 4;

	drwav wav;
	drwav_init_file_write_sequential(&wav, fileName, &format, totalSampleCount, NULL);
	
	drwav_uint64 framesWritten = drwav_write_raw(&wav, totalSampleCount, soundBuffer);

    drwav_uninit(&wav);

	return framesWritten>0;
}