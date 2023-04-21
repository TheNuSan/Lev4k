#version 130
#define m1 main
uniform int m;
uniform int pm;
uniform sampler2D sb1;
uniform sampler2D sb2;

out vec4 o1;

/*
uniform vec3 camPos;
uniform vec3 camRot;
//*/

float time;
vec2 res = vec2(1920,1080);
//vec2 res = vec2(3840,2160);

//float pi=acos(-1.);
mat2 rot(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}

vec3 rnd3(vec3 t) {
	return fract(sin(t*571.421+t.yzx*673.656+t.zxy*342.317)*824.513);
}

/*float rnd(float t) {
	return fract(sin(t*452.543)*714.831);
}*/

float rnd(float p)
{
    p = fract(p * 736.1031);
    p *= p + 33.33;
    return fract(2.*p*p);
}

float pulse(float t, float d) {
	return (floor(t/d)+pow(fract(t/d),10.))*d;
}

float curve(float t) {
	return mix(rnd(floor(t)), rnd(floor(t)+1), pow(smoothstep(0,1,fract(t)),10));
}

float box(vec3 p, vec3 s) {
	p=abs(p)-s;
	return max(p.x, max(p.y,p.z));
}

float ap(float t, float b, float e) {
    return min(clamp((t-b)*1000.,0.,1.),clamp((e-t)*10.,0.,1.));
}

float smin(float a, float b, float h) {
    float k=clamp(0.5+0.5*(a-b)/h, 0., 1.);
    return mix(a,b,k) - k * (1.-k) * h;
}

float elli( vec3 p, vec3 r )
{
  float k0 = length(p/r);
  return k0*(k0-1.0)/length(p/(r*r));
}

float poulpe(vec3 p) {
    vec3 bp=p;
    
    float d=elli(p, vec3(1.2,1,1.5));
    d=smin(d, elli(p-vec3(0,-1.2,-.4), vec3(.8,1.2,1.1)), 0.7);
    
    vec3 p2=p+vec3(0,.7,1.4);
    p2.x=abs(p2.x)-.7;
    d=smin(d, -elli(p2, vec3(.2,.1,.2)), -0.4);
    d=smin(d, elli(p2-vec3(0,0,.2), vec3(.2,.2,.1)), 0.2);
    
    d=smin(d, elli(p+vec3(0,1.2,1.5), vec3(0.2,.3,.2)), 0.2);
    vec3 p3=p;
    p3.x=abs(p3.x)-.2;
    d=smin(d, elli(p3+vec3(0,1.35,1.3), vec3(0.1)), 0.15);
    
    p.z+=0.5;
    p.xz*=rot(p.x*.43);
    p.yz*=rot(.3);
    vec3 p4 = vec3(atan(p.x,-p.y), length(p.xy), p.z);
    p4 += sin(bp.yzx*0.7+time*vec3(1,.7,.3)+bp.zxy)*.1;
    p4.x=abs(abs(abs(p4.x)-0.2)-0.1)-0.04;
    vec3 p5 = vec3(cos(p4.x)*p4.y,sin(p4.x)*p4.y,p4.z);
    //p5.xy = abs(p5.xy)-.3;
    float ts=0.15+p.y*0.02;
    d = smin(d, max(length(p5.yz)-ts,bp.y), 0.5);
    
    //d=smin(d, d+dot(sin(bp*10.),vec3(0.1)),0.01);
	/*
    bp.xz*=rot(.7);
    d+=dot(sin(bp*10.),vec3(0.01));
    bp.yz*=rot(.3);
    d+=dot(sin(bp*13.),vec3(0.007));
    bp.yx*=rot(.6);
    d+=dot(sin(bp*17.),vec3(0.005));
    */
    return abs(d)-.05;//abs(d)-.6;
}


