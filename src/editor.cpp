#include "editor.h"
#include "stdio.h"
#include "windows.h"
#include "math.h"

using namespace Lev4k;

void Editor::beginFrame(const unsigned long time)
{
	lastFrameStart = time;
}

void Editor::endFrame(const unsigned long time)
{
	lastFrameStop = time;
}

unsigned long Editor::GetDeltaTime()
{
	return lastFrameStop - lastFrameStart;
}

void Editor::printFrameStatistics(int position)
{
	const int frameTime = lastFrameStop - lastFrameStart;

	// calculate average fps over 'windowSize' of frames
	float fps = 0.0f;
	float minfps = 3000.0f;
	float maxfps = 0.0f;
	for (int i = 0; i < windowSize - 1; ++i)
	{
		timeHistory[i] = timeHistory[i + 1];
		float cur = 1.0f / static_cast<float>(timeHistory[i]);
		if(cur<minfps) minfps=cur;
		if(cur>maxfps) maxfps=cur;
		fps += cur;
	}
	timeHistory[windowSize - 1] = frameTime;
	float cur = 1.0f / static_cast<float>(frameTime);
	if(cur<minfps) minfps=cur;
	if(cur>maxfps) maxfps=cur;
	fps += cur;
	fps *= 1000.0f / static_cast<float>(windowSize);
	minfps *= 1000.0f;
	maxfps *= 1000.0f;

	printf("(%3.2f s %3.2f fps - min: %3.2f max: %3.2f)\r", (position/44100.0f), fps, minfps, maxfps);
}

double Editor::handleTrackEvents(Lev4k::Song* track, double position)
{
	if (GetAsyncKeyState(VK_MENU))
	{
		double seek = 0.0;
		if (GetAsyncKeyState(VK_DOWN)) track->pause();
		if (GetAsyncKeyState(VK_UP))   track->play();
		if (GetAsyncKeyState(VK_SPACE))   track->seek(0);
		if (GetAsyncKeyState(VK_RIGHT) && !GetAsyncKeyState(VK_SHIFT)) seek += 1.0;
		if (GetAsyncKeyState(VK_LEFT) && !GetAsyncKeyState(VK_SHIFT)) seek -= 1.0;
		if (GetAsyncKeyState(VK_RIGHT) && GetAsyncKeyState(VK_SHIFT))  seek += 0.1;
		if (GetAsyncKeyState(VK_LEFT) && GetAsyncKeyState(VK_SHIFT))  seek -= 0.1;
		if (position + seek != position)
		{
			position += seek;
			track->seek(position);
		}
	}

	printf("time:%f ", position);

	return position;
}

void Editor::handleCameraEvents()
{
	if (!GetAsyncKeyState(VK_MENU))
	{
		POINT cursorPos;
		GetCursorPos(&cursorPos);
		if (GetFocus() != NULL) {
			if (GetAsyncKeyState(VK_LBUTTON)) {
				float offX = (cursorPos.x - lastCursorPos.x) * 0.003f;
				float offY = (cursorPos.y - lastCursorPos.y) * 0.003f;

				camRotX -= offX;
				camRotY = min(max(camRotY+offY,-1.57),1.57);

				camFowardX = -sin(camRotX) * cos(camRotY);
				camFowardY = -sin(camRotY);
				camFowardZ = -cos(camRotX) * cos(camRotY);

				camRightX = cos(camRotX);
				camRightZ = -sin(camRotX);
			}
		
			float speed = GetAsyncKeyState(VK_CONTROL) ? 1.0f : 0.1f;
			if (GetAsyncKeyState(VK_DOWN)) {
				camPosX += camFowardX * speed;
				camPosY += camFowardY * speed;
				camPosZ += camFowardZ * speed;
			}
			if (GetAsyncKeyState(VK_UP)) {
				camPosX -= camFowardX * speed;
				camPosY -= camFowardY * speed;
				camPosZ -= camFowardZ * speed;
			}
			if (GetAsyncKeyState(VK_LEFT)) {
				camPosX += camRightX * speed;
				camPosY += camRightY * speed;
				camPosZ += camRightZ * speed;
			}
			if (GetAsyncKeyState(VK_RIGHT)) {
				camPosX -= camRightX * speed;
				camPosY -= camRightY * speed;
				camPosZ -= camRightZ * speed;
			}
		}
		lastCursorPos = cursorPos;
	}

	printf("CamPos: %f %f %f CamRot: %f %f ", camPosX, camPosY, camPosZ, camRotX, camRotY);

}
