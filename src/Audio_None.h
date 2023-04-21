
double position = 0.0;
#define AUDIO_OFFSET

__forceinline int AudioGetTime() {
	return (int)(position*44100.0);
}

__forceinline void AudioInit() {
}

__forceinline void AudioUpdate() {
	position += 1.0f / 60.0f;
}