vec3 amb = vec3(0);
float spp=0;
float map(vec3 p) {
	vec3 bp=p;
	p.y+=0.7;
	float t=13.7+time*0.2;
	float ee=0.2+(sin(time*0.3)+1)*0.6;
	for(int i=0; i<4; ++i) {
		p.xz *= rot(.3+t + p.y*.3);
		p.xy *= rot(.4+t*.3 + p.z*.1);
		p.xz=abs(p.xz)-ee;//+fract(floor(time*0.1)*.5)*0.6;
	}
	float d = length(p)-0.3;
	//d=min(d, bp.y+0.5);
	//if(fract(time*0.05)<0.2) d = box(bp, vec3(0.8));
	//if(fract(time*0.05)<0.2) d = min(d, 1-length(bp+vec3(0,-1,0)));

	amb += vec3(2,.6,0.1)*0.5/(0.1+abs(length(p.xz)-0.1));

	vec3 ps = vec3(2.0);
	vec3 p3=(fract(bp/ps)-.5)*ps;
	float d2 = abs(box(p3, vec3(0.4)))-.1;
	//d2 = mix(d2, length(bp)-1, sin(time)*.5+.5);
	//d2 = mix(d2, min(length(p.xy),length(p.xz))-.1, sin(time*.2)*.5+.5);
	if(mod(time,16)<8) d2 = length(p.xy)-.01;
	//d2 = min(length(p.xy),length(p.xz))-.1;
	if((spp>0 || time>72) && fract(time)<0.5) d=min(d, d2);
	amb += vec3(.2,.5,1)*0.1/(0.03+abs(d2));
	
	float pss=0.3;
	if(time>136) d=1000;

	//if(spp>0) d = min(d, abs(length(bp)-1.5)-0.3);
	if(time>32) {d = min(d, poulpe(bp/pss-vec3(0,1.5,0))*pss);}
	else {d = min(d, abs(length(bp)-1.4)-0.15);}
	
	return d;
}

////////////////////////////
// PARTICLE DRAW          //
////////////////////////////

void m1(void)
{	
	time = gl_TexCoord[0].z;
	//time = gl_MultiTexCoord0.x;
	
	//vec2 uv = (gl_FragCoord.xy/res.xy-.5)*vec2(res.x,-res.y)/res.y;
	vec2 uv = gl_FragCoord.xy/res.xy-(gl_TexCoord[0].xy*0.5+0.5);
	float size=gl_TexCoord[0].w;
	float dof = gl_TexCoord[1].w;
	vec3 pos = gl_TexCoord[1].xyz;
	uv /= size/res.xy;
	//////////////////////

	/*
	vec2 sc = gl_TexCoord[0].xy;
	vec3 s=vec3(0,0,-1.3);
	vec3 r=normalize(vec3(sc,1.));
	
	for(int i=0; i<50; ++i) {
		float d=map(s);
		if(d<0.01) {
			
		}
		s+=r*d;
	}*/
	float dis = map(pos);

	//vec4 value = texture(sb1, uv);

	if(length(uv)>0.5) discard;

	//vec3 col=rnd3(vec3(size,0.3,0.7));
	vec3 col=vec3(0);//vec3(3,2.0*abs(dis)+.1,0.7*abs(dis)+.05);
	col += amb;
	//col*=abs(sin(time*vec3(0.33,0.1,0.07)));
	//col = value.xyz;
	col *= smoothstep(0.5,0.45-size*0.005,length(uv));
	col *= 0.004;
	col /= dof*dof;
	o1 = vec4(col,1);
	
    //o1 = vec4(col-max(m/44100.-107,0.),1);
}

////////////////////////////
// PARTICLE SIMULATION    //
////////////////////////////

vec3 curl(vec3 p) {
	vec2 off=vec2(0.001,0);
	//vec3 diffs=vec3(map(p+off.xyy)-map(p-off.xyy),map(p+off.yxy)-map(p-off.yxy),map(p+off.yyx)-map(p-off.yyx))/(off.x*2);
	vec3 diffs=(map(p)-vec3(map(p-off.xyy),map(p-off.yxy),map(p-off.yyx)))/off.x;
	return diffs.yzx-diffs.zxy;
}

