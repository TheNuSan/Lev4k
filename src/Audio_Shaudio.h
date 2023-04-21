#define SHAUDIO_REVERB 0
#define SHAUDIO_REALTIME 0
#define SHAUDIO_UPDATEONSAVE 1

#ifdef EDITOR_CONTROLS
	DWORD musicoffset = 0;
	bool AudioNeedReset = true;
	#define AUDIO_OFFSET +musicoffset
#else
	#define AUDIO_OFFSET
#endif

PID_QUALIFIER int pidMusic;
#if SHAUDIO_REVERB
PID_QUALIFIER int pidMusicReverb;
#endif

#if SHAUDIO_REVERB
GLuint textureMusic[2];
#else
GLuint textureMusic[1];
#endif
unsigned int fbomusic;

__forceinline void RenderMusic() {

	glBindFramebuffer(GL_FRAMEBUFFER, fbomusic);

	glBindTexture(GL_TEXTURE_2D, textureMusic[0]);
	// Use luminance alpha as texture format so that we have only two channel, like we need for audio
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SHAUDIO_XRES, SHAUDIO_YRES, 0, GL_LUMINANCE_ALPHA, GL_FLOAT, NULL);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureMusic[0], 0);


	// Need to setup a larger viewport than the window so that music can be longer than 1920x1080 samples
	glViewport(0, 0, SHAUDIO_XRES, SHAUDIO_YRES);

#if EDITOR_CONTROLS
	glClear(GL_COLOR_BUFFER_BIT);
#endif

	glUseProgram(pidMusic);

#if USE_MIDI
	ShaderBindMidi(pidMusic);
#endif

	glRects(-1, -1, 1, 1);

#if SHAUDIO_REVERB

	glBindTexture(GL_TEXTURE_2D, textureMusic[1]);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SHAUDIO_XRES, SHAUDIO_YRES, 0, GL_LUMINANCE_ALPHA, GL_FLOAT, NULL);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureMusic[1], 0);

	//glActiveTexture(GL_TEXTURE0);

	glBindTexture(GL_TEXTURE_2D, textureMusic[0]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

	glUseProgram(pidMusicReverb);
#if !OPTI_TEXTURE_ORDER
	glUniform1i(glGetUniformLocation(pidMusicReverb, VAR_SB1), 0);
#else
	glUniform1i(0, 0);
#endif

	//ShaderBindTime(pidMusicReverb);

	glRects(-1, -1, 1, 1);

#endif

	//glPixelStorei(GL_PACK_ALIGNMENT, 1);
	glReadPixels(0, 0, SHAUDIO_XRES, SHAUDIO_YRES, GL_LUMINANCE_ALPHA, GL_FLOAT, &lpSoundBuffer);

	//glBindFramebuffer(GL_FRAMEBUFFER, 0);

	// not absolutly required, cost about 5 bytes
	glViewport(0,0,XRES,YRES);
}

#if SHAUDIO_REALTIME

__forceinline void RenderMusicChunk() {

	waveOutGetPosition(hWaveOut, &MMTime, sizeof(MMTIME));
	int CurrentPos = MMTime.u.sample AUDIO_OFFSET;

	glBindFramebuffer(GL_FRAMEBUFFER, fbomusic);

	glBindTexture(GL_TEXTURE_2D, textureMusic[0]);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SHAUDIO_XRES, SHAUDIO_YRES, 0, GL_LUMINANCE_ALPHA, GL_FLOAT, NULL);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureMusic[0], 0);

	// Need to setup a larger viewport than the window so that music can be longer than 1920x1080 samples
	glViewport(0, 0, SHAUDIO_XRES, SHAUDIO_YRES);

	glUseProgram(pidMusic);

#if USE_MIDI
	ShaderBindMidi(pidMusic);
#endif

	static const int CacheLines = 5;
	int CurrentLine = CurrentPos / SHAUDIO_XRES;
	float factor = 1.0f / SHAUDIO_YRES;
	float CurrentHeight = CurrentLine * factor * 2.0f - 1.0f;
	float EndHeight = (CurrentLine + CacheLines) * factor * 2.0f - 1.0f;

	glRectf(-1, CurrentHeight - .05, 1, EndHeight);

