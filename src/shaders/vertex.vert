#version 130
varying out vec4 gl_TexCoord[2];
uniform sampler2D sb1;

float time;

vec2 res = vec2(1920,1080);
mat2 rot(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}
float rnd(float t) {
	return fract(sin(t*452.543)*714.831);
}

////////////////////////////
// VERTEX PARTICLE        //
////////////////////////////

void main()
{
	//time = m/44100.;
	time = gl_MultiTexCoord0.x/44100.;
	
	vec2 vuv = vec2(fract(gl_VertexID/res.x+0.5/res.x),(floor(gl_VertexID / res.x)+0.5)/res.y);
	
	vec4 value = texture(sb1, vuv);
	vec3 pos = value.xyz;

	vec3 wpos=pos;
	int idx=int(time/8);
	float prog = rnd(floor(time/8.)+floor(time/12.)*0.5) * 700;
	if(idx==0 || idx==9)prog+=4;
	if(idx==1)prog+=1;
	if(idx==10)prog+=9;
	
	//prog = 0.0;
	//if(time>136.) prog=0.0;
	float a=rnd(prog);
	pos.xz *= rot(prog + time * (a-.5));
	pos.yz *= rot(0.4);

	pos.x += sin(prog);
	float fov = rnd(prog*.1)*2+0.5;
	
	float near=2.0;
	//pos.z+=near;
	float d = fov/max(0.01,near+pos.z);
	pos.xy = pos.xy * vec2(res.y/res.x,1)*d;
	//float size = min(50,10.0*value.w*d);
	float blur=idx==0 || idx==7 ? 1 : 0;
	float dof = clamp((abs(pos.z-blur)-0.3)*.7,0.1,1.);
	float size = (40.0*dof);
	if(pos.z<=-near+0.1) size=0;
	pos.z=0;

	gl_TexCoord[0] = vec4(pos.xy, time, size);
	gl_TexCoord[1] = vec4(wpos, dof);

	gl_PointSize = size;
	gl_Position = vec4(pos, 1);
	

	//float a=gl_VertexID*0.25;
	//gl_Position = vec4(cos(a),sin(a),-sin(a),cos(a));
    //i = vec4(0.5, 1.0, 0.0, 1.0);
}