void m2(void)
{	
	time = m/44100.;
	float dt = (m-pm)/735.; // 44100/60
	//dt = 1.0;
	float song = min(max(0.,time-8.),130.);
	float ani=ap(mod(song,64.0),32.,64.);
	dt *= 0.8;
	if(ani<0.01) { spp=1; } else {dt *= 0.9;}
	int idx=int(time/8);
	
	vec2 fc=floor(gl_FragCoord.xy);
	float id=fc.x+fc.y*res.x;
	vec2 uv = gl_FragCoord.xy/res.xy;
	vec4 value = texture(sb1, uv);
	vec4 value2 = texture(sb2, uv);
	vec3 pos=value.xyz;
	vec3 speed=(pos-value2.xyz)/dt;
	vec3 rr=rnd3(vec3(uv,0.7));
	float life = value.w;
	if(time<0.1) life=rr.y*500+500;
	
	// curl
	//speed += curl(pos) * 0.0004;
	speed += curl(pos) * 0.0008 * dt;
	//speed += normalize(curl(pos)) * 0.0002; // no
	
	float d=map(pos);
	
	// bounce
	/*
	if(d<0.) {
		vec2 off=vec2(0.01,0);
		vec3 n=normalize(d-vec3(map(pos-off.xyy),map(pos-off.yxy),map(pos-off.yyx)));
		//pos=value2.xyz;
		pos-=n*d*.05;
		speed=reflect(speed,n)*0.9;
		//pos += n*abs(d)*0.1;
	}
	//*/
	
	//speed += normalize(rnd3(vec3(uv,floor(time)))-.5)*0.001*dt;
	
	//* 
	// attire
	vec2 off=vec2(0.01,0);
	vec3 n=normalize(d-vec3(map(pos-off.xyy),map(pos-off.yxy),map(pos-off.yyx)));
	//speed -= n*clamp(d,-0.1,0.1)*.002;
	speed -= n*clamp(d,-0.05,0.05)*.03*dt;
	//*/

	//*
	// push
	if(d<0.7) {
		vec2 off=vec2(0.01,0);
		vec3 n=normalize(d-vec3(map(pos-off.xyy),map(pos-off.yxy),map(pos-off.yyx)));
		float pro = time + d*0.05 - length(pos)/50+0.05;
		float kk=clamp(min(fract(pro), mod(pro+0.75,2.0)),0.,1.);
		if(time>136) kk=time-136;
		float pul = exp(-kk*40.0);
		if(idx>=12 && idx<16) pul*=0.1;
		speed += n*pul*0.03*dt;
	}
	//*/
	
	
	// tornado
		vec3 ton=vec3(0,1,0);
	if(idx>8 && idx<12) {
		ton.xy *= rot(time);
		ton.xz *= rot(time*1.7);
		vec3 tdir=normalize(cross(pos, ton));
		speed *= 0.93;
		speed += tdir  * (sin(dot(pos,ton)*1-time)-.3) * dt * 0.007;
		//speed += normalize(vec3(pos.z,0,-pos.x)) * sin(length(pos)*2-time) * dt * 0.002;
	}
	
	/*
	vec3 co=abs(pos);
	if(max(co.x,co.y)>1.0) {
		speed -= speed*1.5*dt;
	}
	pos.xyz = clamp(pos.xyz,-1,1);
	*/

	// gravity
	//speed.y -= 0.0004*dt;
	if(time>136) speed*=0.9;
	pos += speed*0.96*dt;
	
	if(life>500) {
		//pos=rnd3(vec3(uv,0.6))*2-1;
		//pos=rnd3(vec3(uv,0.61))*2-1;
		//pos=rnd3(vec3(uv,0.6))*vec3(2,1,2)-vec3(1,-1-2*max(0,1-time/8),1);
		//pos=rnd3(vec3(uv,0.6))*vec3(2,1,2)-vec3(1,-1,1); // here
		//pos=(rnd3(vec3(uv,0.6))-.5)*.5;

		//*
		if(time<8) {
			pos=rnd3(vec3(uv,0.6))*vec3(1,1,1)-vec3(.5,-12+fract(time*20),.5); // here
		} else {
			pos=(rnd3(vec3(uv,0.6))*2-1)*1.0;
			for(int i=0;i<30;++i) {
				vec2 off=vec2(0.01,0);
				float d3=map(pos);
				vec3 n3=normalize(d3-vec3(map(pos-off.xyy),map(pos-off.yxy),map(pos-off.yyx)));
				pos-=n3*d3;
			}
		}
		//*/

		if(life>501) {
			life=mod(life,500);
			//vec3 rd=rnd3(vec3(uv,0.6))-.5;
			//pos+=rd*vec3(1,4,1)*0.005*dt;
		}
	}
	//pos=value.xyz; // freeze
	o1 = vec4(pos,life+1);
}