#if SHAUDIO_REVERB

	glBindTexture(GL_TEXTURE_2D, textureMusic[1]);
	glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, SHAUDIO_XRES, SHAUDIO_YRES, 0, GL_LUMINANCE_ALPHA, GL_FLOAT, NULL);
	glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, textureMusic[1], 0);

	//glActiveTexture(GL_TEXTURE0);

	glBindTexture(GL_TEXTURE_2D, textureMusic[0]);
	glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

	glUseProgram(pidMusicReverb);

#if USE_MIDI
	ShaderBindMidi(pidMusicReverb);
#endif

#if !OPTI_TEXTURE_ORDER
	glUniform1i(glGetUniformLocation(pidMusicReverb, VAR_SB1), 0);
#else
	glUniform1i(0, 0);
#endif

	//ShaderBindTime(pidMusicReverb);

	//glRects(-1, -1, 1, 1);
	//glRectf(-1, CurrentHeight, 1, EndHeight);
	glRectf(-1, CurrentHeight, 1, EndHeight);

#endif

	static SAMPLE_TYPE tmpBuffer[SHAUDIO_XRES * CacheLines * 2];
	glReadPixels(0, CurrentLine, SHAUDIO_XRES, CacheLines, GL_LUMINANCE_ALPHA, GL_FLOAT, &tmpBuffer);

	int BaseOffset = SHAUDIO_XRES * CurrentLine;
	// avoid going over the end of the array ?
	int MaxCacheLines = max(0, min(CurrentLine + CacheLines, SHAUDIO_YRES) - CurrentLine);
	int cpySize = SHAUDIO_XRES * MaxCacheLines * 2 * sizeof(SAMPLE_TYPE);
	memcpy(lpSoundBuffer + BaseOffset * 2, tmpBuffer, cpySize);
	/*
	if (BaseOffset + SHAUDIO_XRES * CacheLines < SHAUDIO_XRES * SHAUDIO_YRES) {
		for (int i = 0; i < SHAUDIO_XRES * CacheLines; ++i) {
			lpSoundBuffer[i * 2 + BaseOffset * 2] = tmpBuffer[i * 2];
			lpSoundBuffer[i * 2 + BaseOffset * 2 + 1] = tmpBuffer[i * 2 + 1];
		}
	}
	*/

	glBindFramebuffer(GL_FRAMEBUFFER, 0);

	// not absolutly required, cost about 5 bytes
	//glViewport(0,0,XRES,YRES);
}
#endif

__forceinline int AudioGetTime() {
	waveOutGetPosition(hWaveOut, &MMTime, sizeof(MMTIME));
	return MMTime.u.sample AUDIO_OFFSET;
}

__forceinline void AudioInit() {
	// For now, we do something completly separate from main render
	// maybe we can even avoid fbo and use bytes instead of float

	#if SHAUDIO_REVERB
		glGenTextures(2, textureMusic);
	#else
		glGenTextures(1, textureMusic);
	#endif
	glGenFramebuffers(1, &fbomusic);

	RenderMusic();

	#ifdef EDITOR_CONTROLS

		#if RECORD_SFX
			writeWavBuffer("recording.wav", lpSoundBuffer, MAX_SAMPLES, SAMPLE_RATE, 2);
		#endif

		AudioNeedReset = false;
	#endif

	waveOutOpen(&hWaveOut, WAVE_MAPPER, &WaveFMT, NULL, 0, CALLBACK_NULL);
	waveOutPrepareHeader(hWaveOut, &WaveHDR, sizeof(WaveHDR));
	waveOutWrite(hWaveOut, &WaveHDR, sizeof(WaveHDR));
}

__forceinline void AudioUpdate() {
	#ifdef EDITOR_CONTROLS
		if (AudioNeedReset) {
			AudioNeedReset = false;
			#if SHAUDIO_UPDATEONSAVE
				RenderMusic();
			#endif
		}
		#if SHAUDIO_REALTIME
			RenderMusicChunk();
		#endif
	#endif
}