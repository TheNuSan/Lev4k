// some useful song defines for Shaudio (based on 4klang for now)
#define SAMPLE_RATE 44100
#define SONG_DURATION 145
#define SHAUDIO_XRES 1920
#define SHAUDIO_YRES 3334 // this need to be at least above SAMPLE_RATE*SONG_DURATION/SHAUDIO_XRES
#define MAX_SAMPLES (SAMPLE_RATE*SONG_DURATION)
#define FLOAT_32BIT
#define SAMPLE_TYPE float