////////////////////////////
// POST-PROCESS           //
////////////////////////////
/*
vec3 debugmarch(vec2 uv, float time) {
	uv = (uv)*res.xy/res.y;

	vec3 s=vec3(0,0,-10);

	float prog = rnd(floor(time/8.)+floor(time/12.)*0.5) * 700;
	//prog = 0.0;
	if(time>136.) prog=0.0;
	float a=rnd(prog);

	float fov = rnd(prog*.1)*2+0.5;
	
	vec3 r=normalize(vec3(uv, 1./fov));
	
	//s.x -= sin(prog);

	s.yz *= rot(-0.4);
	s.xz *= rot(-(prog + time * (a-.5)));
	r.yz *= rot(-0.4);
	r.xz *= rot(-(prog + time * (a-.5)));

	vec3 col=vec3(0);
	vec3 p=s;
	for(int i=0; i<100; ++i) {
		float d=abs(max(map(p),2.-length(p-s)))*0.7;
		if(d<0.001) {
			col += vec3(0.3,0.5,1.0)*map(p-r*0.6);
			break;
		}
		if(d>100.0) break;
		p+=r*d;
	}
	return col;
}
*/

void m3(void)
{	
	time = m/44100.;
	
	vec2 uv = gl_FragCoord.xy/res.xy-.5;
		
	float song = min(max(0.,time-8.),130.);
	float ani=ap(mod(song,64.0),32.,64.);
	vec2 uv3 = uv*rot(-0.3-curve(time*0.5)*1.3);
	float pg=rnd(floor(pow(max(0,abs(uv3.x)-0.1),1.3)*15-time*5));
	uv += vec2(0.0,1.0)*pg*(curve(time*6+pg*2)-.5)*.1 * ani;// * pow(length(uv),2.)*10.0;
	//uv = max(-1.-uv,min(uv,1.-uv));
	uv = abs(mod(uv-.5,2)-1)-.5;
	//uv += vec2(0,(rnd(floor(uv3.x*10))-.5)*.15);
	
	vec3 value = texture(sb1, uv+.5).xyz;
	if(floor(time/8)==7) value.x*=0.3;

	/*
	vec3 bloom=vec3(0);
	for(float i=-10; i<11; ++i) {
		for(float j=-10; j<11; ++j) {
			vec3 rd = rnd3(vec3(i,j,fract(time)));
			bloom += texture(sb1, clamp(uv+vec2(cos(rd.x*6.28),sin(rd.x*6.28))*rd.y*200.0/res.xy,0.001,.999)).xyz;
		}
	}
	//value *= 0.0;
	value += bloom / 500;
	*/
	//value += .05+(0.01*rnd3(vec3(uv,0)).x);

	float band = sin(time/2)*.15-.2;
	float t=time*.1 + abs(uv.x)*1.5 + band*0.0;
	value.xz *= rot(t);
	value.xy *= rot(t*.7+uv.y);
	value = abs(value);
	vec3 modo = value-dot(value,vec3(0.33));
	modo=min(vec3(0.7),modo);
	value *= mix(vec3(1), vec3(5,1,.3)-modo*(.5+band*.5),ani);
	//value *= mix(vec3(1), vec3(5,1,.3) - min(vec3(5,1,.3)*0.7,value*0.3),ani);
	
	value*=0.2;
	value *= 1.4-2*length(uv);

	float fade=clamp(time/4,0,1)*clamp((144-time)/4,0,1);
	value *= fade;
	
	value=pow(value*.1,vec3(0.17));
	//value=smoothstep(vec3(0.01,0.02,0.005),vec3(1,1.2,.9),value);
	value=smoothstep(0,1,value);

	//vec2 borders = abs(uv)*2.0;
	//value.y += pow(max(borders.x, borders.y),10.0)*0.5;
	/*
	value.z += step(gl_FragCoord.x*145.0/res.x,time)*step(gl_FragCoord.y/res.y,0.02);
	value += step(mod(gl_FragCoord.x*145.0/res.x,8.),.1)*step(gl_FragCoord.y/res.y,0.025);
	//value.x += anim(gl_FragCoord.x*145.0/res.x).x*step(gl_FragCoord.y/res.y,0.005);
	//*/
	// debug vue
	//value += debugmarch(uv, time);


	//value = vec4(1,0,fract(time),1);
	o1 = vec4(value*fade,1);
}

////////////////////////////
// AUDIO PASS             //
////////////////////////////

float keyfreq(float k) {
    return 440.*exp(k/12.); // this is wrong btw, but sounds cool
}

const int tmajor[7] = int[7](0,2,4,5,7,9,11);
float major(float k, float b) {
    return keyfreq(b+float(tmajor[int(k+70.)%7])+floor(k/7.)*12.);
}

