import test from 'node:test';
import assert from 'node:assert/strict';
import {BotTactics,BOT_PERSONALITIES,resetBotMind,inBotView,chooseBotTarget,chooseBotSkill} from '../dist/bot-tactics.js';
import {MapNavigation} from '../dist/map-navigation.js';

const sites=[{name:'A',x:30,z:0,floor:0},{name:'B',x:0,z:30,floor:0}];
const bot=(seed=0,team=0)=>{const b={seed,team,x:0,z:0,floor:0,hp:100,alive:true,mesh:{rotation:{y:0}}};resetBotMind(b);return b;};
const context=(b,extra={})=>({now:1,mode:'bomb',attackTeam:0,sites,bomb:{planted:false,carrier:null,timer:35},allies:[b],round:1,visible:null,player:{team:0},los:()=>true,phaseTime:95,...extra});
const skills=['heal','teamheal','revive','reveal','shock','molly','smoke','flash','dash','beam','orbital','stim'].map(kind=>({kind}));

test('Five stable personalities have different risk, range and cooperation preferences',()=>{
 assert.equal(new Set(BOT_PERSONALITIES.map(p=>p.id)).size,5);
 const a=bot(0),b=bot(1);assert(a.personality.aggression>b.personality.aggression);assert(a.personality.range<b.personality.range);
 const identity=a.personality;a.ai.memory={x:8};a.ai.reloadUntil=20;resetBotMind(a,9);
 assert.equal(a.personality,identity);assert.equal(a.ai.memory,null);assert.equal(a.ai.reloadUntil,0);assert(a.skillAt>9);
});

test('Perception requires facing beyond close range and retains a current threat',()=>{
 const b=bot();assert(inBotView(b,{x:0,z:-15}));assert(!inBotView(b,{x:0,z:15}));assert(inBotView(b,{x:0,z:2}));
 const current={x:0,z:-12,hp:100},other={x:0,z:-10,hp:100};b.target=current;
 assert.equal(chooseBotTarget(b,[current,other]),current);
 assert.equal(chooseBotTarget(b,[]),null);
});

test('Last seen memory snapshots coordinates, radio reports arrive after a delay and expire',()=>{
 const t=new BotTactics(),a=bot(),b=bot(3),opponent={x:12,z:4,floor:1};
 t.observe(a,opponent,1);opponent.x=99;
 assert.equal(t.intel(a,1.1).x,12);assert.equal(t.intel(b,1.5),null);
 assert.equal(t.intel(b,1.61).x,12);assert.equal(t.intel(a,10),null);assert.equal(t.intel(b,10),null);
 t.reset();assert.equal(t.intel(b,2),null);
});

test('Continuous sightings do not postpone squad reports forever',()=>{
 const t=new BotTactics(),a=bot(),b=bot(3),enemy={x:10,z:3,floor:0};
 for(let time=0;time<=1;time+=.1)t.observe(a,enemy,time);
 assert(t.intel(b,1));
});

test('Gunfire gives coarse locations, respects hearing range and fades',()=>{
 const t=new BotTactics(),b=bot(),enemy={team:1,x:10.2,z:4.1,floor:0};
 t.sound(enemy,1);enemy.x=100;
 assert.deepEqual(t.hear(b,1.1),{x:9,z:3,floor:0,at:1,source:'sound'});
 assert.equal(t.hear(b,6),null);t.sound({...enemy,x:80},7);assert.equal(t.hear(b,7.2),null);
 const ally=bot(1);t.sound(ally,8);assert.equal(t.hear(b,8.1),null);
});

test('Team mode patrols without omniscient enemy goals and searches remembered positions',()=>{
 const t=new BotTactics(),b=bot();let ctx=context(b,{mode:'team'});
 assert.equal(t.decide(b,ctx).kind,'patrol');
 const e={x:8,z:0,floor:0};t.observe(b,e,1);e.x=100;
 assert.equal(t.decide(b,{...ctx,now:2}).goal.x,8);
 assert.equal(t.decide(b,{...ctx,now:10}).kind,'patrol');
});

test('Round plans vary, lurkers split lanes, bomb carriers commit to planting sites',()=>{
 const t=new BotTactics(),b=bot(0),lurker=bot(2);
 const first=t.decide(b,context(b)),second=t.decide(b,context(b,{round:2}));
 assert.notDeepEqual(first.goal,second.goal);
 const flank=t.decide(lurker,context(lurker));assert.equal(flank.kind,'flank');assert.equal(flank.fallback.name,undefined);assert.equal(flank.fallback.z,30);
 const carry=t.decide(lurker,context(lurker,{bomb:{carrier:lurker,planted:false}}));assert.equal(carry.kind,'advance');assert.equal(carry.goal.x,30);
 const late=t.decide(lurker,context(lurker,{phaseTime:20}));assert.equal(late.kind,'advance');assert.equal(late.fallback.x,30);
});

