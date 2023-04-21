#pragma once

int saveScreenshot(unsigned long time);
int writeWavBuffer(const char* fileName, float* soundBuffer, int sampleCount, int sampleRate, int channelCount);