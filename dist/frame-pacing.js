export const FRAME_LIMITS=[0,60,90,120,165,240];
export class FramePacer{
 constructor(limit=0){this.setLimit(limit)}
 setLimit(limit){this.limit=FRAME_LIMITS.includes(Number(limit))?Number(limit):0;this.next=null;this.frames=0;this.sampleStart=null;this.fps=0}
 due(now){if(this.limit){const interval=1000/this.limit;if(this.next!==null&&now+.15<this.next)return false;if(this.next===null||now-this.next>1000)this.next=now;this.next+=Math.max(1,Math.floor((now-this.next)/interval)+1)*interval;}
 if(this.sampleStart===null)this.sampleStart=now;this.frames++;if(now-this.sampleStart>=1000){this.fps=Math.round((this.frames-1)*1000/(now-this.sampleStart));this.frames=1;this.sampleStart=now;}return true;}
}
export function toggleKnifeSlot(current,lastGun=0){return current===2?(lastGun===1?1:0):2}
