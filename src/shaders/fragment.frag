#version 420
#define m1 main
uniform int m;
uniform sampler2D sb1;

layout(r32ui) uniform coherent uimage2D[6] ct;

out vec4 o1;

/*
uniform vec3 camPos;
uniform vec3 camRot;
//*/

float time;
vec2 res = vec2(1920,1080);
//vec2 res = vec2(3840,2160);


void add(vec2 pos, vec3 v) {
  v*=10000;
  imageAtomicAdd(ct[0], ivec2(pos), int(v.x));
  imageAtomicAdd(ct[1], ivec2(pos), int(v.y));
  imageAtomicAdd(ct[2], ivec2(pos), int(v.z));
}

vec3 read(vec2 pos) {
  vec3 c=vec3(0);
  c.x += imageLoad(ct[3], ivec2(pos)).x;
  c.y += imageLoad(ct[4], ivec2(pos)).x;
  c.z += imageLoad(ct[5], ivec2(pos)).x;
  return c/10000.0;
}

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

float rnd1(float t) {
  return fract(sin(t*452.312)*921.424);
}
vec2 rnd2(vec2 t) {
  return fract(sin(t*452.312+t.yx*332.714)*921.424);
}
vec3 rnd3(vec3 t) {
  return fract(sin(t*452.312+t.yzx*332.714+t.zxy*324.147)*921.424);
}

vec2 circ(vec2 seed) {
  vec2 rr = rnd2(seed);
  rr.x*=6.28;
  rr.y=sqrt(rr.y);
  return vec2(cos(rr.x)*rr.y,sin(rr.x)*rr.y);
}

void line(vec2 a, vec2 b, vec3 c, float seed) {
  vec2 mpos = mix(a,b,rnd1(seed));
  add(mpos, c);
}

void line2(vec2 a, vec2 b, vec3 c) {
  float dd=ceil(max(abs(a.x-b.x),abs(a.y-b.y)));
  dd=min(dd,600);
  for (int i=0; i<dd; ++i) {
    vec2 mpos = mix(a,b,i/dd);
    add(mpos, c);
  }
}

void m1(void)
{	
	time = m/44100.;
	
	vec2 puv = gl_FragCoord.xy;
	vec2 uv = (puv - res/2)/res.y;

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

	float size = 20;
	if(puv.x<size && puv.y<size) {
		vec3 p1=rnd3(vec3(puv,0.7))-0.5;
		vec3 p2=rnd3(vec3(puv,7.7))-0.5;
		float t1 = time*0.2;
		float t2 = t1 + 1.0;
		p1.xz*=rot(t1);
		p1.yz*=rot(t2);
		p2.xz*=rot(t1);
		p2.yz*=rot(t2);
		p1+=0.5;
		p2+=0.5;
		line2(p1.xy*res+0.5, p2.xy*res+0.5, vec3(1,0.5,0.3));
	}
	add(puv, read(puv)*vec3(0.95,0.9,0.7));

	float fog = 1-clamp(length(p-s)/100,0,1);
	col += clamp(map(p-r),0,1) * fog;

	col = clamp(col, 0,1);
	col += read(puv);
	
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
	col += texture(sb1, uv).xyz;
	
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
