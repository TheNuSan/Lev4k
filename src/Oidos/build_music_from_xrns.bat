rem place your music.xrns from renoise in the folder and launch this .bat

.\Tools\OidosConvert music.xrns music.asm

.\Tools\nasmw -f win32 oidos.asm -o oidos.obj
.\Tools\nasmw -f win32 random.asm -o random.obj

rem end of script
pause