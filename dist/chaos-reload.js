// Reconstructed from the 60 fps Level 3 preview, source 10.05–12.65 s.
// Screen-visible event timing is referenced; 3D depth/hand joints are authored.
export const CHAOS_RELOAD_FPS=60,CHAOS_RELOAD_FRAMES=156,CHAOS_RELOAD_DURATION=2.6;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function sample(keys,f){let i=0;while(i<keys.length-2&&f>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],t=clamp((f-a[0])/(b[0]-a[0]));return a.slice(1).map((v,j)=>v+(b[j+1]-v)*t)}
// frame, translation x/y/z, pitch/yaw/roll. Roll presents the open reactor.
const gun=[
 [0,0,0,0,0,0,0],[4,.05,-.015,.025,-.07,-.06,-.04],
 [8,.07,-.035,.05,-.11,-.08,-.08],[12,-.015,-.045,.025,.12,-.09,-.18],
 [18,-.045,-.015,.035,.15,-.11,-.26],[24,-.046,-.01,.038,.16,-.12,-.27],
 [36,-.05,-.015,.035,.14,-.12,-.26],[48,-.075,-.02,.025,.12,-.10,-.24],
 [60,-.09,-.02,.02,.11,-.08,-.25],[70,-.09,-.015,.02,.14,-.08,-.26],
 [76,-.11,-.05,.06,.06,-.08,-.31],[80,-.105,-.065,.07,.02,-.08,-.33],
 [88,-.11,-.05,.05,.06,-.10,-.30],[94,-.10,-.015,.025,.25,-.13,-.22],
 [98,-.06,0,.015,.62,-.16,-.12],[102,-.055,.005,0,.82,-.17,-.10],
 [110,-.05,.01,0,.86,-.16,-.07],[120,-.045,.015,0,.88,-.15,-.06],
 [132,-.04,.005,0,.76,-.12,-.04],[140,-.015,-.005,0,.32,-.06,-.02],
 [148,0,-.004,0,.04,0,0],[156,0,0,0,0,0,0]];
// Right palm remains the core's parent until the impact frame, avoiding floating props.
const right=[
 [0,.035,-.19,.026,0,0,0,.85],[8,.24,-.15,.02,.2,0,-.4,.55],
 [14,.53,-.15,.04,.1,0,-.7,.2],[48,.53,.23,-.20,.2,.2,.3,.4],
 [56,.48,.42,-.22,.3,.2,.3,.55],[62,.32,.48,-.24,.4,.2,.3,.7],
 [68,.19,.44,-.24,.5,.1,.1,.8],[72,.09,.28,-.23,.75,0,0,.7],
 [76,0,.122,-.23,1.57,0,0,.08],[79,0,.10,-.23,1.57,0,0,.04],
 [87,0,.10,-.23,1.57,0,0,.02],[94,.04,.10,-.16,1.2,0,.12,.3],
 [101,.11,-.06,-.04,.4,0,.1,.7],[110,.035,-.19,.026,0,0,0,.85],
 [156,.035,-.19,.026,0,0,0,.85]];
const left=[
 [0,-.015,-.09,-.52,0,0,-.35,.85],[88,-.015,-.09,-.52,0,0,-.35,.85],
 [94,-.13,-.03,-.35,.3,-.3,-.6,.55],[100,-.12,.025,-.245,.45,-.5,-.6,.7],
 [105,-.107,.035,-.23,.55,-.5,-.8,.85],[112,-.08,.012,-.215,.7,-.3,-1.1,.85],
 [120,-.075,-.015,-.23,.65,-.1,-1.05,.8],[130,-.10,-.06,-.27,.4,0,-.7,.65],
 [142,-.03,-.095,-.44,.1,0,-.45,.75],[150,-.015,-.09,-.52,0,0,-.35,.85],[156,-.015,-.09,-.52,0,0,-.35,.85]];
export function sampleChaosReload(seconds){const frame=clamp(Number.isFinite(seconds)?seconds:0,0,CHAOS_RELOAD_DURATION)*60,g=sample(gun,frame),r=sample(right,frame),l=sample(left,frame);return{
 frame,position:g.slice(0,3),rotation:g.slice(3,6),right:{position:r.slice(0,3),rotation:r.slice(3,6),curl:r[6]},left:{position:l.slice(0,3),rotation:l.slice(3,6),curl:l[6]},
 burst:clamp((frame-12)/28),burstVisible:frame>=12&&frame<58,
 beam:frame<12?0:frame<20?(frame-12)/8:frame<40?1:clamp((58-frame)/18),
 oldCore:frame<14,heldCore:frame>=56&&frame<77,newCore:frame>=77,
 seat:clamp((frame-77)/7),ignite:clamp((frame-104)/13),
 collar:frame<98?0:frame<118?(frame-98)/20*Math.PI*1.25:Math.PI*1.25*(1-clamp((frame-138)/18)),
 stage:frame<12?'抬枪':frame<58?'旧核心碎裂':frame<77?'送入新核心':frame<95?'压入核心':frame<117?'旋动机械环':frame<140?'能量重新启动':'回到持枪姿态'
};}
