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
// ACCUMULATION PASS      //
////////////////////////////

void m1(void)
{	
	time = m/44100.;
	time *= 0.1;
	
	vec2 uv = (gl_FragCoord.xy - res.xy/2)/res.y;

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

	o1 = vec4(col,1);
}

////////////////////////////
// PRESENT PASS           //
////////////////////////////

void m2(void)
{	
	time = m/44100.;
	
	vec2 uv = gl_FragCoord.xy/res.xy;
	
	vec3 col=vec3(0);
	vec2 off=vec2(0.005,0);
	vec4 col_r = texture(sb1, uv-off);
	vec4 col_g = texture(sb1, uv);
	vec4 col_b = texture(sb1, uv+off);
	col += vec3(col_r.x/col_r.w, col_g.y/col_g.w, col_b.z/col_b.w);

	o1 = vec4(col,1);
}
