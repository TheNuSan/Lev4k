// custom build and feature flags
#ifdef DEBUG
	#define OPENGL_DEBUG        1
	#define FULLSCREEN          0
	#define DESPERATE           0
	#define BREAK_COMPATIBILITY 0
#else
	#define OPENGL_DEBUG        0
	#define FULLSCREEN          1
	#define DESPERATE           0
	#define BREAK_COMPATIBILITY 0
#endif

// ideas for future:
// - add timeline on top of shader, toggle visibility with a key, hade a "loop start/end" system you can adjust/activate and visible on the timeline

#define AUDIO_NONE	  0
#define AUDIO_4KLANG  1
#define AUDIO_SHAUDIO 2
#define AUDIO_WAVE	  3

#define AUDIO_TYPE AUDIO_SHAUDIO

#define EDITOR_RELEASE 0

#define RECORD_IMG   0
#define RECORD_IMG_LENGTH 145
#define RECORD_SFX   0
#define TIME_POST	 0

#if RECORD_IMG
#define AUDIO_TYPE AUDIO_NONE
#endif

#ifdef EDITOR_CONTROLS
	#define NOT_USE_MINIFIER 1
	#define EXE_SHOWSTEP 1
#else
	#define NOT_USE_MINIFIER 0
	#define EXE_SHOWSTEP 0
#endif
// MULTI_MAIN_LOCATION here is the position of the number in the main function define at the start of the shader
// this is needed to compile several shaders with only one source, just switching the target function
#define MULTI_MAIN_LOCATION 22

#include "definitions.h"
#if OPENGL_DEBUG
	#include "debug.h"
#endif

#include "glext.h"
#include "gldefs.h"
#define const
#include "shaders/fragment.inl"
#include "shaders/vert.inl"
#undef const

PID_QUALIFIER int pidMain;
PID_QUALIFIER int pidPart;
PID_QUALIFIER int pidPost;
PID_QUALIFIER int pidVert;

#define TIME_VAR_NAME "m"
#define PRETIME_VAR_NAME "pm"
int prevTime=0;

#if RECORD_IMG || RECORD_SFX
#include "export.h"
unsigned long RecordFrame = 0;
#endif

#if USE_MIDI
#include "MidiIn.h"
#endif

#if AUDIO_TYPE == AUDIO_4KLANG
#include "Audio_4klang.h"
#elif AUDIO_TYPE == AUDIO_SHAUDIO
#include "Audio_Shaudio.h"
#elif AUDIO_TYPE == AUDIO_WAVE
#include "Audio_Wave.h"
#else
#include "Audio_None.h"
#endif

#if USE_MIDI
void ShaderBindMidi(const int pid) {
	glUniform1fv(glGetUniformLocation(pid, "midiNotes"), MidiGetMaxNotes(), MidiGetNotes());
	glUniform1fv(glGetUniformLocation(pid, "midiControls"), MidiGetMaxControls(), MidiGetControls());
	glUniform3fv(glGetUniformLocation(pid, "midiLastNotes"), MidiGetMaxLastNotes(), MidiGetLastNotes());
}
#endif
	
