export const FRAME_LIMITS=[0,60,90,120,144,165,240];
export class FramePacer{
 constructor(limit=0){this.setLimit(limit)}
 setLimit(limit){this.limit=FRAME_LIMITS.includes(Number(limit))?Number(limit):0;this.next=null;this.frames=0;this.sampleStart=null;this.fps=0;this.callbackStart=null;this.callbacks=0;this.callbackFPS=0;this.lastCallback=null;this.workMs=0}
 recordWork(ms){if(Number.isFinite(ms)&&ms>=0)this.workMs=this.workMs?this.workMs*.9+ms*.1:ms}
 due(now){if(this.lastCallback!==null&&now-this.lastCallback>2000){this.next=null;this.sampleStart=null;this.callbackStart=null;this.frames=0;this.callbacks=0;this.fps=0;this.callbackFPS=0;}this.lastCallback=now;
 if(this.callbackStart===null)this.callbackStart=now;this.callbacks++;if(now-this.callbackStart>=1000){this.callbackFPS=Math.round((this.callbacks-1)*1000/(now-this.callbackStart));this.callbacks=1;this.callbackStart=now;}
 if(this.limit){const interval=1000/this.limit;if(this.next!==null&&now+.15<this.next)return false;if(this.next===null||now-this.next>1000)this.next=now;this.next+=Math.max(1,Math.floor((now-this.next)/interval)+1)*interval;}
 if(this.sampleStart===null)this.sampleStart=now;this.frames++;if(now-this.sampleStart>=1000){this.fps=Math.round((this.frames-1)*1000/(now-this.sampleStart));this.frames=1;this.sampleStart=now;}return true;}
}
export function toggleKnifeSlot(current,lastGun=0){return current===2?(lastGun===1?1:0):2}
