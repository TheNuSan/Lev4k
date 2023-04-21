# Lev4k
A 4 kilobyte intro based on Leviathan 2.0 but with added/tweaked features, original is here, you should probably use it instead, it's great: https://github.com/armak/Leviathan-2.0

Warning: this tool is not stable but made to be hacked around while making each intro
It has been used for all my 4k intros, but this is a fresh start so you will only find my latest intro (in a branch):
- Primordial Awakening (Revision 2023) https://www.pouet.net/prod.php?which=94122

## Added Features
* Audio: 4klang song can be paused/seeked in editor mode without needing to made a .wav
* Audio: shader based generation, with option for postprocess pass (reverb, delays) and an experimental "real time" mode with midi capabilities
* Shader: multipasses frome same shader file (using hacky defines), music and visuals can share code
* Export: audio to .wav for rendering a video (define RECORD_SFX)
* Export: frame-by-frame in png or jpg for rendering a video (define RECORD_IMG, do it separate from audio)
* Particle simulation & rendering: in the Primordial Awakening branch
* Camera location: can be used in editor for debug or finding cool camera spots

## Compatibility
Current version intended to be used with Visual Studio 2017 (any version). Make sure you have a version with the latest Windows SDK installed (at least version 10.0.17134.0), or use version 8.1. With some extra configuration 2015 and 2013 should work as well.

## Quick start
- open fragment.frag file
- change "m1" function for your main rendering
- change "m2" function for your post-process pass
- change "m3" function for your music
- compile in "editor" config and press f5 to see the result
- when ready compile in "snapshot" or "release" (longer compilation time), you will find your final exe in out directory

## Shortcuts in editor mode
- alt+arrow left/right: seek in time backward/forward (+shift to go faster)
- alt+up pause, alt+down play
- alt+space play from start

## 4klang usage
If you want to use 4klang instead of shader audio, you will have to:
- change define AUDIO_TYPE to AUDIO_4KLANG in main.cpp
- put your '4klang.inc' file in the src/4klang folder
- launche make.bat in same folder (should use both 4klang.asm (4klang base code) and 4klang.inc (your song) files to generate a 4klang.obj file)
- add 4klang.obj in the lib dependencies of all your configs (editor, snapshot, release)

## Configurations
This section describes the different build configurations available from Visual Studio IDE
### Release
The real deal. No-nonsense max crinklering with minimum extra. Use this for occasional testing and your final releases (the compression WILL take a while).
### Snapshot
Use for general development. Only minimal crinklering but nothing extra included. Useful still for keeping track of relative size changes. This configuration overwrites Release configuration binaries, but doesn't generate and overwrite crinkler report.
### Editor
Creates a bigger exe similar to Debug, but with keyboard controls for pausing and seeking around temporally.