test('Support escorts an advancing carrier; defenders spread and rotate from real intel',()=>{
 const t=new BotTactics(),support=bot(3),carrier={alive:true,x:18,z:0};
 assert.equal(t.decide(support,context(support,{bomb:{planted:false,carrier}})).kind,'escort');
 const entry=bot(5,1),anchor=bot(6,1),allies=[entry,anchor,bot(7,1)];
 const a=t.decide(entry,context(entry,{allies})),b=t.decide(anchor,context(anchor,{allies}));assert.notDeepEqual(a.goal,b.goal);
 t.observe(entry,{x:30,z:0,floor:0},1);
 assert.equal(t.decide(entry,context(entry,{allies,now:2})).kind,'rotate');
 assert.equal(t.decide(anchor,context(anchor,{allies,now:2})).kind,'guard');
});

test('One defuser remains assigned while teammates cover, then a survivor takes over',()=>{
 const t=new BotTactics(),a=bot(5,1),b=bot(6,1),allies=[a,b],bomb={planted:true,x:8,z:0,floor:0,timer:30};
 a.x=4;const ctx=context(a,{bomb,allies});
 assert.equal(t.decide(a,ctx).kind,'defuse');b.x=7.9;
 assert.equal(t.decide(b,{...ctx,now:2}).kind,'cover');
 a.alive=false;assert.equal(t.decide(b,{...ctx,now:3}).kind,'defuse');
});

test('A player defusing is covered and an expiring spike outranks low-health retreat',()=>{
 const t=new BotTactics(),b=bot(6,1),player={alive:true,x:8,z:0,team:1},bomb={planted:true,x:8,z:0,floor:0,timer:8,defuse:1};
 const ctx=context(b,{player,bomb,allies:[player,b],playerDefusing:true});assert.equal(t.decide(b,ctx).kind,'cover');
 ctx.playerDefusing=false;assert.equal(t.decide(b,ctx).kind,'defuse','A paused player checkpoint does not block bot defuse');
 bomb.defuse=0;ctx.playerDefusing=false;b.hp=10;assert.equal(t.decide(b,{...ctx,visible:{x:8,z:0}}).kind,'defuse');
});

test('Combat cover is reachable, spaced and committed instead of changing each frame',()=>{
 const t=new BotTactics(),b=bot(),enemy={x:10,z:0,floor:0};b.hp=20;
 const points=[{x:-3,z:0,floor:0},{x:0,z:3,floor:0},{x:0,z:-3,floor:0}];
 const n={areas:points,center:a=>a,path:(x,z,tx,tz,f,tf)=>[{x:tx,z:tz,floor:tf}]};
 const ctx=context(b,{visible:enemy,navigation:n,los:(a)=>a.x>=0});
 const first=t.decide(b,ctx);assert.equal(first.kind,'retreat');assert.equal(first.goal.x,-3);
 b.x=-1;const second=t.decide(b,{...ctx,now:1.5});assert.deepEqual(first.goal,second.goal);
});

test('Healing targets injured allies/self safely, does not waste charges at full health',()=>{
 const b=bot(3),ally={alive:true,x:5,z:0,hp:40};let ctx=context(b,{allies:[b,ally]});
 assert.equal(chooseBotSkill(b,ctx,skills,()=>true).kind,'heal');
 ally.hp=100;b.hp=50;assert.equal(chooseBotSkill(b,ctx,skills,()=>true).options.alt,true);
 b.hp=100;assert.equal(chooseBotSkill(b,ctx,skills,()=>true),null);
 ctx.visible={x:4,z:0};assert.notEqual(chooseBotSkill(b,ctx,skills,()=>true)?.kind,'heal');
});

test('Damage utility avoids teammates and low-health bots prefer smoke',()=>{
 const b=bot(1),enemy={x:12,z:0,hp:100},ally={alive:true,x:12,z:1,hp:100};
 const allowed=i=>['molly','smoke'].includes(skills[i].kind),ctx=context(b,{visible:enemy,allies:[b,ally]});
 assert.equal(chooseBotSkill(b,ctx,skills,allowed),null);
 b.hp=35;assert.equal(chooseBotSkill(b,ctx,skills,allowed).kind,'smoke');
 b.hp=100;ctx.allies=[b];assert.equal(chooseBotSkill(b,ctx,skills,allowed).kind,'molly');
});

test('Weighted navigation chooses a safer branch while retaining collision verification',()=>{
 const areas=[{id:0,x:0,z:0,links:[1,2]},{id:1,x:5,z:0,links:[0,3]},{id:2,x:5,z:4,links:[0,3]},{id:3,x:10,z:0,links:[1,2]}].map(a=>({...a,bounds:[a.x-.1,a.z-.1,a.x+.1,a.z+.1],heights:[0,0,0,0],walk:{x:a.x,z:a.z,floor:0},walkable:true}));
 const n=Object.create(MapNavigation.prototype);n.areas=areas;n.byId=new Map(areas.map(a=>[a.id,a]));n.areaAt=x=>x===0?areas[0]:areas[3];n.transition=()=>true;n.trace=()=>true;
 const route=n.path(0,0,10,0,0,0,(a,b)=>b.x===5&&b.z===0?100:Math.hypot(a.x-b.x,a.z-b.z));
 assert(route.some(p=>p.z===4));assert(!route.some(p=>p.x===5&&p.z===0));
});
