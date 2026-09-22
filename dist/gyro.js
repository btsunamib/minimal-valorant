import {Quaternion,Euler,Vector3,MathUtils} from './three.module.js';
const HALF=Math.sqrt(.5),fix=new Quaternion(-HALF,0,0,HALF),zAxis=new Vector3(0,0,1);
export function sensorQuaternion(alpha,beta,gamma,screenAngle=0){return new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(beta),MathUtils.degToRad(alpha),-MathUtils.degToRad(gamma),'YXZ')).multiply(fix).multiply(new Quaternion().setFromAxisAngle(zAxis,-MathUtils.degToRad(screenAngle)))}
export function sensorDelta(previous,current){const relative=previous.clone().invert().multiply(current);if(relative.w<0){relative.x*=-1;relative.y*=-1;relative.z*=-1;relative.w*=-1}const e=new Euler().setFromQuaternion(relative,'YXZ');return{yaw:e.y,pitch:e.x}}
// Legacy orientation is relative to the sensor axes on iOS. The newer
// screen API can report a different natural-orientation reference in WebViews.
export function screenSensorAngle(env){
 const legacy=env.orientation,modern=env.screen?.orientation;
 if(Number.isFinite(legacy))return((legacy%360)+360)%360;
 if(Number.isFinite(modern?.angle))return((modern.angle%360)+360)%360;
 return({'portrait-primary':0,'landscape-primary':90,'portrait-secondary':180,'landscape-secondary':270})[modern?.type]??0;
}
export class GyroAim{
 constructor(env,onStatus=()=>{}){this.env=env;this.onStatus=onStatus;this.status='off';this.enabled=false;this.previous=null;this.pending={yaw:0,pitch:0};this.latest=null;this.activeLast=false;this.lastEvent=0;this.angle=0;this.angleOffset=0;this.velocity={yaw:0,pitch:0};this.motionRate=0;this.generation=0;this.handle=e=>this.feed(e);this.rotate=()=>this.calibrate();}
 setAngleOffset(value){this.angleOffset=[0,90,-90,180].includes(Number(value))?Number(value):0;this.calibrate()}
 report(s){this.status=s;this.onStatus(s)}
 async enable(){if(this.enabled)return true;const w=this.env,gen=++this.generation;if(!w.isSecureContext){this.report('insecure');return false}if(!w.DeviceOrientationEvent){this.report('unsupported');return false}this.report('requesting');try{if(typeof w.DeviceOrientationEvent.requestPermission==='function'){const permission=await w.DeviceOrientationEvent.requestPermission();if(gen!==this.generation)return false;if(permission!=='granted'){this.report('denied');return false}}if(gen!==this.generation)return false;this.enabled=true;this.calibrate();w.addEventListener('deviceorientation',this.handle,true);w.addEventListener('orientationchange',this.rotate);w.screen?.orientation?.addEventListener?.('change',this.rotate);this.report('waiting');this.timer=setTimeout(()=>{if(this.enabled&&!this.latest)this.report('unavailable')},3000);return true}catch{this.report('denied');return false}}
 disable(){this.generation++;this.enabled=false;clearTimeout(this.timer);this.env.removeEventListener('deviceorientation',this.handle,true);this.env.removeEventListener('orientationchange',this.rotate);this.env.screen?.orientation?.removeEventListener?.('change',this.rotate);this.previous=null;this.latest=null;this.pending={yaw:0,pitch:0};this.activeLast=false;this.velocity={yaw:0,pitch:0};this.motionRate=0;this.report('off')}
 calibrate(){this.velocity={yaw:0,pitch:0};this.motionRate=0;this.previous=null;this.pending={yaw:0,pitch:0};this.activeLast=false;this.lastEvent=0;}
 feed(e){if(!this.enabled||!Number.isFinite(e.beta)||!Number.isFinite(e.gamma))return;const angle=(screenSensorAngle(this.env)+this.angleOffset+360)%360;const q=sensorQuaternion(e.alpha??0,e.beta,e.gamma,angle);this.latest=q;if(this.status!=='ready')this.report('ready');const now=Number.isFinite(e.timeStamp)?e.timeStamp:Date.now();if(!this.previous||angle!==this.angle||now-this.lastEvent>300){this.pending={yaw:0,pitch:0};this.velocity={yaw:0,pitch:0};this.motionRate=0;this.previous=q;this.angle=angle;this.lastEvent=now;return}const delta=sensorDelta(this.previous,q);const period=Math.max(.004,(now-this.lastEvent)/1000);this.previous=q;this.lastEvent=now;if(Math.abs(delta.yaw)>.38||Math.abs(delta.pitch)>.38){this.pending={yaw:0,pitch:0};this.velocity={yaw:0,pitch:0};return}this.motionRate+=(Math.hypot(delta.yaw,delta.pitch)/period-this.motionRate)*.3;this.pending.yaw+=delta.yaw;this.pending.pitch+=delta.pitch;}
 // Critically damped motion reconstruction preserves sub-pixel movements and
 // spreads sensor samples smoothly over 120/165/240 Hz render frames.
 consume(dt,active,sensitivity=1,smooth=.35,invert=false){
  if(!active||!this.enabled||this.status!=='ready'||!this.activeLast){this.pending={yaw:0,pitch:0};this.velocity={yaw:0,pitch:0};this.activeLast=!!(active&&this.enabled&&this.status==='ready');return{yaw:0,pitch:0}}
  const tau=(.010+MathUtils.clamp(smooth,0,1)*.042)/(1+Math.min(this.motionRate,3)*.32),omega=2/tau,t=Math.max(0,dt),decay=Math.exp(-omega*t),result={};
  for(const axis of ['yaw','pitch']){const error=this.pending[axis],v=this.velocity[axis],c=omega*error-v,next=(error+c*t)*decay;this.velocity[axis]=(v+omega*c*t)*decay;this.pending[axis]=next;result[axis]=(error-next)*sensitivity;}
  result.pitch*=invert?-1:1;return result;
 }
}
