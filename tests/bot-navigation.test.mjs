import test from 'node:test';
import assert from 'node:assert/strict';
import {resetBotNavigation,stepBotNavigation} from '../dist/bot-navigation.js';

const move=(b,dx,dz)=>{b.x+=dx;b.z+=dz;};
const bot=()=>{const b={x:0,z:0,floor:0};resetBotNavigation(b);return b;};

test('Stable goals retain unfinished routes across the old one-second replan interval',()=>{
 const b=bot(),goal={x:40,z:0};let plans=0;
 const api={move,speed:3.4,plan:()=>{plans++;return[{x:0,z:0},{x:15,z:0},goal];}};
 for(let i=0;i<900;i++)stepBotNavigation(b,goal,1/60,api);
 assert.equal(plans,1);assert.equal(b.x,40);assert(b.pathFinished);
 for(let i=0;i<120;i++)stepBotNavigation(b,goal,1/60,api);
 assert.equal(plans,1,'A completed route stays completed');
});

test('Moving goals are snapshotted and replan without walking back through a visible old center',()=>{
 const b=bot(),goal={x:40,z:0};let plans=0;
 const api={move,speed:3.4,trace:()=>true,plan:()=>{plans++;return[{x:0,z:0},{...goal}];}};
 for(let i=0;i<180;i++)stepBotNavigation(b,goal,1/60,api);
 const x=b.x;goal.x=50;stepBotNavigation(b,goal,1/60,api);
 assert.equal(plans,2);assert(b.x>x);assert.equal(b.pathGoal.x,50);
});

test('Blocked actors recover with bounded replanning and do not report running in place',()=>{
 const b=bot(),goal={x:10,z:0};let blocked=true,plans=0;
 const api={speed:3.4,move:(b,dx,dz)=>{if(!blocked)move(b,dx,dz);},plan:()=>{plans++;return[goal];}};
 for(let i=0;i<120;i++)stepBotNavigation(b,goal,1/60,api);
 assert(plans>=2&&plans<=3);assert.equal(b.moving,false);assert.equal(b.x,0);
 blocked=false;for(let i=0;i<240;i++)stepBotNavigation(b,goal,1/60,api);
 assert.equal(b.x,10);assert(b.pathFinished);
});

test('Duplicate waypoints never divide by zero; missing routes retry without a per-frame search',()=>{
 const b=bot(),goal={x:2,z:0},api={move,speed:3.4,plan:()=>[{x:0,z:0},{x:0,z:0},goal,goal]};
 for(let i=0;i<60;i++)stepBotNavigation(b,goal,1/60,api);
 assert.equal(b.x,2);assert(Number.isFinite(b.z));assert(b.pathFinished);
 resetBotNavigation(b);let plans=0;
 for(let i=0;i<120;i++)stepBotNavigation(b,goal,1/60,{...api,plan:()=>{plans++;return[];}});
 assert.equal(plans,2);
});

test('Respawn clears stale goals and stuck state; displacement after arrival finds a new route',()=>{
 const b=bot(),goal={x:2,z:0};let plans=0;
 const api={move,speed:3.4,plan:()=>{plans++;return[goal];}};
 for(let i=0;i<60;i++)stepBotNavigation(b,goal,1/60,api);
 b.x=-2;stepBotNavigation(b,goal,1/60,api);assert.equal(plans,2);
 b.pathStuck=5;resetBotNavigation(b,.3);assert.equal(b.pathGoal,null);assert.equal(b.pathStuck,0);assert.equal(b.pathFinished,false);
 stepBotNavigation(b,goal,.1,api);assert.equal(plans,2);
 stepBotNavigation(b,goal,.3,api);assert.equal(plans,3);
});
