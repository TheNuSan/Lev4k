#ifdef EDITOR_CONTROLS
	DWORD musicoffset = 0;
	bool AudioNeedReset = false;
	#define AUDIO_OFFSET +musicoffset
#else
	#define AUDIO_OFFSET
#endif

#include "Oidos/oidos.h"

__forceinline int AudioGetTime() {
	return int(double((Oidos_GetPosition()) * 44100.0 / Oidos_TicksPerSecond));
}

__forceinline void AudioInit() {
	Oidos_FillRandomData();
	Oidos_GenerateMusic();
	Oidos_StartMusic();
}

__forceinline void AudioUpdate() {

}