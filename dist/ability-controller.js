import {getAgent} from './agents-data.js?v=20261005-ai-packs1';
// Input and release state are separate from gameplay effects. Charges are only
// spent at a successful commit, so selecting/cancelling cannot waste utility.
export const instantAbility=(agent,kind)=>kind==='updraft'||kind==='dash'||kind==='satchel'||kind==='rebirth'||agent==='wushu'&&kind==='smoke';
export class AbilityController {
 constructor(runtime,actor){this.runtime=runtime;this.actor=actor;this.current=null;this.primaryHeld=false;}
 get busy(){return !!this.current;}
 get blocking(){return !!this.current||!!this.actor.kit?.control;}
 cancel(){this.current=null;this.primaryHeld=false;this.runtime.stopControl(this.actor);this.runtime.stopHeal(this.actor);}
 select(index){const e=this.actor,r=this.runtime,kind=getAgent(e.agent).skills[index]?.kind;if(!kind)return false;
  if(r.reuse(e,index))return true;
  if(['knives','beam','rocket'].includes(kind)&&e.kit?.ultimate?.kind===kind&&e.kit.ultimate.ammo>0){this.current=null;this.primaryHeld=false;e.kit.ultimate.equipped=true;return true;}
  if(!r.available(e,index))return false;
  if(this.current?.index===index){this.current=null;return true;}
  this.current={index,kind,age:0,phase:instantAbility(e.agent,kind)?'release':'equip',clock:0,charge:0,bounces:0,rotation:0,points:[]};this.primaryHeld=false;
  return true;
 }
 options(alt=false){const c=this.current;return {alt,charge:c?.charge||0,bounces:c?.bounces||0,rotation:c?.rotation||0,points:c?.points||[],pos:c?.targetPoint};}
 commit(alt=false){const c=this.current;if(!c)return false;if(!this.runtime.cast(this.actor,c.index,this.options(alt)))return false;c.phase='recover';c.clock=0;return true;}
 press(alt=false){const r=this.runtime,e=this.actor,c=this.current;
  if(e.kit?.control){r.controlFire(e);return true;}
  if(!c)return false;
  if(c.phase==='equip'&&c.age<.2)return true;
  if(c.phase==='flying'){this.runtime.reuse(e,c.index);c.phase='recover';c.clock=0;return true;}if(c.phase==='recover'||c.phase==='release')return true;
  if(['shock','reveal'].includes(c.kind)&&e.agent==='hunter'){if(alt)c.bounces=(c.bounces+1)%3;else{this.primaryHeld=true;c.phase='charge';c.charge=0;}return true;}
  if(c.kind==='wall'&&alt){c.rotation+=Math.PI/2;return true;}
  if(e.agent==='sarge'&&['smoke','orbital'].includes(c.kind)){if(c.kind==='smoke'){if(alt){if(c.points.length)this.commit();}else this.addMapPoint(r.target(e,55));}else this.commit();return true;}
  if(c.kind==='teamheal'){if(!alt){this.primaryHeld=true;c.phase='channel';r.startHeal(e);}return true;}
  c.alt=alt;c.phase='release';c.clock=0;this.primaryHeld=!alt;return true;
 }
 addMapPoint(pos){const c=this.current;if(!c)return;const i=c.points.findIndex(p=>Math.hypot(p.x-pos.x,p.z-pos.z)<2);if(i>=0)c.points.splice(i,1);else if(c.points.length<this.actor.kit.charges[c.index])c.points.push({...pos});}
 release(){this.primaryHeld=false;const c=this.current;if(c?.phase==='charge')this.commit();if(c?.phase==='channel'){this.runtime.stopHeal(this.actor);c.phase='ready';}}
 tick(dt){const c=this.current;if(!c)return;if(!this.actor.alive||this.runtime.api.phase()!=='live'){this.cancel();return;}c.age+=dt;c.clock+=dt;
  if(c.phase==='equip'&&c.age>=.35)c.phase='ready';
  if(c.phase==='charge')c.charge=Math.min(1,c.charge+dt);
  if(c.phase==='release'&&c.clock>=(['dash','updraft','satchel','smoke'].includes(c.kind)?.08:.2))this.commit(c.alt);
  if(c.phase==='recover'&&c.clock>=.45){if(this.actor.agent==='guide'&&c.kind==='flash'&&this.runtime.objects.some(o=>o.owner===this.actor&&o.payload==='hawk'))c.phase='flying';else this.current=null;}if(c.phase==='flying'&&!this.runtime.objects.some(o=>o.owner===this.actor&&o.payload==='hawk')){c.phase='recover';c.clock=0;}
 }
 hint(){const c=this.current,k=this.actor.kit;if(k?.control)return k.control.kind==='drone'?'WASD 移动 · 跳跃上升 / 蹲下下降 · 开火标记 · C 退出':'WASD 移动 · 开火扑咬 · Q 退出';if(!c)return k?.dashReady?'逐风已就绪 · 再按 E 冲刺':'';
  if(['shock','reveal'].includes(c.kind))return `按住开火蓄力 ${Math.round(c.charge*100)}% · 松开射箭 · 右键/瞄准：${c.bounces} 次反弹`;
  if(c.kind==='wall')return '开火放置 · 右键/瞄准旋转屏障';if(c.kind==='heal')return '开火治疗准星队友 · 右键/瞄准治疗自己';
  if(c.kind==='flash'&&this.actor.agent==='phoenix')return '开火向左弯曲 · 右键/瞄准向右弯曲';
  if(this.actor.agent==='sarge'&&c.kind==='smoke')return `点击地图选择烟幕 (${c.points.length}/${k.charges[c.index]}) · 右键/瞄准确认`;
  if(this.actor.agent==='sarge'&&c.kind==='orbital')return '点击战术地图选点 · 开火确认轰炸';
  if(c.kind==='teamheal')return `按住开火治疗队友 · 剩余能量 ${Math.ceil(k.healPool)}`;return '开火释放 · 选择武器取消';
 }
}
