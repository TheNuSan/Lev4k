#version 330
#define m1 main
uniform int m;
uniform sampler2D sb1;

out vec4 o1;

// Drifting Shore
// by nusan
// Made for Revision 2024

// this code is often a mess, it was made in a rush to meet approaching revision's deadline
// so don't judge it too harshly, it could be sizecoded a lot more but I didn't have time

/*
uniform vec3 camPos;
uniform vec3 camRot;
//*/

float time;
vec2 res = vec2(1920,1080);
//vec2 res = vec2(3840,2160);

float pi=acos(-1.);
float c01(float a) {return clamp(a,0,1);}

//DAVE HOSKINS' HASH FUNCTIONS
float rnd11(float p)
{
    p = fract(p * .1031);
    p *= p + 33.33;
    return fract(2*p*p);
}

vec3 rnd23(vec2 p)
{
	vec3 p3 = fract(p.xyx * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy+p3.yzz)*p3.zyx);
}
/*
float rnd31(vec3 p3)
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}
*/
vec3 rnd33(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}

// fade in, stay on for d duration and then fade out 
float block(float t, float d, float fi, float fo) {
	return c01(t/fi+1)*c01((d-t)/fo+1);
}

// out 1 for half the time and then 0 for the rest, with fade in/out
float chop(float t) {
	return c01(min(fract(t)*30,fract(1-t)*30-15));
}

////////////////////////////
// PATHTRACING            //
////////////////////////////

// current ray start position, ray direction, normal at hit point, emissive color at hit point
vec3 s,r,n,emit;
// distance of first collision along the ray, starts very high
float d=10000;

// rotation function
mat2 rot(float a) {return mat2(cos(a),sin(a),-sin(a),cos(a));}

// analytical intersection between current ray and a sphere of "size" at a position "pos", with a specific color "co"
void sphere(vec3 pos, float size, vec3 co) {  
    vec3 l = pos - s;
	float tca = dot(l, r);
    float d2 = dot(l,l) - tca*tca;
	if(d2 < size*size) {
        float thc = tca - sqrt(size*size-d2);
        if (thc > 0 && thc < d)
        {
            d =  thc;
            n = normalize(d*r-l);
			emit = co;
        }
    }
}

// color of the sky for the current ray direction
vec3 skycol() {
	// lighting in first scene, just some large blurry white blobs, inspired by Blackle's way of doing that
	if(time<90) return vec3(.7,.8,1)*abs(dot(sin(r*vec3(5,7,13)),vec3(1)));
	// lighting in final scene, a pure desaturated blueish sky with a small bright pink rising sun
	if(time>120) return c01((time-123)/2)*mix(vec3(0.6,0.8,1)*.8, vec3(1,0.3,0.3) * 15, pow(max(dot(r,normalize(vec3(-1,0,-1.5))),0),50));
	// lighting in "flashing pink bars" scene
	vec3 cid = floor(abs(r)*vec3(30,1,30)+floor(time*6));
	float fad = c01((116.4-time)*4);
	// makes pink bars that flashes at random intervals
	return fad*vec3(pow(1-abs(r.y),4)+.3,0.5,1)*8*rnd33(cid).y*max(0,sin(time*8*rnd11(cid.x)));
}

////////////////////////////
// MAIN PASS              //
////////////////////////////