float major2(float k) {
    return float(tmajor[int(k+70.)%7])+floor(k/7.)*12.;
}

float synth2(float beat, float base, float seed, float depth, float range) {
    float s=0.;    
    for(float i=0.; i<depth; ++i) {
        
        float md = floor(rnd(i*.23+.07+seed)*range) + 1.0;
        float note = keyfreq(base)*md;
        float ps = rnd(i*.3+.7+seed*.6);
        float lfo = rnd(i*.1+.01+seed);
        s += sin(beat * lfo * 50.0 + ps * 6.28) * sin((beat*note*(1.0+ps*0.06) + ps)*6.28) * 0.05;
    }
 
    return s;
}


float hat(float t) {
    //float tt=mod(mod(t,1.125),.25);
    float tt=mod(t,.125);
    return pow(1.0-tt,30.0) * rnd(tt) * (0.2+rnd(t-tt));
}

float kick(float t) {
    float k = sin(t*507.3)*cos(t*100.0)*exp(-t*4.);
    k += sin(t*400.0)*exp(-t*20.);
    k += sin(t*100.0)*exp(-t*40.)*0.8;
    return k*ap(t,0.,0.25);
}

float enveloppe(float time, float attack, float sustain, float release) {
    return clamp(time/attack,0.,1.) * (1.-clamp((time-sustain-attack)/release,0.,1.));
}

// from 0b5ver
vec2 snare( float _phase ) {
  return clamp( (
    rnd( _phase ) +
    sin( _phase * 1200.0 * vec2( 1.005, 0.995 ) - exp( -_phase * 300.0 ) * 30.0 )
  ) * 2.0 * exp( -_phase * 33.0 ) , -1.0, 1.0);
}

// from 0b5ver
float saw( float _freq, float _phase, float _filt, float _q ) {
  float sum = 0.0;
  for ( int i = 1; i <= 32; i ++ ) {
    float cut = smoothstep( _filt * 1.2, _filt * 0.8, float( i ) * _freq );
    cut += smoothstep( _filt * 0.3, 0.0, abs( _filt - float( i ) * _freq ) ) * _q;
    sum += sin( float( i ) * _freq * _phase * 3.141592 * 2.0 ) / float( i ) * cut;
  }
  return sum;
}

float gain(float v, float f) {
    //v *= 10.0;
    //v*=sqrt(f / (4.0 + (f - 1.0) * v * v));
    //return v;
    return smoothstep(-1.0,1.0,v*f)*2.0-1.0;
}

vec2 gain2(vec2 v, float f) {
    vec2 s=sign(v);
    v=abs(v);
    return pow(v,vec2(f))*s;
}

vec2 plop(float mesure, float time, float f, float a) {
    time-=8.;
    float t=min(mod(mesure,1.5),mod(mesure-.25,2.));
    int id=int(time);
    float d = float(id%3 + (id/2)%5*2);
    vec2 dir = vec2(.4,.4)*rot(rnd(floor(time)+a)*7.)+.5;
    return dir*saw(major(d,-4.), t, f, 1.0) * enveloppe(t, a, 0.01,3.9) * (0.5+cos(t*13.)*.25) * 0.3 * exp(-t*5.);
}

vec2 lee( float id3, float _phase, float _filt, float _q ) {
    vec2 s = vec2(0.7,0.7)*saw(major(id3,0.0), _phase, _filt, _q);
    //s += saw(major(id3+3.0,0.0)+3.0, _phase-0.25, _filt*0.8, _q*1.5)*0.5;
    //s += saw(major(id3-2.0,0.0)-3.0, _phase-0.5, _filt*0.8, _q*1.5)*0.2;
    s += vec2(0.0,1.0)*saw((major(id3,0.0)+6.0)*0.5, _phase-0.25, _filt*0.8, _q*1.5)*0.5;
    s += vec2(1.0,0.0)*saw((major(id3,0.0)-6.0)*0.25, _phase-0.5, _filt*0.5, _q*2.0)*0.2;
    return s;
}

