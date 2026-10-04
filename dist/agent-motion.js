import * as T from './three.module.js';
export const GUN_DRAW_RATE=1.3;
export function castTiming(kind){return {duration:['beam','rocket','revive'].includes(kind)?1.05:.78,release:['dash','updraft','satchel'].includes(kind)?.22:.42};}
export function castPose(kind,seconds){const {duration,release}=castTiming(kind),t=Math.max(0,Math.min(1,seconds/duration)),rise=Math.sin(Math.PI*t),throwing=['smoke','slow','molly','grenade','flash','satchel'].includes(kind),bow=['shock','reveal','beam'].includes(kind);return{t,release:seconds>=release,left:[-.26-rise*.07,-.62+rise*.31,-.6-rise*.15],right:[.25-rise*.05,-.63+rise*.34,-.55-(throwing&&seconds>=release?.30*rise:0)],rotation:throwing?-rise*1.8:bow?-rise*.5:-rise*.9,orb:seconds<release||['heal','revive','wall','rebirth'].includes(kind),bow};}
// Skill casting reuses the imported viewmodel hand meshes and bone rig.
// No procedural palms, fingers, gun or device geometry is displayed.
export class AgentHands{
 constructor(getArt=()=>null){this.getArt=typeof getArt==='function'?getArt:()=>null;this.rig=null;this.visible=new Map();this.ready=false;this.position=null;this.rotation=null;}
 update(agent,kind,seconds){const rig=this.getArt()?.rig;if(rig!==this.rig){this.hide();this.rig=rig;this.position=rig?.model.position.clone();this.rotation=rig?.model.quaternion.clone();}this.ready=!!rig?.meshes.some(m=>m.userData.nativeHand);if(!this.ready)return;
  for(const mesh of rig.meshes){if(!this.visible.has(mesh))this.visible.set(mesh,mesh.visible);mesh.visible=!!mesh.userData.nativeHand;}
  // Adapt the existing cast timing to the actual mesh. This movement is an
  // adaptation, rather than an original agent ability animation in the package.
  const p=castPose(kind,seconds),rise=Math.sin(p.t*Math.PI);rig.model.position.copy(this.position).add(new T.Vector3(0,rise*.14,-rise*.08));rig.model.quaternion.copy(this.rotation).premultiply(new T.Quaternion().setFromEuler(new T.Euler(rise*-.18,0,0)));
 }
 hide(){for(const [mesh,visible]of this.visible)mesh.visible=visible;if(this.rig&&this.position){this.rig.model.position.copy(this.position);this.rig.model.quaternion.copy(this.rotation);}this.visible.clear();this.rig=null;this.ready=false;this.position=null;this.rotation=null;}
}