void m1(void)
{	
	vec2 frag = gl_FragCoord.xy;
	vec2 uv = (frag-res*0.5)/res.y;
	
	vec3 col = vec3(0);
	
	time = max(m/44100.-1,0.);
		
	//////// CAMERA ANIMATION ////////

	// sections are 8 beats, the music is like 120 bpm, so no need to put any factor there
	int section = int(time/8)%18;
	// variable going from 0 to 8 in a section
	float rest = mod(time,8);
	// way to separate section in two parts, this variable is at 1 if in the second half of a section
	float mi = floor(rest/4);

	// Main way to control the intro (camera, DOF focus, shape)
    // Each vec3 is a section of the intro
    // first value is the seed of the camera motionpath/speed/FOV, fractionnal part is a time offset, negative values subdivide the section in two parts
    // second value is the focus distance for the DOF, negative value makes the DOF bigger
    // third value is the shape seed, integer value is the background shape, fractionnal part is the center shape
	vec3 mot[18] = vec3[18]( // 18 sections in total
		 vec3(18.32,-12,0)
		,vec3(-16,-18,0)
		,vec3(-7,-20-max(0,rest-7.5)*200,0)
		,vec3(-7,-min(rest,4)*10,8)
		// -------------- // 32
		,vec3(-4+mi*4.1,-13,8)
		,vec3(-13+mi*3,15,14.1)
		,vec3(-7.97,-25+mi*10,8.2)
		,vec3(-4.9,8,11)
		// -------------- // 64
		,vec3(-5.9,7,2.6)
		,vec3(-7.5,-18,15)
		,vec3(-16.95-mi*5,20,8)
		,vec3(25+mi,-20,4.6)
		// -------------- // 96
		,vec3(-35,20,6.9)
		,vec3(-51,-20+mi*10,7.9)
		,vec3(-16,30,14.4-mi)
		,vec3(-5,-20-rest*30,13.025+mi*(25-.025))
		// -------------- // 128
		,vec3(2+mi*39,10,6)
		,vec3(31+mi*7,-12-rest*2,0)
		);

	// my way of working was to put random seeds for the shape or camera and find some that I find good
	// then I can just copy/past that seed in the array above to put it in a section

	float scene=1;

	// seed values for the current section
	vec3 mval = mot[section];
	// camera avance along it's path
	vec3 pcam = rnd23(vec2(round(abs(mval.x)),0));
	float avance = pcam.x*300 + rest * (pcam.y*.5-0.2) + fract(mval.x)*8;
	if(mval.x<0) avance += floor(rest/4.)*100;
	if(section==9) avance += rest*0.05;
	
	// distance where scene will be sharp (no blur)
	float focusdist = abs(mval.y)*5;
	// extra push that lets you put the camera far away without actually moving it or having objects going in front of it
	float extrapush = mval.y>0 ? 0 : 50;
	// if extrapush is activated, use a larger amount of dof
	float dofamount = .075+extrapush/50;
	// adjust fov to compensate for extrapush
	float fov = 1 + extrapush/50;
	
	// size of the sphere that limits the 3 planes
	float bigsphere=100000.;
	// location of that sphere
	vec3 msp=vec3(0,-10,0);

	// lissajous curve to makes interesting camera motion
	// a section of the intro is only a time offset in that very long lissajous curve
	float dt=rnd11(pcam.z)*20-10;
	vec3 bs=vec3(100*sin(avance*.4 + 0.7),-20 + sin(avance*.2)*3,100*sin(avance*.9));
	vec3 t = vec3(100*sin(avance*.4 + 0.7 + dt),sin(avance*.3)*3,100*sin(avance*.9 + dt));
	if (section==12) t+=vec3(-80,0,-0);

	//////// CAMERA COMPUTE ////////
	vec3 cz=normalize(t-bs);
	vec3 cx=normalize(cross(cz,vec3(0,1,0)));
	vec3 cy=cross(cz,cx);
		
	// number of samples per pixel, here 25 give about 30fps on my RTX3070 but will give at least 60fps on the compo machine
	int steps=25;
	for(int i=0; i<steps; ++i) {
		s=bs;
		// DOF
		vec2 h = rnd23(frag-13.6-i*184.7).xy;
		vec3 voff = sqrt(h.x)*(cx*sin(h.y*6.283)+cy*cos(h.y*6.283))*dofamount;
		s-=voff;
		r=normalize(uv.x*cx+uv.y*cy+fov*cz + voff*fov/(focusdist+extrapush));
		s += (r-cz) * extrapush;
		
		// up to 3 rays per sample (1 primary ray and 2 bounces)
		float alpha = 1;
		for(int j=0; j<3; ++j) {
			////////// TRACE //////////
			d=100000;
			
			emit=vec3(0);
			
			////////// SCENE //////////

			// the scene is made of 3 rotating planes
			for(float k=0.;k<3.;++k) {
			
				float seed=k+round(mval.z)*100.4;

				// we keep around previous ray hit values, in case we are going through a hole of this plane
				float d2 = d;
				vec3 n2 = n;
				vec3 emit2 = emit;
    
				vec3 planenorm = vec3(0,1,0);
				
				// animation variables
				float ani=fract(mval.z)*4;
				float ani2=time>48 && time<80?1:0;
				float adj=0;
				
				// distance from origin of the plane
				float dist = rnd11(seed-.1)*40+40;
				// plane thickness
				float size = 2.5;
				// radius of the sphere inside the plane
				float minsph = 2.5;
				// value that "pushes" the sphere back from camera so you can have sphere thicker than the plane
				float artpush=0;
				
				// size of the main repeating grid of boxes that carve through the planes
				vec3 p2=vec3(100,100,100);

				if(time>80) {
					dist=min(3,-80+(time-88)*20);
					if (time>90) bigsphere=mix(80,26,smoothstep(0,1,(time-90)/4));
				}

				if (time>117) {
					bigsphere=(time-117)*400;
					p2 *= vec3(1,3,1);
					dist = (time-117)*70;
					artpush=5;
				} else if (time>100) {
					ani2=2;
					// cheat to deform the planes "organicaly"
					// we just offset the rotation according to the original ray direction
					// the reflection doesn't follow properly but it breaks the rigidity of the scene a lot
					vec3 br=normalize(uv.x*cx+uv.y*cy+fov*cz);
					adj=br.y*3-sin(br.z*3)+sin(br.x*3);
					size=5;
					minsph = 5;
					p2 = vec3(20,100,20);
				}
				if(time>120) { dist=300+(time-120)*5; p2 = vec3(140); ani2=1;}
				if(time>=124) { dist=200; minsph=0;artpush=0; size=1; ani2=0;}
				
				// the 3 planes are mostly rotating with a random speed
				planenorm.yz *= rot(sin(rest*.13*ani + rnd11(seed)*7)*1.57+adj);
				planenorm.xz *= rot(rest*.07*ani + rnd11(seed+.1)*7+adj*.7);
								
				if (time<24) {
					// first scene, the 3 planes are nearly flat
					planenorm=vec3(0+k*0.01,1,-0.02);
					dist = max(16-time,0);
					if(section==2) dist+= 10/(1+rest)-4;
					minsph = 0;
				} else if(time<40) {
					// second scene, the 3 planes are less flat
					planenorm.y+=4-pow(max(time-33,0),2)*.05;
					dist=10;
					float tre=min(time-24,6);
					minsph=min(tre,2.5);
					artpush=tre*6;
				}
				
				planenorm=normalize(planenorm);

				// find the collision with a plane of thickness "size"
				float dn = dot(r,planenorm);
				float ds = dot(s,planenorm);
				float dplane = (dist-ds)/dn;
				float dsi = abs(size/dn);

				// ray start is inside the thickness of the plane
				if(abs(dplane)<dsi) {
					d = 0;
					n = vec3(0);
					emit = vec3(0);
				} else if(dplane<d+dsi && dplane>dsi) { // hit the plane, works from both side of it
					d = dplane-dsi;
					n = -planenorm * sign(dn);
					emit = vec3(0);
				}
        
				// location of the hit with the plane
				vec3 uv = s+r*d;
    			
				// octree subdivision:
				// we split the space 3 times, each time we divide in 2 blocks at a random offset on each axes (so 8 blocks)
				// this lets us have a non-repeating slicing of our plane
				// we can then animate the slip location
				vec3 offp = floor(uv/p2)*p2;
				// p1 and p2 are the two extreme of the block containing the hit location
				vec3 p1=offp;
				p2+=offp;
				// we also want a random id different for each block
				vec3 id=offp+vec3(seed);
    
				for (int l=0; l<3; ++l) {
					float t3=time*0.5*ani2+l*.2;
					vec3 c = (mix(rnd33(id+floor(t3)),rnd33(id+floor(t3)+1),pow(smoothstep(0,1,fract(t3)),10)) * 0.5 + 0.25)*(p2-p1)+p1;
					p1=mix(p1,c,step(c,uv));
					p2=mix(c,p2,step(c,uv));
					id+=mix(vec3(0.03),vec3(0.1),step(c,uv));
				}

				// now each block contain a box that carve the plane
				// here we compute it's position and size
				vec3 cubepos=(p1+p2)*.5;
				vec3 cubesize=(p2-p1)*.5-0.3;
				
				// carving box intersection
				vec3 invd = 1/r;
  
				vec3 t0 = ((cubepos-cubesize) - s) * invd;
				vec3 t1 = ((cubepos+cubesize) - s) * invd;
				vec3 mi = min(t0, t1);
				vec3 ma = max(t0, t1);
  
				float front = min(min(ma.x,ma.y),ma.z);
				float back = max(max(mi.x,mi.y),mi.z);
  
				if(front>d && front > 0) {
					vec3 cur = step(abs(s+r*d-cubepos),cubesize);
					if (min(cur.x,min(cur.y,cur.z))>0) {
						// we hit a side of the cube, compute it's normal
						d = front;
						n = (1-clamp((ma-front)*1000,0,1)) * sign(t1-t0);
						emit = vec3(0);
					}
				}
    
				// in each block, there is also a sphere
				// to get it's position, we project the middle position of the block on plane
				vec3 mp=(p1+p2)*0.5;
				mp-=(dot(mp,planenorm)-dist)*planenorm;
				
				mp += planenorm*artpush;
				// lighting of the small sphere
				vec3 lglow=vec3(0);
				if (time>30 && rnd33(floor(mp/5)).x>.8) lglow=vec3(4+sin(time/8)*3,1,5);
				if (time>117) lglow=vec3(5,3.2,1.8);
				if (time>124) lglow=vec3(0);

				sphere(mp, minsph + artpush, lglow);
	
				if(d>dplane+dsi || d>=d2) {
					// if the intersection we found is beyond the thickness of the plane
					// we skip it, we want the ray to go through the plane
					// so we restore original ray hit values
					d=d2;
					n=n2;
					emit=emit2;
				}
	
				// for the pink sky section, I wanted to limit the size of the planes to a "big sphere"
				// it's not perfectly working, the sphere limits have no thickness
				// but it's good enough for my use
				vec3 bigp = s + r*d-msp;
				if (dot(bigp,bigp)>bigsphere*bigsphere){
					// if ray hit of the plane is outside the big sphere, we undo it
					d=d2;
					n=n2;
					emit=emit2;
				}

				d2=d;
				n2=n;
				emit2=emit;
				sphere(msp, bigsphere,vec3(0));
				vec3 bigp2 = s + r * d;
				if (abs(dot(bigp2,planenorm)-dist)>size) {
					// display the hit with the big sphere only if inside the thickness of the plane
					d=d2;
					n=n2;
					emit=emit2;
				}
			}
			
			// the main sphere of the intro
			// stay perfectly still all the time, and just glow a bit in the middle, it really is a lazy one :)
			vec3 spglow=vec3(1,0.5,0.2)*6.*c01(time*2-131)*c01(94-time);
			sphere(msp, 20, spglow);
			
			// ground plane intersection
			float dplane = (4-s.y)/r.y;
			if(dplane<d && dplane>0) {
				d = dplane;
				n = vec3(0,-sign(r.y),0);
				emit = vec3(0);
			}
    		
			// blend color with the sky depending on the distance
			float fog = exp(-max(d-100,0)/2000);
			col += alpha * skycol() * (1-fog);
			alpha *= fog;
			
			// early out if we didn't intersect anything
			if(d>10000) {
				break;
			}
			
			// go to collision point
			s = s + r * d;

			// accumulate emissive color			
			col += alpha * max(emit,0);
		
			if(j==2) break;
			
			// next reflection will be dimer (yeah we could do fresnel here but I think it looks cooler like that)
			alpha *= 0.7;

			// slight offset so the reflexion starts already out of the collision
			s-=r*0.01;
			// roughness if just a random amout at each integer coordinate
			float rough = 0.01+rnd33(floor(s)).x*0.5;
			if (time>90 && length(s-msp)<20.1) rough=.0;
			
			// "shading" model, just add a normalized random vector scaled by the roughness to the reflected normal
			// first time I saw that kind of reflection was in "HBC-00017: Newton Protocol" at Revision 2019
			// I love it's simplicity, even if a more physic based approach would probably look better but cost more
			r=normalize(reflect(r,n) + normalize(rnd23(frag+vec2(i*277,j*375)+fract(time)*1)-.5)*rough);
		}
	}
	col *= .6/steps;
	
	// trick to keep good precision even with a 8 bit per component framebuffer
	// we just divide by the largest RGB component and store that multiplier in the alpha (divided by 10, so we can recover values up to 10)
	float avg = max(1,max(col.x,max(col.y,col.z)));
	o1 = vec4(col/avg, avg*.1);
}

