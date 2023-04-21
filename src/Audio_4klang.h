#ifdef EDITOR_CONTROLS
	DWORD musicoffset = 0;
	bool AudioNeedReset = false;
	#define AUDIO_OFFSET +musicoffset
#else
	#define AUDIO_OFFSET
#endif

__forceinline int AudioGetTime() {
	waveOutGetPosition(hWaveOut, &MMTime, sizeof(MMTIME));
	return MMTime.u.sample AUDIO_OFFSET;
}

__forceinline void AudioInit() {
	#if RECORD_SFX
		_4klang_render(lpSoundBuffer);
		writeWavBuffer("recording.wav", lpSoundBuffer, MAX_SAMPLES, SAMPLE_RATE, 2);
	#else
		CreateThread(0, 0, (LPTHREAD_START_ROUTINE)_4klang_render, lpSoundBuffer, 0, 0);
	#endif
	waveOutOpen(&hWaveOut, WAVE_MAPPER, &WaveFMT, NULL, 0, CALLBACK_NULL);
	waveOutPrepareHeader(hWaveOut, &WaveHDR, sizeof(WaveHDR));
	waveOutWrite(hWaveOut, &WaveHDR, sizeof(WaveHDR));
}

__forceinline void AudioUpdate() {

}