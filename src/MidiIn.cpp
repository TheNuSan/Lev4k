
#include <SDKDDKVer.h>
#include <Windows.h>

#include <stdio.h>
#include <conio.h>

#include <mmsystem.h>
#pragma comment(lib, "winmm.lib")

namespace midi
{
	const unsigned char ACTIVE_SENSING = 0xFE; // Status byte for Active Sensing message
	const unsigned char CHANNEL_PRESSURE = 0xD0; // Command value for Channel Pressure (Aftertouch)
	const unsigned char CONTINUE = 0xFB; // Status byte for Continue message
	const unsigned char CONTROL_CHANGE = 0xB0; // Command value for Control Change message
	const unsigned char SYSTEM_EXCLUSIVE = 0xF0; // Status byte for System Exclusive message
	const unsigned char END_OF_EXCLUSIVE = 0xF7; // Status byte for End of System Exclusive message
	const unsigned char MIDI_TIME_CODE = 0xF1; // Status byte for MIDI Time Code Quarter Fram message
	const unsigned char NOTE_OFF = 0x80; // Command value for Note Off message
	const unsigned char NOTE_ON = 0x90; // Command value for Note On message
	const unsigned char PITCH_BEND = 0xE0; // Command value for Pitch Bend message
	const unsigned char POLY_PRESSURE = 0xA0; // Command value for Polyphonic Key Pressure (Aftertouch)
	const unsigned char PROGRAM_CHANGE = 0xC0; // Command value for Program Change message
	const unsigned char SONG_POSITION_POINTER = 0xF2; // Status byte for Song Position Pointer message
	const unsigned char SONG_SELECT = 0xF3; // Status byte for MIDI Song Select message
	const unsigned char START = 0xFA; // Status byte for Start message
	const unsigned char STOP = 0xFC; // Status byte for Stop message
	const unsigned char SYSTEM_RESET = 0xFF; // Status byte for System Reset message
	const unsigned char TIMING_CLOCK = 0xF8; // Status byte for Timing Clock message
	const unsigned char TUNE_REQUEST = 0xF6; // Status byte for Tune Request message
	const unsigned char SHORT_MSG_MASK = 15; // For unpacking and packing short messages
	const unsigned char SHORT_MSG_SHIFT = 8;
}

void PrintMidiDevices()
{
	UINT nMidiDeviceNum;
	MIDIINCAPS caps;

	nMidiDeviceNum = midiInGetNumDevs();
	if (nMidiDeviceNum == 0) {
		printf("No midi device detected\n");
		return;
	}

	printf("== PrintMidiDevices() == \n");
	for (unsigned int i = 0; i < nMidiDeviceNum; ++i) {
		midiInGetDevCaps(i, &caps, sizeof(MIDIINCAPS));
		//printf("\t%d : name = %s\n", i, caps.szPname);
		printf("Midi device %u = %s\n", i, caps.szPname);
	}
	printf("=====\n");
}

struct NoteRegister {
	unsigned char Note = 0;
	unsigned char Vel = 0;
	float Time = 0;
};

struct MidiReceiver {
	static const unsigned char NotesMaxCount = 128;
	static const unsigned char ControlsMaxCount = 9;
	static const unsigned char LastNotesCount = 10;
	float Notes[NotesMaxCount];
	float Controls[ControlsMaxCount];
	
	float CurrentTime = 0.0f;
	
	NoteRegister LastNotes[LastNotesCount];
	float LastNotesTmpArray[LastNotesCount * 3];

	void Init() {
		for (int i = 0; i < NotesMaxCount; ++i) {
			Notes[i] = 0.0f;
		}
		for (int i = 0; i < ControlsMaxCount; ++i) {
			Controls[i] = 0.0f;
		}
	}
};

MidiReceiver GlobalMidiReceiver;

unsigned int MidiGetMaxNotes() {
	return MidiReceiver::NotesMaxCount;
}

unsigned int MidiGetMaxControls() {
	return MidiReceiver::ControlsMaxCount;
}

unsigned int MidiGetMaxLastNotes() {
	return MidiReceiver::LastNotesCount * 3;
}

float* MidiGetNotes() {
	return GlobalMidiReceiver.Notes;
}

float* MidiGetControls() {
	return GlobalMidiReceiver.Controls;
}

float* MidiGetLastNotes() {
	for (unsigned int i = 0; i < MidiReceiver::LastNotesCount; i++) {
		GlobalMidiReceiver.LastNotesTmpArray[i * 3 + 0] = GlobalMidiReceiver.LastNotes[i].Note;
		GlobalMidiReceiver.LastNotesTmpArray[i * 3 + 1] = GlobalMidiReceiver.LastNotes[i].Vel;
		GlobalMidiReceiver.LastNotesTmpArray[i * 3 + 2] = GlobalMidiReceiver.LastNotes[i].Time;
	}
	return GlobalMidiReceiver.LastNotesTmpArray;
}