////////////////////////////
// POST-PROCESS           //
////////////////////////////

void m2(void)
{	
	time = m/44100.-1.;
	
	vec2 uv = gl_FragCoord.xy/res.xy;
	
	// get back the color from the first pass framebuffer
	vec4 value=texture(sb1,uv);    
    vec3 col=value.xyz*value.w*10.;

	// compute bloom by sampling the mipmaps of the first pass
	vec3 cumul = vec3(0);
	for(float i=0; i<32; ++i) {
		// spiral pattern with a per-pixel random rotation
		vec2 off=vec2((i+.1)/32,0)*rot(i*4+rnd23(gl_FragCoord.xy).x*7);
		vec4 cur = textureLod(sb1, uv + off*140/res, 4.5);
		cur.xyz *= cur.w*10;
		cumul += cur.xyz;
	}
	// apply the bloom 
	col += cumul * 0.01 * pow(smoothstep(.0,1.,dot(cumul.xyz,vec3(.1))),0.5);
	
	// vignetting
	col *= 1-length(uv-.5)*1.2;
	col *= 1.08*(2.51*col+0.03)/(col*(2.43*col+0.59)+0.14); // "filmic" tonemapping

	// global fade-in / fade-out
	col *= block(time-4,139,4,1);
	
	o1 = vec4(col, 1);
}

