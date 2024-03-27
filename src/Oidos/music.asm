; Music converted from music.xrns 2024-03-27 16:11:56

%define MUSIC_LENGTH 512
%define TOTAL_SAMPLES 6291456
%define MAX_TOTAL_INSTRUMENT_SAMPLES 4521984

%define SAMPLES_PER_TICK 11025
%define TICKS_PER_SECOND 4.000000000

%define NUM_TRACKS_WITH_REVERB 0
%define NUM_TRACKS_WITHOUT_REVERB 5


	section iparam data align=4

_InstrumentParams:
.i00:
	; 00|SFX eerie
	dd	36,18,48,42,0x3DC00000,0x3F680000,0xBF800000,0xC0200000,0x3C000000,0xC4000000,0xC2000000,0x40000000,0xBD000000,0xB9000000,0xB9000000,0x42000000,1114112,0xB8000000,0x38000000,0x47B00000
.i01:
	; 01|SFX water
	dd	1,52,28,46,0xBDC00000,0x3F800000,0x3F800000,0xBF800000,0x40800000,0xC0000000,0x40000000,0x40000000,0xBA000000,0x3A000000,0x3A000000,0x3F000000,393216,0xB8000000,0x38000000,0x46300000
.i02:
	; 02|Pad cutter
	dd	18,30,87,52,0x3D800000,0x3F600000,0x3F800000,0x3F800000,0x3EC00000,0xC0000000,0xC1800000,0x00000000,0xBC800000,0x38800000,0x38800000,0x41000000,262144,0xB8000000,0x38000000,0x46B00000
.i03:
	; 03|Disharmony
	dd	3,1,16,18,0x00000000,0x3F800000,0xBF000000,0x3F800000,0x42A00000,0xC0000000,0x42000000,0x00000000,0xBC800000,0x30000000,0x30000000,0x42000000,65536,0xBA000000,0x39000000,0x44B00000
.i04:
	; 04|Reverse cymbal
	dd	77,28,4,28,0x00000000,0x3F800000,0x3F000000,0xBF000000,0x42800000,0x42B00000,0x40000000,0x3D200000,0x00000000,0x00000000,0x00000000,0x40000000,262144,0xB8000000,0x38000000,0x45800000



	section itones data align=1

_InstrumentTones:
.i00:
	; 00|SFX eerie
	db	19,5,12,12,-127
.i01:
	; 01|SFX water
	db	48,12,12,-128
.i02:
	; 02|Pad cutter
	db	12,-128
.i03:
	; 03|Disharmony
	db	48,-128
.i04:
	; 04|Reverse cymbal
	db	24,12,-128


	section trdata data align=1

_TrackData:
.t_SFXeerie_1:
	; SFX eerie, column 1
	db	16,0,1,1,1,-128
.t_SFXeerie2_1:
	; SFX eerie 2, column 1
	db	0,2,1,1,1,-128
.t_SFXwater_1:
	; SFX water, column 1
	db	0,0,1,1,1,1,1,-128
.t_Padcutter_1:
	; Pad cutter, column 1
	db	16,0,1,-128
.t_Disharmony_1:
	; Disharmony, column 1
	db	1,0,1,-128
.t_Reversecymbal_1:
	; Reverse cymbal, column 1
	db	0,0,1,1,1,-128

	section notelen data align=1

_NoteLengths:
	; SFX eerie, column 1
L_SFXeerie_1:
	; Position 0, pattern 0
	db	16,16,16,80
	; Position 2, pattern 2
	db	16,16,16,32
	; Position 3, pattern 3
	db	64
	; Position 4, pattern 3
	db	64
	; Position 5, pattern 5
	db	16,16,80
	; Position 7, pattern 7
	db	16
	db	0

	; SFX eerie 2, column 1
L_SFXeerie2_1:
	db	64
	; Position 1, pattern 1
	db	64
	; Position 2, pattern 2
	db	64
	; Position 3, pattern 3
	db	64
	; Position 4, pattern 3
	db	64
	; Position 5, pattern 5
	db	64
	; Position 6, pattern 6
	db	96
	; Position 7, pattern 7
	db	0

	; SFX water, column 1
L_SFXwater_1:
	db	-1,196
	; Position 3, pattern 3
	db	16,16,32
	; Position 4, pattern 3
	db	16,16,28
	; Position 5, pattern 5
	db	64
	; Position 6, pattern 6
	db	32
	db	0

	; Pad cutter, column 1
L_Padcutter_1:
	db	-1,192
	; Position 3, pattern 3
	db	64
	; Position 4, pattern 3
	db	0

	; Disharmony, column 1
L_Disharmony_1:
	db	64
	; Position 1, pattern 1
	db	32,32
	; Position 2, pattern 2
	db	32,32
	; Position 3, pattern 3
	db	32,32
	; Position 4, pattern 3
	db	32,32
	; Position 5, pattern 5
	db	32,32
	; Position 6, pattern 6
	db	32,32
	; Position 7, pattern 7
	db	0

	; Reverse cymbal, column 1
L_Reversecymbal_1:
	db	80
	; Position 1, pattern 1
	db	4,28,8,24
	; Position 2, pattern 2
	db	4,12,4,44
	; Position 3, pattern 3
	db	4,4,20,4,4,28
	; Position 4, pattern 3
	db	4,4,20,4,4,28
	; Position 5, pattern 5
	db	4,4,20,4,4,36
	; Position 6, pattern 6
	db	20,20
	; Position 7, pattern 7
	db	20
	db	0


	section notesamp data align=1

_NoteSamples:
	; SFX eerie, column 1
S_SFXeerie_1:
	; Position 0, pattern 0
	db	2,1,2,1
	; Position 2, pattern 2
	db	2,1,2,1
	; Position 3, pattern 3
	db	1
	; Position 4, pattern 3
	db	1
	; Position 5, pattern 5
	db	1,2,2
	; Position 7, pattern 7
	db	2,1

	; SFX eerie 2, column 1
S_SFXeerie2_1:
	db	0
	; Position 1, pattern 1
	db	1
	; Position 2, pattern 2
	db	2
	; Position 3, pattern 3
	db	2
	; Position 4, pattern 3
	db	2
	; Position 5, pattern 5
	db	1
	; Position 6, pattern 6
	db	2
	; Position 7, pattern 7
	db	0

	; SFX water, column 1
S_SFXwater_1:
	db	0
	; Position 3, pattern 3
	db	2,0,1
	; Position 4, pattern 3
	db	2,0,1
	; Position 5, pattern 5
	db	0
	; Position 6, pattern 6
	db	3,0

	; Pad cutter, column 1
S_Padcutter_1:
	db	0
	; Position 3, pattern 3
	db	1
	; Position 4, pattern 3
	db	1

	; Disharmony, column 1
S_Disharmony_1:
	db	0
	; Position 1, pattern 1
	db	1,1
	; Position 2, pattern 2
	db	1,1
	; Position 3, pattern 3
	db	1,1
	; Position 4, pattern 3
	db	1,1
	; Position 5, pattern 5
	db	1,1
	; Position 6, pattern 6
	db	1,1
	; Position 7, pattern 7
	db	1

	; Reverse cymbal, column 1
S_Reversecymbal_1:
	db	0
	; Position 1, pattern 1
	db	1,0,2,0
	; Position 2, pattern 2
	db	1,0,1,0
	; Position 3, pattern 3
	db	1,0,2,0,1,0
	; Position 4, pattern 3
	db	1,0,2,0,1,0
	; Position 5, pattern 5
	db	1,0,2,0,1,0
	; Position 6, pattern 6
	db	2,0
	; Position 7, pattern 7
	db	2,0

