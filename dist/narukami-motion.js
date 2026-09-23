// Hand-traced from Riot's 60 Hz Level 2 showcase; interpolated 3D reconstruction.
// Source ranges and remaining differences are recorded in docs/narukami-reference.md.
export const NARU_FPS=60;
export const NARU_CLIPS={drawLong:{frames:72,start:.90},drawKunai:{frames:42,start:13.20},toKunai:{frames:192,start:8.35},toLong:{frames:180,start:22.55}};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
// [frame, bolster x/y, blade screen angle, axial twist, left palm x/y, hand openness, water length]
const L=[0,-.27,-.55,-1.38,.15,-.94,-.82,.05,1];
const K=[0,.65,-.62,.94,-.08,-.89,-.52,.08,0];
const end=(p,f)=>[f,...p.slice(1)];
const tracks={
 drawLong:[[0,.80,-1.12,0,0,-.9,-.9,1,0],[6,.74,-.44,-.15,.1,-.9,-.78,1,0],[12,.69,-.08,-2.4,.3,-.9,-.78,.8,0],[18,.61,-.10,-4.8,.4,-.9,-.75,.7,0],[25,.56,-.20,-7.65,.1,-.3,-.34,.25,0],[31,.59,-.22,-4.83,.02,.08,-.28,.1,0],[38,.65,-.22,-4.47,.12,-.35,-.35,.02,.6],[45,.69,-.23,-4.47,.12,-.73,-.45,.02,1],[53,.62,-.25,-3.6,.4,-.9,-.6,0,1],[61,.46,-.28,-1.95,.6,-.95,-.75,0,1],end(L,72)],
 drawKunai:[[0,.80,-1.1,0,0,-.92,-.83,1,0],[4,.77,-.5,.15,.1,-.92,-.7,.8,0],[9,.70,-.22,-1.7,.35,-.92,-.65,.85,0],[14,.68,-.23,-3.4,.3,-.92,-.62,.8,0],[19,.60,-.3,-5.5,.15,-.9,-.57,.7,0],[25,.64,-.42,-7.4,.3,-.9,-.54,.4,0],[32,.66,-.58,-5.32,0,-.89,-.52,.1,0],[42,...K.slice(1,3),K[3]-Math.PI*2,...K.slice(4)]],
 toKunai:[L,[10,.49,-.25,1.82,.15,-.9,-.77,.1,1],[20,.66,-.24,1.82,.08,-.55,-.44,.03,1],[35,.67,-.24,1.82,.08,-.50,-.35,.03,1],[47,.67,-.24,1.82,.08,-.48,-.34,.03,1],[65,.67,-.24,1.82,.08,-.48,-.34,.03,0],[104,.67,-.24,1.82,.08,-.50,-.36,.03,0],[117,.61,-.27,2.9,.15,-.55,-.48,.8,0],[126,.55,-.24,5.2,.35,-.62,-.52,.9,0],[136,.51,-.33,7.5,.3,-.7,-.56,.8,0],[146,.49,-.42,7.1,-.3,-.8,-.56,.6,0],[159,.60,-.57,7.23,-.08,-.86,-.53,.3,0],[178,...K.slice(1,3),K[3]+Math.PI*2,...K.slice(4)],[192,...K.slice(1,3),K[3]+Math.PI*2,...K.slice(4)]],
 toLong:[K,[10,.44,-.30,1.2,.12,-.85,-.53,.75,0],[18,.46,-.18,-1.5,.35,-.82,-.5,.9,0],[26,.54,-.22,-4.3,.15,-.6,-.45,.55,0],[35,.62,-.25,-4.47,.03,-.12,-.34,.08,0],[49,.62,-.25,-4.47,.03,-.15,-.35,.03,0],[68,.63,-.25,-4.47,.03,-.61,-.45,.03,1],[98,.63,-.25,-4.47,.03,-.73,-.49,.03,1],[112,.67,-.30,-3.5,.6,-.85,-.57,0,1],[124,.71,-.38,-1.65,.8,-.88,-.67,0,1],[136,.50,-.44,-.5,.5,-.9,-.73,0,1],[149,.09,-.52,-1.12,.2,-.94,-.81,0,1],end(L,166),end(L,180)]
};
function at(track,f){let i=1;while(i<track.length&&f>track[i][0])i++;if(i===track.length)return track.at(-1).slice();const a=track[i-1],b=track[i],t=smooth(a[0],b[0],f);return [f,...a.slice(1).map((v,j)=>mix(v,b[j+1],t))]}
export function sampleNaru({clip=null,seconds=0,form='long',attack=-1,heavy=false,side=0}={}){
 const spec=NARU_CLIPS[clip],f=spec?clamp(Number.isFinite(seconds)?seconds*60:0,0,spec.frames):0;
 let p=spec?at(tracks[clip],f):(form==='kunai'?K:L).slice();
 if(spec&&f===spec.frames)p=(clip.endsWith('Kunai')?K:L).slice();
 let trail=spec&&((clip==='drawLong'&&f>7&&f<58)||(clip==='drawKunai'&&f>5&&f<32)||(clip==='toKunai'&&f>110&&f<160)||(clip==='toLong'&&((f>10&&f<36)||(f>105&&f<155))));
 if(!spec&&attack>=0&&attack<=1){const s=Math.sin(attack*Math.PI),a=(side%2?1:-1);p[1]+=(heavy?-.35:-.7*a)*s;p[2]+=(heavy?.55:.28)*s;p[3]+=(heavy?2.5:a*2.0)*s;p[4]+=.6*s;trail=true;}
 const forming=clip==='toLong'?smooth(49,68,f):clip==='drawLong'?smooth(31,45,f):0;
 const dissolving=clip==='toKunai'?smooth(47,65,f):0;
 const droplets=clip==='toKunai'&&f>46&&f<116?Math.sin(clamp((f-46)/70)*Math.PI):clip==='toLong'&&f>48&&f<90?Math.sin((f-48)/42*Math.PI):0;
 const stage=!clip?(form==='kunai'?'苦无':'长刀'):clip.startsWith('draw')?(f<30?'指间旋转':f<46&&clip==='drawLong'?'左手凝水成刃':'收刀就绪'):clip==='toKunai'?(f<47?'反手展刃':f<66?'水刃化珠':f<113?'散水':f<160?'翻指接刀':'苦无就绪'):(f<35?'旋转刀柄':f<49?'左手接刃':f<69?'抽水凝刃':f<105?'长刀成形':f<166?'翻腕反握':'长刀就绪');
 return {frame:f,bolster:[p[1],p[2],0],angle:p[3],twist:p[4],left:[p[5],p[6],.02],open:p[7],water:p[8],trail:!!trail,droplets,forming,dissolving,stage};
}
// The actual visible form commits when water forms/dissolves, not when F is pressed.
export class NaruMotion{
 constructor(form='long'){this.form=form==='kunai'?'kunai':'long';this.clip=null;this.seconds=0;}
 draw(){this.clip=this.form==='long'?'drawLong':'drawKunai';this.seconds=0;return this.clip;}
 transform(){if(this.clip)return null;this.clip=this.form==='long'?'toKunai':'toLong';this.seconds=0;return this.clip;}
 advance(dt){if(!this.clip)return;this.seconds+=Math.max(0,dt);const f=this.seconds*60;if(this.clip==='toKunai'&&f>=65)this.form='kunai';if(this.clip==='toLong'&&f>=68)this.form='long';if(f>=NARU_CLIPS[this.clip].frames){this.clip=null;this.seconds=0;}}
 cancel(){this.clip=null;this.seconds=0;}
}