void ReceiveNote(unsigned char Note, unsigned char Velocity) {
	printf(" key: %u vel: %u", Note, Velocity);

	if (Note >= MidiReceiver::NotesMaxCount) {
		return;
	}
	GlobalMidiReceiver.Notes[Note] = Velocity/127.0f;

	if (Velocity > 0) {
		// offset existing notes
		for (unsigned int i = MidiReceiver::LastNotesCount-1; i >= 1; --i) {
			GlobalMidiReceiver.LastNotes[i] = GlobalMidiReceiver.LastNotes[i - 1];
		}
		// insert new note
		GlobalMidiReceiver.LastNotes[0].Note = Note;
		GlobalMidiReceiver.LastNotes[0].Vel = Velocity;
		GlobalMidiReceiver.LastNotes[0].Time = GlobalMidiReceiver.CurrentTime;
	}
}

void ReceiveControl(unsigned char ControlNum, unsigned char Value) {
	//printf(" num: %u val: %u", ControlNum, Value);

	if (ControlNum >= MidiReceiver::ControlsMaxCount) {
		return;
	}
	GlobalMidiReceiver.Controls[ControlNum] = Value / 127.0f;
}

void CALLBACK MidiInProc(HMIDIIN hMidiIn, UINT wMsg, DWORD dwInstance, DWORD dwParam1, DWORD dwParam2)
{
	switch (wMsg) {
	case MIM_OPEN:
		printf("wMsg=MIM_OPEN\n");
		break;
	case MIM_CLOSE:
		printf("wMsg=MIM_CLOSE\n");
		break;
	case MIM_DATA:
	{
		//printf("wMsg=MIM_DATA, dwInstance=%08x, dwParam1=%08x, dwParam2=%08x\n", dwInstance, dwParam1, dwParam2);
		// dwInstance = user data forwarded by caller
		// dwParam1 = MIDI message
		// dwParam2 = TimeStamp
		unsigned char Command = static_cast<unsigned char>(dwParam1 & ~midi::SHORT_MSG_MASK);
		unsigned char Channel = static_cast<unsigned char>(dwParam1 & midi::SHORT_MSG_MASK);
		unsigned char DataByte1 = static_cast<unsigned char>(dwParam1 >> midi::SHORT_MSG_SHIFT);
		unsigned char DataByte2 = static_cast<unsigned char>(dwParam1 >> midi::SHORT_MSG_SHIFT * 2);

		bool IsNote = false;
		switch (Command) {
		case midi::NOTE_ON:
			printf("Note On  ");
			ReceiveNote(DataByte1, DataByte2);
			IsNote = true;
			printf("\n\n");
			break;
		case midi::NOTE_OFF:
			printf("Note Off ");
			ReceiveNote(DataByte1, 0);
			IsNote = true;
			printf("\n\n");
			break;
		case midi::CONTROL_CHANGE:
			//printf("Control Change  ");
			ReceiveControl(DataByte1, DataByte2);
			break;
		default:
			printf("Unknown data\n\n");
			break;
		}
	}
	break;
	case MIM_LONGDATA:
		printf("wMsg=MIM_LONGDATA\n");
		break;
	case MIM_ERROR:
		printf("wMsg=MIM_ERROR\n");
		break;
	case MIM_LONGERROR:
		printf("wMsg=MIM_LONGERROR\n");
		break;
	case MIM_MOREDATA:
		printf("wMsg=MIM_MOREDATA\n");
		break;
	default:
		printf("wMsg = unknown\n");
		break;
	}
	return;
}

HMIDIIN hMidiDevice = NULL;

void InitMidi(int MidiDeviceIndex)
{
	printf("Init Midi:\n");

	DWORD nMidiPort = 0;
	UINT nMidiDeviceNum;
	MMRESULT rv;

	//PrintMidiDevices();

	nMidiDeviceNum = midiInGetNumDevs();
	if (nMidiDeviceNum == 0) {
		//fprintf(stderr, "midiInGetNumDevs() return 0...");
		printf("No midi device detected\n");
		return;
	}

	if (MidiDeviceIndex >= nMidiDeviceNum) {
		//fprintf(stderr, "midiInGetNumDevs() return 0...");
		printf("Midi Device %i is out of range\n", MidiDeviceIndex);
		return;
	}
	
	GlobalMidiReceiver.Init();

	rv = midiInOpen(&hMidiDevice, nMidiPort, (DWORD)(void*)MidiInProc, MidiDeviceIndex, CALLBACK_FUNCTION);
	if (rv != MMSYSERR_NOERROR) {
		printf("Failed to open midi device %i\n", MidiDeviceIndex);
		//fprintf(stderr, "midiInOpen() failed...rv=%d", rv);
		return;
	}

	midiInStart(hMidiDevice);
	
}

void StopMidi() {
	midiInStop(hMidiDevice);
	midiInClose(hMidiDevice);
	hMidiDevice = NULL;
}

void MidiTickTime(float curTime)
{
	GlobalMidiReceiver.CurrentTime = curTime;
}