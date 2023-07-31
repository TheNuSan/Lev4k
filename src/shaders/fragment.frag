#version 330
#define m1 main
uniform int m;
uniform sampler2D sb1;

out vec4 o1;

/*
uniform vec3 camPos;
uniform vec3 camRot;
//*/

float time;
vec2 res = vec2(1920,1080);
//vec2 res = vec2(3840,2160);

mat2 rot(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}

float box(vec3 p, vec3 s) {
	p=abs(p)-s;
	return max(p.x, max(p.y,p.z));
}

float map(vec3 p) {
	// basic kifs
	for(int i=0; i<4; ++i) {
		p.yz *= rot(time*0.3+i);
		p.xz *= rot(time*0.4+i*1.7);
		p.xy = abs(p.xy)-1.1 - sin(time + i);
	}

	return box(p, vec3(0.1,0.4,1));
}

////////////////////////////
// MAIN PASS              //
////////////////////////////

void m1(void)
{	
	time = m/44100.;
	
	vec2 uv = (gl_FragCoord.xy - res.xy/2)/res.y;
	vec2 uv2 = gl_FragCoord.xy/res.xy;

	vec3 col = vec3(0);

	// basic raymarcher
	vec3 s=vec3(0,0,-10);
	vec3 r=normalize(vec3(uv, 1));	
	vec3 p=s;
	for(int i=0; i<100; ++i) {
		float d=map(p);
		if(d<0.001) break;
		if(d>100) break;
		p+=r*d;
	}

	float fog = 1-clamp(length(p-s)/100,0,1);
	col += clamp(map(p-r),0,1) * fog;

	col = mix(col, texture(sb1, uv2).xyz, 0.95);

	o1 = vec4(col,1);
}

////////////////////////////
// POST-PROCESS           //
////////////////////////////

void m2(void)
{	
	time = m/44100.;
	
	vec2 uv = gl_FragCoord.xy/res.xy;
	
	vec3 col=vec3(0);
	vec2 off=vec2(0.005,0);
	col.x += texture(sb1, uv-off).x;
	col.y += texture(sb1, uv).y;
	col.z += texture(sb1, uv+off).z;
	
	o1 = vec4(col,1);
}

////////////////////////////
// AUDIO PASS             //
////////////////////////////

float note_freq(float note, float octave) { return 440.0*pow(2.0,((octave-4.0)*12.0+note)/12.0); }

void m3(void)
{			
	vec2 frag = gl_FragCoord.xy;

	float time = (frag.x + frag.y*1920) / 44100. - 0.05;

	vec2 mus = vec2(0);
	float beat = fract(time);
	float note = floor(time);
	float freq = note_freq(mod(note, 8), 4);
	mus += sin(freq*6.283*beat + sin(time*30)) * exp(-beat*3) * 0.7;
	mus += (fract(beat*55.0 + sin(time*730)*0.2)-0.5) * exp(-beat*9) * 0.5;
	float beat2 = min(fract(time*2), fract(time*6));
	mus += fract(sin(beat2*342.454)*485.523) * exp(-beat2*10) * 0.2 * step(mod(time,16),12);

	o1 = vec4(0,0,mus);
}
