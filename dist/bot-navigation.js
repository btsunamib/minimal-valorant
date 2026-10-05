const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=p=>({x:p.x,z:p.z,floor:p.floor??0});

export function resetBotNavigation(bot,delay=0){
 bot.path=[];bot.pathTimer=delay;bot.pathGoal=null;bot.pathEnd=null;
 bot.pathStuck=0;bot.pathFinished=false;bot.moving=false;
}

// Keep a route until its destination changes or movement actually stalls.
// Replacing it every second sends bots back to their area's starting center.
export function stepBotNavigation(bot,goal,dt,{plan,move,speed,trace}){
 bot.moving=false;
 if(!goal||!Number.isFinite(goal.x)||!Number.isFinite(goal.z))return;
 goal=point({...goal,floor:goal.floor??bot.floor??0});
 bot.pathTimer=Math.max(0,(bot.pathTimer||0)-dt);
 const changed=!bot.pathGoal||distance(goal,bot.pathGoal)>1.25||Math.abs(goal.floor-bot.pathGoal.floor)>.6;
 const displaced=bot.pathFinished&&bot.pathEnd&&(distance(bot,bot.pathEnd)>.75||Math.abs((bot.floor??0)-bot.pathEnd.floor)>.6);
 const needsRoute=changed||displaced||bot.pathStuck>=.8||(!bot.path?.length&&!bot.pathFinished);
 if(needsRoute&&bot.pathTimer===0){
  bot.path=(plan(bot,goal)||[]).map(point);
  bot.pathGoal=goal;bot.pathEnd=bot.path.length?point(bot.path.at(-1)):null;
  bot.pathFinished=false;bot.pathStuck=0;bot.pathTimer=bot.path.length ? .45 : 1;
  // On a chase/recovery replan, skip the old area's center only if the
  // next segment is physically traversable from the current position.
  if(bot.path.length>1&&trace?.(point({...bot,floor:bot.floor??0}),bot.path[1]))bot.path.shift();
 }
 // A route can contain repeated centers/portals. Consume all reached
 // points before normalizing a direction, so duplicate points never NaN.
 while(bot.path?.length&&distance(bot,bot.path[0])<.002)bot.path.shift();
 const next=bot.path?.[0];
 if(!next){bot.pathFinished=!!bot.pathEnd;return;}
 const dx=next.x-bot.x,dz=next.z-bot.z,d=Math.hypot(dx,dz),step=Math.min(d,Math.max(0,speed)*dt);
 if(step<=0)return;
 const before=point(bot);
 move(bot,dx/d*step,dz/d*step);
 const traveled=distance(before,bot),progress=d-distance(bot,next);
 bot.moving=traveled>1e-6;
 bot.pathStuck=traveled<step*.05||progress<step*.02?bot.pathStuck+dt:0;
 return {dx,dz};
}