////////////////////////////
// AUDIO PASS             //
////////////////////////////

float note_freq(float note) { return 440*pow(2,note/12); }
const int tmajor[7] = int[7](0,2,4,5,7,9,11);
float major(float k) {
    return 3 + float(tmajor[int(k+70.)%7])+floor(k/7.)*12.; // B Major
}

//////////// synth params

// seed, overtones, sharpness, width
vec4 seeding=vec4(31,60,1.2,0.03);
// repeat, attack, sustain duration, release
vec4 enveloppe = vec4(4,1.,2.5,.5);

float decay = 1;

// AMP
float pregain = 0.2;
float gain = 1;

// enveloppe based on time t
float env(float t) {
    return c01(t/enveloppe.y) * c01(1-(t-enveloppe.y-enveloppe.z)/enveloppe.w);
}

// main synth of the intro
// play 40 frequencies randomly chosen as integer multiplier of the base frequency
// for each of thoses frequency, play 40 instances with slight phase and frequency offsets
float realsynth(vec3 note) {
	if(note.y<-98) return 0;

    float s=0.;    
    for(float i=0.; i<40; ++i) {
        float id = i+seeding.x;
		float cur = note.y;
		float freq = note_freq(cur);
		float over = rnd11(id);
		freq *= 1+floor(pow(over,seeding.z)*seeding.y);
		float amp = pow(1-over, note.x*decay);
		for(float j=1.; j<40; ++j) {
			float sub = freq * (1+(rnd11(id+j*.3)-.5) * seeding.w);
			s += amp*sin(sub*pi*2.*note.x + 2.*pi*rnd11(id+j*.7+.1)) * 2;
		}
    }

	s*=note.z*pregain;
	s *= sqrt(gain / (1369 + (gain - 1) * s * s));
	
	return s;
}

