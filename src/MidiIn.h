#pragma once

void InitMidi(int MidiDeviceIndex);
void StopMidi();
float* MidiGetNotes();
float* MidiGetControls();
float* MidiGetLastNotes();
unsigned int MidiGetMaxNotes();
unsigned int MidiGetMaxControls();
unsigned int MidiGetMaxLastNotes();
void MidiTickTime(float curTime);
