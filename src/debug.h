// This header contains some useful functions for debugging OpenGL.
// Remember to disable them when building your final releases.

#include <windows.h>
#include <GL/gl.h>
#include "glext.h"
#include "gldefs.h"
#include "timeapi.h"

static GLchar* getErrorString(GLenum errorCode)
{
	if (errorCode == GL_NO_ERROR) {
		return (GLchar*) "No error";
	}
	else if (errorCode == GL_INVALID_VALUE) {
		return (GLchar*) "Invalid value";
	}
	else if (errorCode == GL_INVALID_ENUM) {
		return (GLchar*) "Invalid enum";
	}
	else if (errorCode == GL_INVALID_OPERATION) {
		return (GLchar*) "Invalid operation";
	}
	else if (errorCode == GL_STACK_OVERFLOW) {
		return (GLchar*) "Stack overflow";
	}
	else if (errorCode == GL_STACK_UNDERFLOW) {
		return (GLchar*) "Stack underflow";
	}
	else if (errorCode == GL_OUT_OF_MEMORY) {
		return (GLchar*) "Out of memory";
	}
	return (GLchar*) "Unknown";
}

static void assertGlError(const char* error_message)
{
	const GLenum ErrorValue = glGetError();
	if (ErrorValue == GL_NO_ERROR) return;

	const char* APPEND_DETAIL_STRING = ": %s\n";
	const size_t APPEND_LENGTH = strlen(APPEND_DETAIL_STRING) + 1;
	const size_t message_length = strlen(error_message);
	MessageBox(NULL, error_message, getErrorString(ErrorValue), 0x00000000L);
	ExitProcess(0);
}

static bool shaderDebug(const char* shader, GLenum type, bool kill_on_failure = true, const char* filename = "")
{
	if (!shader) return false;

	// try and compile the shader 
	int result;
	const int debugid = glCreateShader(type);
	glShaderSource(debugid, 1, &shader, 0);
	glCompileShader(debugid);
	
	// get compile result
	glGetShaderiv(debugid, GL_COMPILE_STATUS, &result);
	if(result == GL_FALSE)
	{	
		// display compile log on failure
		char info[2048];
		glGetShaderInfoLog(debugid, 2047, NULL, (char*)info);
		MessageBox(NULL, info, filename, 0x00000000L);
		if(kill_on_failure)
		{
			ExitProcess(0);
		}
		else
		{
			return false;
		}
	}
	else
	{
		glDeleteShader(debugid);
		return true;
	}
}

#define STRINGIFY2(x) #x // Thanks sooda!
#define STRINGIFY(x) STRINGIFY2(x)
#define CHECK_ERRORS() assertGlError(STRINGIFY(__LINE__))

#ifdef EDITOR_CONTROLS
	#include <stdlib.h>
	#include <stdio.h>

	static int start;
	static unsigned long long lastLoad;

	char* updateShader(const char* filename)
	{
		FILE* file = fopen(filename, "rb");
		if(!file) {
			return NULL;
		}
		fseek(file, 0, SEEK_END);
		long inputSize = ftell(file);
		rewind(file);
		char* shaderString = static_cast<char*>(calloc(inputSize+1, sizeof(char)));
		fread(shaderString, sizeof(char), inputSize, file);
		fclose(file);

		// just to be sure...
		shaderString[inputSize] = '\0';
		return shaderString;
	}
	
	void refreshShaders(bool force)
	{
		if (force || (GetAsyncKeyState(VK_CONTROL) && GetAsyncKeyState('S')))
		{
			// make sure the file has finished writing to disk
			if(timeGetTime() - lastLoad > 200) {
				Sleep(100);
#if EDITOR_RELEASE
				char* newSource = updateShader("./fragment.frag");
#else
			#if DEBUG_USE_MINIFIEDSHADER
				extern char* fragment_frag;
				size_t shadlen = strlen(fragment_frag);
				char* newSource = static_cast<char*>(calloc(shadlen + 2, sizeof(char)));
				// for some reason, the source loaded from file is offset by 1 compare to the raw string
				newSource[0] = ' ';
				for (int i = 0; i < shadlen; ++i) {
					newSource[i + 1] = fragment_frag[i];
				}
				newSource[shadlen + 1] = '\0';
			#else
				char* newSource = updateShader("./src/shaders/fragment.frag");
			#endif
#endif
				if (!newSource) return;

				//bool ShaderCompiled = 
				shaderDebug(newSource, GL_FRAGMENT_SHADER, false, "fragment.frag m1");
				extern int pidMain;
				pidMain = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &newSource);
				//free(newSource);
								
				newSource[MULTI_MAIN_LOCATION + 1] = '2';
				extern int pidPost;
				pidPost = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &newSource);

				#if AUDIO_TYPE == AUDIO_SHAUDIO
					newSource[MULTI_MAIN_LOCATION+1] = '3';
					//shaderDebug(newSource, false, "fragment.frag m3");
					extern int pidMusic;
					pidMusic = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &newSource);

					#if SHAUDIO_REVERB
						newSource[MULTI_MAIN_LOCATION+1] = '4';
						//shaderDebug(newSource, false, "fragment.frag m4");
						extern int pidMusicReverb;
						pidMusicReverb = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &newSource);
					#endif
				#endif

				free(newSource);
				
				#if AUDIO_TYPE == AUDIO_SHAUDIO
					//if (ShaderCompiled) {
						extern bool AudioNeedReset;
						AudioNeedReset = true;
					//}
				#endif
						
				lastLoad = timeGetTime() - start;
			}
		}
	}
#endif