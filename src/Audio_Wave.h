#ifdef EDITOR_CONTROLS
double position = 0.0;
#else
#define AUDIO_OFFSET
#endif

__forceinline int AudioGetTime() {
	return (int)(position*44100.0);
}

__forceinline void AudioInit() {
	// absolute path always works here
	// relative path works only when not ran from visual studio directly
	Lev4k::Song track(L"audio.wav");
	track.play();
}

__forceinline void AudioUpdate() {
	position = track.getTime();
}