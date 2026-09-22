// Reconstructed from the 60 fps Demonstone Level 3 preview (1.62–2.82 s).
// Hand-authored 3D poses; source video does not supply skeleton/depth data.
export const CHAOS_FPS=60, CHAOS_FRAMES=72, CHAOS_DURATION=1.2;
const keys=[
// frame, x,y,z, pitch,yaw,roll, pointing-hand, ignition
[0,.04,-.55,.15,-.15,0,-.2,0,0],
[4,.10,-.30,.10,.82,-.05,.05,0,0],
[8,.07,-.10,.02,.88,-.12,.04,0,0],
[12,.03,-.04,0,.87,-.14,.02,.12,0],
[16,0,0,0,.89,-.15,0,.58,0],
[20,0,.01,0,.91,-.16,0,.95,0],
[24,0,.01,0,.91,-.16,0,1,.25],
[28,-.01,.015,0,.93,-.16,-.015,1,1],
[34,-.02,.015,0,.96,-.14,-.01,.85,1],
[40,-.025,.01,0,.98,-.10,-.01,.46,1],
[46,-.03,0,0,.98,-.08,-.02,.14,1],
[50,-.025,-.005,0,.91,-.07,-.015,0,1],
[54,-.02,-.01,0,.72,-.04,-.01,0,1],
[58,-.01,-.01,0,.43,-.02,0,0,1],
[62,0,-.005,0,.12,0,0,0,1],
[66,0,.003,0,-.03,0,0,0,1],
[72,0,0,0,0,0,0,0,1]];
export function sampleChaosEquip(seconds){const f=Math.max(0,Math.min(72,seconds*60));let k=0;while(k<keys.length-2&&f>keys[k+1][0])k++;const a=keys[k],b=keys[k+1],t=(f-a[0])/(b[0]-a[0]);const v=a.slice(1).map((x,i)=>x+(b[i+1]-x)*t);return{frame:f,position:v.slice(0,3),rotation:v.slice(3,6),point:v[6],energy:v[7]};}