float pad(float time, float h) {
	float rt = mod(time, enveloppe.x);
	float ch = major(h+floor(rnd11(floor(time/enveloppe.x))*5)*2.-16);
	return realsynth(vec3(rt,ch,env(rt)));
}

float lead(float time) {
	float note = floor(time*4);
	float t=fract(time*4)/4;

	// melody from the "pink sky" part
	float val = int[16](3,-99,5,-99,7,6,-99,-99,5,7,6,8,7,5,6,4)[int(note)%16];
	if(mod(floor(note),4)==0)val+=mod(floor(note/16),4)*2-2;
	float mus = realsynth(vec3(t,major(val-4),env(t)));
	mus += realsynth(vec3(t,major(val),env(t)))*(0.5+sin(time)*0.5);
	mus += realsynth(vec3(t,major(val-12),env(t)))*(0.5+sin(time*0.7)*0.5);
	return mus;
}

float snare( float _phase ) {
  return clamp(sin( _phase * 800) * exp( -_phase * 30 ) , -0.5, 0.5);
}

// random growling sound
vec2 growl(float tt, float id) {
	seeding.y=rnd11(id)*40+3;
	seeding.z=rnd11(id+.1)*40;
	return abs(vec2(1,0)*rot(rnd11(id+.27)))*realsynth(vec3(tt,major(-32+floor(24*rnd11(id+.13))),1));
}

