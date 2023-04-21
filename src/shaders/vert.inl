/* File generated with Shader Minifier 1.1.6
 * http://www.ctrl-alt-test.fr
 */
#ifndef VERT_INL_
# define VERT_INL_

const char *vertex_vert =
 "#version 130\n"
 "varying out vec4 gl_TexCoord[2];"
 "uniform sampler2D sb1;"
 "float f;"
 "vec2 s=vec2(1920,1080);"
 "mat2 v(float f)"
 "{"
   "return mat2(cos(f),sin(f),-sin(f),cos(f));"
 "}"
 "float n(float f)"
 "{"
   "return fract(sin(f*452.543)*714.831);"
 "}"
 "void main()"
 "{"
   "f=gl_MultiTexCoord0.x/44100.;"
   "vec2 x=vec2(fract(gl_VertexID/s.x+.5/s.x),(floor(gl_VertexID/s.x)+.5)/s.y);"
   "vec4 g=texture(sb1,x);"
   "vec3 i=g.xyz,c=i;"
   "int m=int(f/8);"
   "float z=n(floor(f/8.)+floor(f/12.)*.5)*700;"
   "if(m==0||m==9)"
     "z+=4;"
   "if(m==1)"
     "z+=1;"
   "if(m==10)"
     "z+=9;"
   "float o=n(z);"
   "i.xz*=v(z+f*(o-.5));"
   "i.yz*=v(.4);"
   "i.x+=sin(z);"
   "float y=n(z*.1)*2+.5,e=2.,t=y/max(.01,e+i.z);"
   "i.xy=i.xy*vec2(s.y/s.x,1)*t;"
   "float l=m==0||m==7?1:0,r=clamp((abs(i.z-l)-.3)*.7,.1,1.),a=40.*r;"
   "if(i.z<=-e+.1)"
     "a=0;"
   "i.z=0;"
   "gl_TexCoord[0]=vec4(i.xy,f,a);"
   "gl_TexCoord[1]=vec4(c,r);"
   "gl_PointSize=a;"
   "gl_Position=vec4(i,1);"
 "}";

#endif // VERT_INL_