void m4(void)
{			
	vec2 frag = gl_FragCoord.xy;

	float time = (frag.x + frag.y*1920) / 44100. - 0.05;
	//int iti = int(frag.x) + int(frag.y)*1920;
	//time = (iti%(44100*8))/44100.0;
				
	//time += 124.0;
	//float mesure = (iti%(44100*8))/44100.0;
	float mesure = time;

    vec2 mus=vec2(0);
    
    float song = min(max(0.,time-8.),130.);
	float ani=ap(mod(song,64.0),32.,64.);
    float drum = step(mod(song, 32.0),24.1)*ap(song,8.,128.);
    
    float b5=mod(mesure, 0.2);
    
    int id=int(time*5.);
    float d = float(id%5 + (id/2)%3*2 - (id/3)%7);
    float n = 28.; 
    float v1 = synth2(b5, major2(d)-n, 12., 70.0, 5.0) * enveloppe(b5, 0.01, 0.01,0.1);
    float v2 = synth2(b5, major2(d)-n, 28., 70.0, 3.0) * enveloppe(b5, 0.03, 0.05,0.05);
    
    float g=4.0;
    v1 = gain(v1, g);
    v2 = gain(v2, g);
    
    float fro = ap(song,64.,128.);
  
    // back bass
    mus += mix(vec2(1.0,0.2)*v1,vec2(0.2,1.0)*v2, sin(time*2.0)*0.3+0.5) * (0.2-0.1*fro) * ap(mod(song,64.),24.,62.);
  
    // back vocals
    float b2=mod(mesure, 8.0);
    float b3=mod(mesure-3.0, 8.0);
    float b4=mod(mesure+3.0, 8.0);
	float ib2 = floor(time/8.0);
	float ib3 = floor((time-3.0)/8.0);
	float ib4 = floor((time+3.0)/8.0);
    vec2 vo = vec2(0);
    vo += vec2(1,.3)*synth2(b2, -14.0+mod(ib2,2.)*2., ib2+3., 60.0, 8.0) * enveloppe(b2, 3., 2.,3.0) * 0.3;
    vo += vec2(.3,1)*synth2(b3, -14.0+mod(ib3,2.)*2., ib3+.2, 70.0, 6.0) * enveloppe(b3, 3., 2.,3.0) * 0.3;
    vo += vec2(.7,.7)*synth2(b4, -14.0+mod(ib4,2.)*2., ib4+.7, 70.0, 5.0) * enveloppe(b4, 3., 2.,3.0) * 0.3;
    mus += vo;
    
    // wobbly
    float b6=mod(time, 0.1);
	float ib6=floor(time/.1);
    float fil = 200.0 + 2200.0 * (sin(time/2.0)*0.5+0.5);
    mus += (vec2(0.3,0.0) * rot(time*.3)+.6) * saw(major(mod(floor(ib6),5.0),-20.0), b6, fil, 10.0) * enveloppe(b6, 0.01, 0.08,0.01) * 0.15 * ani;
    
    // drum
    mus += vec2(0.7,0.5)*hat(mesure) * 0.2*drum;
    mus += vec2(0.5,0.7)*snare(min(fract(mesure-0.5), mod(mesure+.25,4.0))) * 0.5*drum;
    
    // kick
    float kk=clamp(min(fract(mesure), mod(mesure+0.75,2.0)),0.,1.);
    mus = mix(mus,vec2(kick(kk)*0.7), 0.4+0.6*pow(1.0-kk,5.));
    mus *= ap(time,0.,136.);
    
    // plops
    float f=700.0 + 3000.0*(sin(time*0.2)*.5+.5);
    vec2 pl=vec2(0);
    pl += plop(mesure, time,f,.001); 
    pl += plop(mesure, time-0.5,f*.8,.05)*0.5; 
    pl += plop(mesure, time-1.0,f*.7,.1)*0.3;
    pl += plop(mesure, time-1.5,f*.5,.2)*0.2;
    mus += pl*.7*ap(mod(time,32.),8.,32.);
	    
    // front lead
    float sec=step(mod(time,16.),8.);
    float t3 = min(mod(mesure,1.0), mod(mesure+.25,0.5)+sec);
    float id3 = mod(floor(time),4.);
    vec2 lo = lee(id3, t3, 700.0+sin(time*25.0)*100.0, 4.0+3.*sin(time*16.0)) * enveloppe(t3, 0.1, 0.1+sec*.2,0.01+sec*.29);
    lo *= 0.4;
    lo=gain2(lo,0.9)*0.17;
    mus += lo * fro;
    
    //mus *= 0.7;
    
    // fade in/out
    mus *= min(time/4.,1.)*clamp((144.-time)/10.,0.,1.);

	o1 = vec4(0,0,mus);
}