// fade smoothly from a random growling sound to the next
vec2 growl2(float t, float r) {
	float tt=fract(t/r);
	float nn=floor(t/r);
	return mix(growl((tt+1)*r,nn),growl(tt*r,nn+1), pow(smoothstep(0,1,tt),1));
}

void m3(void)
{			
	vec2 frag = gl_FragCoord.xy;

	float time = (frag.x + frag.y*1920) / 44100. - 1.03;

	vec2 mus = vec2(0);
	float beat = fract(time);
	
	// global control of the song parts
	vec2 lead1 = vec2(0.6,.4) * block(time-91,25.4,1,.1); // pink sky part
	vec2 lead3 = vec2(0.5) * block(time-34,30,1,.8); // sound for all the little spheres
	vec2 pad1 = 0.4*abs(vec2(sin(time*.2),cos(time*.25))) * block(time-24.5,68.5,8,4);
	vec2 bass = vec2(.7,.3)*block(time-36,80,.1,.1);
	vec2 drum = bass.yx;
	vec2 gro = vec2(1-.8*block(time-40,77,4,4));
	float lead2 = block(time-67,22,2,2); // glowy sphere music

	// pad (default seed values)
	//seeding=vec4(31,60,1.2,0.03);
	//enveloppe=vec4(4,1.,2.5,.5);
	float padoc = -16+lead2*8;
	mus += pad1*pad(time, padoc)*vec2(1.2,0.2);
	mus += pad1*pad(time+1, padoc+2) * chop(time*7)*vec2(0.7,0.8);
	mus += pad1*pad(time+2, padoc+4) * (0.5+0.5*chop(time*10))*vec2(0.2,1.2);
		
	// lead 2 (glowy sphere)
	seeding=vec4(20,60,40,0.06+0.055*sin(time/10)*sin(time/7));
	enveloppe=vec4(1,.01,0.01,.4);

	float chord = mod(floor(time*2), 8)-2;
	vec2 lead2b = 0.5*vec2(0.4,.6) * lead2;
	mus += lead2b*realsynth(vec3(fract(time),major(chord),exp(-fract(time)*3)));
	mus += lead2b*realsynth(vec3(fract(time),major(chord+3),exp(-fract(time)*3)));
	mus += lead2b*realsynth(vec3(fract(time*3),major(chord + mod(floor(time*3),4)*2 - 4),exp(-fract(time*3))));
	
	// lead 3 (sound of all the little spheres)
	seeding=vec4(77,30,20+cos(time/30)*17,0.02+cos(time)*.04);
	enveloppe=vec4(0.5,.01,0.06,.02);
	for (int i=0; i<12; ++i) {
		mus += lead3*pad(time-i%4-(i/4)*0.3, -0-i%4*2)*(4-i%4)*.15;
	}

	// lead 1 (pink sky part)
	seeding=vec4(22,60,12+sin(time/16)*10,0.013);
	enveloppe=vec4(1,.01,0.12,.11);
	pregain=10;
	gain=2;
	mus += lead1 * lead(time) * 0.07;
	mus += lead1 * lead(time-.5) * 0.02;
	mus += lead1 * lead(time-.25) * 0.01;
	
	// bass
	seeding.z = 60;
	mus += bass*0.13*realsynth(vec3(fract(time+.5),-40,exp(-fract(time*4)*4)));

	// growling sounds
	pregain=0.2;
	gain=1;
	seeding=vec4(22,60,2,0.07+1.0);
	enveloppe=vec4(1,.1,0.8,.1);

	// to produce some sfx, I just boost the growing a lot with appropriate fading
	// menacing sound when the wall approach the sphere, just before it stars glowing
	float crash=block(time-65.2,0.4,1.5,1);
	// crash just before the yellow part
	crash=max(crash,block(time-117.5,0.2,.5,3));
	// "click" when all the little purple spheres light's up
	crash=max(crash,block(time-30.1,0.1,.1,1));
	gro+=crash*5;
	decay = 0.1;
	vec2 gr = growl2(time, 8)*2;
	gr += growl2(time, 4);
	gr += growl2(time, 2);
	// add an extra glowing sound at the end part
	gr += growl2(time, 0.05)*0.5*block(time-124,10,4,8);
	// crank the gain to the max for the growling
	gr *= 100;
	gain = 2;
	gr *= sqrt(gain / (1369 + (gain - 1) * gr * gr));
	mus += gro*gr*0.15;

	// dunking the music when the kick hit
	float mub = c01(beat*100)*c01(exp(-beat*5));
	mus *= 1-mub;

	// kick
	float k = sin(beat*307.3)*cos(beat*100)*exp(-beat*4);
    k += sin(beat*200)*exp(-beat*20);
    mus += drum*max(-0.5,min(0.5,k));

	// snare
	mus += drum*snare(fract(time+0.5))*lead1;
	mus += drum*snare(fract(time/2+0.25))*2;
	mus += drum*snare(fract(time/4+0.0525))*2;
	
	// highhats
	float beat2 = min(fract(time*2), fract(time*6));
	mus += drum*(1-block(time-64,8,.1,.1))*fract(sin(beat2*142.454)*485.523) * exp(-beat2*10) * 0.1 * step(mod(time,16),12);
	
	// global fade-in and fade-out
	mus *= block(time-2,141,2,1);

	o1 = vec4(0,0,clamp(mus,-1.,1.));
}