#ifndef EDITOR_CONTROLS
void entrypoint(void)
#else
#include "editor.h"
int __cdecl main(int argc, char* argv[])
#endif
{
	// DPI awareness
	// will make a proper fullscreen when using windows display scaling feature
	// does not work properly when setting 720p output, why?
	//SetProcessDPIAware();

	// initialize window
	#if FULLSCREEN
		ChangeDisplaySettings(&screenSettings, CDS_FULLSCREEN);
		ShowCursor(0);
		const HDC hDC = GetDC(CreateWindow((LPCSTR)0xC018, 0, WS_POPUP | WS_VISIBLE, 0, 0, XRES, YRES, 0, 0, 0, 0));
	#else
		#ifdef EDITOR_CONTROLS
			HWND window = CreateWindow("static", 0, WS_POPUP | WS_VISIBLE, 0, 0, XRES, YRES, 0, 0, 0, 0);
			HDC hDC = GetDC(window);
		#else
			HDC hDC = GetDC(CreateWindow("static", 0, WS_POPUP | WS_VISIBLE, 0, 0, XRES, YRES, 0, 0, 0, 0));
		#endif
	#endif	

	#if USE_MIDI
		InitMidi(0);
	#endif

	// initalize opengl
	SetPixelFormat(hDC, ChoosePixelFormat(hDC, &pfd), &pfd);
	wglMakeCurrent(hDC, wglCreateContext(hDC));

	GLuint pipeline;
	glGenProgramPipelines(1, &pipeline);
	glBindProgramPipeline(pipeline);

	#if NOT_USE_MINIFIER
		refreshShaders(true);
	#else
		pidMain = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragment_frag);

		// switch shader main function
		fragment_frag[MULTI_MAIN_LOCATION] = '2';
		pidPart = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragment_frag);

		fragment_frag[MULTI_MAIN_LOCATION] = '3';
		pidPost = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragment_frag);

		#if AUDIO_TYPE == AUDIO_SHAUDIO
			fragment_frag[MULTI_MAIN_LOCATION] = '4';
			pidMusic = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragment_frag);
			#if SHAUDIO_REVERB
			fragment_frag[MULTI_MAIN_LOCATION] = '5';
			pidMusicReverb = glCreateShaderProgramv(GL_FRAGMENT_SHADER, 1, &fragment_frag);
			#endif
		#endif

		pidVert = glCreateShaderProgramv(GL_VERTEX_SHADER, 1, &vertex_vert);
	#endif

	glEnable(GL_PROGRAM_POINT_SIZE);
	glEnable(GL_BLEND);
	glBlendFunc(GL_ONE, GL_ONE);

	// TMP
	glEnable(GL_TEXTURE);
	glEnable(GL_TEXTURE0);
	
	glUseProgramStages(pipeline, GL_VERTEX_SHADER_BIT, pidVert);
	glUseProgramStages(pipeline, GL_FRAGMENT_SHADER_BIT, pidMain);

	GLuint fbopart[3];
	GLuint texturePart[3];
	
	glGenTextures(3, texturePart);
	glGenFramebuffers(3, fbopart);
	for (int i = 0; i < 3; ++i) {
		glBindFramebuffer(GL_FRAMEBUFFER, fbopart[i]);

		glBindTexture(GL_TEXTURE_2D, texturePart[i]);
		glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, XRES, YRES, 0, GL_LUMINANCE_ALPHA, GL_FLOAT, NULL);
		glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texturePart[i], 0);
	}
	//glFinish();
		
	// initialize editor
		
	#ifdef EDITOR_CONTROLS
		Lev4k::Editor editor = Lev4k::Editor();
	#endif

	// initialize sound
	
	
	AudioInit();
	
	// main loop
	do
	{
		#ifdef EDITOR_CONTROLS
			editor.beginFrame(timeGetTime());
		#endif

		#if !(DESPERATE)
			// do minimal message handling so windows doesn't kill your application
			// not always strictly necessary but increases compatibility a lot
			MSG msg;
			PeekMessage(&msg, 0, 0, 0, PM_REMOVE);
		#endif

		#ifdef EDITOR_CONTROLS
			refreshShaders(false);	
		#endif
			
		AudioUpdate();

		////////////////
		// SIMULATION //
		////////////////

		// render the particle position texture
		glBindFramebuffer(GL_FRAMEBUFFER, fbopart[0]);
		
		glUseProgram(pidPart);

		glActiveTexture(GL_TEXTURE0 + 0);
		glBindTexture(GL_TEXTURE_2D, fbopart[1]);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
		glUniform1i(glGetUniformLocation(pidPart, "sb1"), 0);

		glActiveTexture(GL_TEXTURE0 + 1);
		glBindTexture(GL_TEXTURE_2D, fbopart[2]);
		//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
		//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
		glUniform1i(glGetUniformLocation(pidPart, "sb2"), 1);

		glUniform1i(glGetUniformLocation(pidPart, PRETIME_VAR_NAME), prevTime);
		prevTime = AudioGetTime();
		glUniform1i(glGetUniformLocation(pidPart, TIME_VAR_NAME), prevTime);

		glClear(GL_COLOR_BUFFER_BIT);

		glRects(-1, -1, 1, 1);

		////////////////////////////
		// POINT SPRITE RENDERING //
		////////////////////////////

		glBindFramebuffer(GL_FRAMEBUFFER, fbopart[2]);
		
		//glUseProgram(pidMain);
		//glUniform1i(glGetUniformLocation(pidMain, TIME_VAR_NAME), AudioGetTime());

		// render the sprites
		#ifdef EDITOR_CONTROLS
			glUseProgramStages(pipeline, GL_VERTEX_SHADER_BIT, pidVert);
			glUseProgramStages(pipeline, GL_FRAGMENT_SHADER_BIT, pidMain);
		#endif

		glActiveTexture(GL_TEXTURE0 + 0);
		glBindTexture(GL_TEXTURE_2D, fbopart[0]);
		//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
		//glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
		//glUniform1i(glGetUniformLocation(pidMain, "sb1"), 0);
		glUniform1i(glGetUniformLocation(pidVert, "sb1"), 0);

		glUseProgram(0);
		
		//glColor3ui(AudioGetTime(), 0, 0);
		
		//glUseProgram(pidVert);
		//ShaderBindTime(pidVert);

		glClear(GL_COLOR_BUFFER_BIT);
				
		#ifdef EDITOR_CONTROLS
			glUniform3f(glGetUniformLocation(pidMain, "camPos"), editor.camPosX, editor.camPosY, editor.camPosZ);
			glUniform3f(glGetUniformLocation(pidMain, "camRot"), editor.camRotX, editor.camRotY, 0);
		#endif

		#if USE_MIDI
			ShaderBindMidi(pidMain);
		#endif

		//glRects(-1, -1, 1, 1);
		/*glBegin(GL_POINTS);
		glTexCoord1f(AudioGetTime());
		for (int i = 0; i < 1000000; ++i) {
			glVertex2s(i,i);
		}		
		glEnd();*/
		glTexCoord1f(AudioGetTime());
		//glDrawArrays(GL_POINTS, 0, 250000);
		glDrawArrays(GL_POINTS, 0, 500000);

		//////////////////
		// POST-PROCESS //
		//////////////////
		/*
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
		glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
		*/
		glBindFramebuffer(GL_FRAMEBUFFER, 0);


		glUseProgram(pidPost);
		glClear(GL_COLOR_BUFFER_BIT);

		glActiveTexture(GL_TEXTURE0 + 0);
		glBindTexture(GL_TEXTURE_2D, fbopart[2]);

		glUniform1i(glGetUniformLocation(pidPost, "sb1"), 0);
		glUniform1i(glGetUniformLocation(pidPost, TIME_VAR_NAME), AudioGetTime());

		glRects(-1, -1, 1, 1);

		// swap simulation buffers
		GLuint tmp = fbopart[0];
		fbopart[0] = fbopart[2];
		fbopart[2] = fbopart[1];
		fbopart[1] = tmp;

		//glFinish();

		SwapBuffers(hDC);

		#if RECORD_IMG
			glBindFramebuffer(GL_FRAMEBUFFER, 0);
			glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);

			saveScreenshot(RecordFrame);
			++RecordFrame;
		#endif

		// handle functionality of the editor
		#ifdef EDITOR_CONTROLS
			editor.endFrame(timeGetTime());
			editor.handleCameraEvents();
			#if AUDIO_TYPE == AUDIO_WAVE
				position = editor.handleTrackEvents(&track, position);
			#elif AUDIO_TYPE != AUDIO_NONE				
				waveOutGetPosition(hWaveOut, &MMTime, sizeof(MMTIME));
				int curtime = MMTime.u.sample + musicoffset;
				int newtime = curtime;

				#if RECORD_IMG
					printf("%i (%.1f)", RecordFrame, (RecordFrame * SAMPLE_RATE * 100.0f / 60) / MAX_SAMPLES);
				#else
					printf("time: %.1f ", curtime/44100.0);
				#endif

				static bool play = true;
				bool prevplay = play;
					
				if (GetAsyncKeyState(VK_MENU))
				{
					if (GetAsyncKeyState(VK_SPACE)) newtime = 0;
					if (GetAsyncKeyState(VK_DOWN)) play = false;
					if (GetAsyncKeyState(VK_UP)) play = true;
					if(GetAsyncKeyState(VK_SHIFT)) {
						if (GetAsyncKeyState(VK_RIGHT)) newtime += SAMPLE_RATE/10;
						if (GetAsyncKeyState(VK_LEFT)) newtime -= SAMPLE_RATE/10;
					} else {
						if (GetAsyncKeyState(VK_RIGHT)) newtime += SAMPLE_RATE;
						if (GetAsyncKeyState(VK_LEFT)) newtime -= SAMPLE_RATE;
					}
				}

				// looping at the end
				if(newtime >= MAX_SAMPLES) newtime = 0;
				// looping when rewinding past the begining
				if(newtime<0) newtime += MAX_SAMPLES;

				if(newtime != curtime || play != prevplay) {
					if(newtime<0) newtime = 0;
					if(newtime>=MAX_SAMPLES) newtime = MAX_SAMPLES-1;
						
					musicoffset = newtime;

					waveOutReset(hWaveOut);
					waveOutUnprepareHeader(hWaveOut,&WaveHDR,sizeof(WAVEHDR));

					if(play) {
						SAMPLE_TYPE* buf = lpSoundBuffer;
						buf += newtime*2;
						WaveHDR.lpData=(LPSTR)(buf);
						WaveHDR.dwBufferLength=(MAX_SAMPLES - newtime) * sizeof(SAMPLE_TYPE) * 2;
	
						waveOutPrepareHeader(hWaveOut,&WaveHDR,sizeof(WAVEHDR));
						waveOutWrite(hWaveOut,&WaveHDR,sizeof(WAVEHDR));
					}
				}
			#endif
			editor.printFrameStatistics(AudioGetTime());

			#if USE_MIDI
				// output values on console
				for (int i = 1; i < MidiGetMaxControls(); ++i) {
					printf("%.2f|", MidiGetControls()[i]);
					if (i == 4) printf("\n");
				}
				printf("\n\n");
				MidiTickTime(float(curtime)/SAMPLE_RATE);
			#endif
		#endif

	} while(!GetAsyncKeyState(VK_ESCAPE)
		#if RECORD_IMG
			&& RecordFrame < RECORD_IMG_LENGTH * 60
		#elif AUDIO_TYPE != AUDIO_NONE
			#ifndef EDITOR_CONTROLS
				&& MMTime.u.sample < MAX_SAMPLES
			#endif
		#endif
	);

	#if USE_MIDI
		StopMidi();
	#endif

	ExitProcess(0);
}
