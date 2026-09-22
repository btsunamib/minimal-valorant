export const WEAPONS={
 vandal:{name:'狂徒',en:'VANDAL',type:'步枪',damage:40,head:160,rate:.105,mag:25,reserve:100,reload:2.35,cost:2900,spread:.005,recoil:.025,range:70},
 phantom:{name:'幻影',en:'PHANTOM',type:'消音步枪',damage:39,head:140,rate:.088,mag:30,reserve:120,reload:2.2,cost:2900,spread:.004,recoil:.020,range:45},
 operator:{name:'冥驹',en:'OPERATOR',type:'狙击枪',damage:150,head:255,rate:1.3,mag:5,reserve:25,reload:3.2,cost:4700,spread:.019,recoil:.07,range:100},
 spectre:{name:'骇灵',en:'SPECTRE',type:'冲锋枪',damage:26,head:78,rate:.073,mag:30,reserve:120,reload:2.1,cost:1600,spread:.012,recoil:.017,range:30},
 judge:{name:'判官',en:'JUDGE',type:'自动霰弹枪',damage:17,head:34,rate:.4,mag:7,reserve:35,reload:2.5,cost:1850,spread:.063,recoil:.045,range:18,pellets:10},
 classic:{name:'标配',en:'CLASSIC',type:'半自动手枪',damage:26,head:78,rate:.22,mag:12,reserve:48,reload:1.65,cost:0,spread:.009,recoil:.03,range:40},
 knife:{name:'战术近战',en:'MELEE',type:'近战',damage:65,head:100,rate:.46,mag:0,reserve:0,reload:0,cost:0,range:2.8,recoil:.025}
};
export const SKINS={chaos:{name:'混沌序曲',sub:'狂徒专属 · 机械核心 · 击杀反馈',chaos:true,weapon:'vandal',color:0x55cfff,dark:0x292832,metal:0xa98047,css:'#88cfff',symbol:'',sound:.75},jade:{name:'翡翠脉冲',sub:'能量弹道 · 晶体终结',color:0xc5f46b,dark:0x183b31,metal:0x8caa83,css:'#c5f46b',symbol:'◈',sound:1},ion:{name:'离子光谱',sub:'电弧弹道 · 离子终结',color:0x5ee8ff,dark:0xb8cfda,metal:0x364c65,css:'#5ee8ff',symbol:'✧',sound:1.4},reaver:{name:'暗影收割',sub:'紫焰弹道 · 灵魂终结',color:0xb685ff,dark:0x231934,metal:0x867997,css:'#b685ff',symbol:'♜',sound:.65},ember:{name:'赤焰龙鳞',sub:'熔火弹道 · 烈焰终结',color:0xff8354,dark:0x482b24,metal:0xbc8860,css:'#ff8354',symbol:'✦',sound:.8}};
export const KNIVES={kuronami:'黑波之刃',mercy:'怜悯之刃',butterfly:'蝴蝶刀',karambit:'爪子刀',blade:'能量刃'};
export const MAP_W=56, MAP_D=48, CELL=2;
export const SOLIDS=[
 [-28,0,1,50,5],[28,0,1,50,5],[0,-24,57,1,5],[0,24,57,1,5],
 [-17,-5,8,8,4.6],[17,-5,8,8,4.6],[-8,6,6,6,3.7],[8,6,6,6,3.7],
 [0,-6,8,8,5.8],[0,17,7,3,3.3],[-20,13,5,4,2.5],[20,13,5,4,2.5],
 [-23,-15,4,3,2.2],[23,-15,4,3,2.2],[-11,-17,3,4,2.7],[11,-17,3,4,2.7],
 [-17,4,3,3,1.6],[17,4,3,3,1.6],[-3,-18,3,3,1.8],[3,-18,3,3,1.8],
 [-3,2,2,2,1.5],[3,2,2,2,1.5]
];
export const SITES=[{x:-18,z:-15,name:'A'},{x:18,z:-15,name:'B'}];
export function collision(x,z,r=.38){return SOLIDS.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2+r&&Math.abs(z-cz)<d/2+r)}
export function pathfind(sx,sz,tx,tz){
 const W=28,H=24,idx=(x,z)=>z*W+x,cx=x=>Math.max(0,Math.min(W-1,Math.floor((x+28)/2))),cz=z=>Math.max(0,Math.min(H-1,Math.floor((z+24)/2)));
 const start=idx(cx(sx),cz(sz));let goal=idx(cx(tx),cz(tz));
 const walk=i=>!collision(i%W*2-27,Math.floor(i/W)*2-23,.34);
 if(!walk(goal)){let nearest=-1,d=Infinity;for(let i=0;i<W*H;i++)if(walk(i)){const n=(i%W*2-27-tx)**2+(Math.floor(i/W)*2-23-tz)**2;if(n<d){d=n;nearest=i}}goal=nearest}
 const open=[start],from=new Map(),g=new Map([[start,0]]),closed=new Set(),h=i=>Math.abs(i%W-goal%W)+Math.abs(Math.floor(i/W)-Math.floor(goal/W));
 while(open.length){open.sort((a,b)=>(g.get(a)+h(a))-(g.get(b)+h(b)));const cur=open.shift();if(cur===goal){const out=[];let n=cur;while(n!==start){out.unshift({x:n%W*2-27,z:Math.floor(n/W)*2-23});n=from.get(n)}return out}closed.add(cur);const x=cur%W,z=Math.floor(cur/W);for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nx>=W||nz<0||nz>=H)continue;const ni=idx(nx,nz);if(closed.has(ni)||!walk(ni))continue;const ng=g.get(cur)+1;if(ng<(g.get(ni)??Infinity)){from.set(ni,cur);g.set(ni,ng);if(!open.includes(ni))open.push(ni)}}}return[];
}
export function absorbDamage(hp,armor,amount){const used=Math.min(armor,amount*.66);return{hp:Math.max(0,hp-(amount-used)),armor:Math.max(0,armor-used)}}
export function rankInfo(rr){const names=['黑铁','青铜','白银','黄金','铂金','钻石','超凡','神话','无畏'];const tier=Math.min(26,Math.floor(rr/100));return{name:names[Math.floor(tier/3)]+' '+['I','II','III'][tier%3],progress:Math.floor(rr%100)}}
export function roundResult(attackers,defenders,planted,time,bombTime){if(planted&&bombTime<=0)return{side:'attack',reason:'爆能器引爆'};if(!planted&&attackers===0)return{side:'defend',reason:'进攻方全灭'};if(defenders===0)return{side:'attack',reason:'防守方全灭'};if(!planted&&time<=0)return{side:'defend',reason:'回合时间结束'};return null}
