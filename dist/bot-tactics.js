const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=a=>({x:a.x,z:a.z,floor:a.floor??0});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const BOT_PERSONALITIES=Object.freeze([
 Object.freeze({id:'entry',label:'敢打敢冲',aggression:.9,teamwork:.55,patience:3,range:10,strafe:.8,reaction:.88,pace:1.06}),
 Object.freeze({id:'anchor',label:'沉稳守点',aggression:.25,teamwork:.5,patience:9,range:18,strafe:.25,reaction:1.1,pace:.96}),
 Object.freeze({id:'lurker',label:'侧翼游走',aggression:.65,teamwork:.25,patience:5,range:14,strafe:.9,reaction:.96,pace:1.02}),
 Object.freeze({id:'support',label:'照顾队友',aggression:.4,teamwork:.95,patience:6,range:16,strafe:.35,reaction:1,pace:1}),
 Object.freeze({id:'flex',label:'灵活应变',aggression:.7,teamwork:.7,patience:4,range:12,strafe:.65,reaction:.92,pace:1.03})
]);
export const BOT_ACTIONS={advance:'推进',escort:'跟队支援',flank:'侧翼包抄',guard:'架枪守点',rotate:'回防支援',search:'搜点',investigate:'听声排查',retreat:'撤回掩体',duel:'交火',defuse:'拆包',cover:'掩护拆包',postplant:'守包',patrol:'巡查',reload:'换弹'};

export function resetBotMind(bot,now=0){
 bot.personality??=BOT_PERSONALITIES[bot.seed%BOT_PERSONALITIES.length];
 bot.ai={memory:null,heard:null,visible:null,scanAt:now+(bot.seed%5)*.035,thinkAt:0,
  decision:null,postKey:null,post:null,patrol:0,patrolAt:0,combatUntil:0,combatGoal:null,
  ammoWeapon:null,ammo:0,reloadUntil:0,burst:0,shots:0,lookAwayUntil:0,skillAim:null};
 bot.skillAt=now+1+(bot.seed%5)*.2;bot.castUntil=0;bot.shootTimer=.35;bot.aimPitch=0;
}

// Close surprises can be heard/seen from behind, distant targets require facing.
export function inBotView(bot,target){
 const dx=target.x-bot.x,dz=target.z-bot.z,d=Math.hypot(dx,dz);
 return d<4||d>0&&(-Math.sin(bot.mesh?.rotation.y??0)*dx-Math.cos(bot.mesh?.rotation.y??0)*dz)/d>.2;
}

export function chooseBotTarget(bot,visible){
 let chosen=null,best=Infinity;
 for(const e of visible){let score=distance(bot,e);if(e===bot.target)score*=.72;
  if(e.lastAttacker===bot)score*=.9;if(e.hp<35)score*=.9;
  if(score<best){best=score;chosen=e;}}
 return chosen;
}

export class BotTactics {
 constructor(){this.points=new WeakMap();this.reset();}
 reset(){this.reports=[new Map(),new Map()];this.noises=[];this.defusers=[null,null];}
 observe(bot,enemy,now){
  if(!enemy)return;
  const report={...point(enemy),enemy,at:now,source:'sight',ready:now+.6};
  bot.ai.memory=report;
  const previous=this.reports[bot.team].get(enemy);
  this.reports[bot.team].set(enemy,{...report,ready:previous&&now-previous.at<1?previous.ready:report.ready});
 }
 sound(actor,now){
  this.noises.push({...point(actor),team:actor.team,at:now});
  this.noises=this.noises.filter(n=>now-n.at<3).slice(-32);
 }
 intel(bot,now){
  let known=bot.ai.memory&&now-bot.ai.memory.at<8?bot.ai.memory:null;
  for(const report of this.reports[bot.team].values())if(report.ready<=now&&now-report.at<7&&(!known||report.at>known.at))known=report;
  return known;
 }
 hear(bot,now){
  for(let i=this.noises.length-1;i>=0;i--){const n=this.noises[i];if(now-n.at>2.5)break;
   if(n.team===bot.team||distance(bot,n)>26||n.at<=(bot.ai.heard?.at??-1))continue;
   // Sound supplies a coarse location, never a reference to a hidden actor.
   bot.ai.heard={x:Math.round(n.x/3)*3,z:Math.round(n.z/3)*3,floor:n.floor,at:n.at,source:'sound'};break;
  }
  return bot.ai.heard&&now-bot.ai.heard.at<4?bot.ai.heard:null;
 }
 navPoints(navigation){
  if(!navigation)return[];
  if(!this.points.has(navigation))this.points.set(navigation,navigation.areas.filter(a=>a.walkable!==false).map(a=>navigation.center(a)));
  return this.points.get(navigation);
 }
 post(bot,center,{navigation,allies=[],los},key,min=3,max=9){
  if(bot.ai.postKey===key)return bot.ai.post;
  const angle=(bot.seed*2.4+bot.ai.patrol*1.8)*1.0;
  const desired={x:center.x+Math.cos(angle)*(min+max)/2,z:center.z+Math.sin(angle)*(min+max)/2};
  const candidates=this.navPoints(navigation).filter(p=>distance(p,center)>=min&&distance(p,center)<=max&&Math.abs(p.floor-(center.floor??0))<1.5);
  candidates.sort((a,b)=>{
   const score=p=>distance(p,desired)+allies.filter(e=>e!==bot&&e.alive&&distance(e,p)<2.2).length*5;
   return score(a)-score(b);
  });
  // Covering positions should actually see the objective they protect.
  const selected=candidates.slice(0,8).find(p=>!los||los(p,center))||candidates[0]||center;
  bot.ai.postKey=key;bot.ai.post=point(selected);return bot.ai.post;
 }
 combatPosition(bot,enemy,ctx,retreat){
  const ai=bot.ai,now=ctx.now;
  if(ai.combatGoal&&now<ai.combatUntil&&ai.combatRetreat===retreat)return ai.combatGoal;
  const d=distance(bot,enemy),dx=(enemy.x-bot.x)/Math.max(.01,d),dz=(enemy.z-bot.z)/Math.max(.01,d);
  const sign=(Math.floor(now/(1.3+bot.personality.patience*.15))+bot.seed)%2?1:-1;
  const desired=retreat?{x:bot.x-dx*5,z:bot.z-dz*5}:{x:bot.x-dz*sign*2.5,z:bot.z+dx*sign*2.5};
  let candidates=this.navPoints(ctx.navigation).filter(p=>distance(p,bot)>.7&&distance(p,bot)<8&&Math.abs(p.floor-(bot.floor??0))<1.2);
  if(!ctx.navigation)candidates=[{...desired,floor:bot.floor??0}];
  const scored=candidates.map(p=>({p,score:distance(p,desired)+Math.abs(distance(p,enemy)-bot.personality.range)*.18+
   (retreat&&ctx.los?.(p,enemy)?16:0)+ctx.allies.filter(a=>a!==bot&&a.alive&&distance(a,p)<1.7).length*5})).sort((a,b)=>a.score-b.score);
  let selected=point(bot);
  for(const {p}of scored.slice(0,5)){
   if(retreat&&distance(p,enemy)<d+1&&ctx.los?.(p,enemy))continue;
   if(ctx.navigation){const route=ctx.navigation.path(bot.x,bot.z,p.x,p.z,bot.floor??0,p.floor);
    if(!route.length||distance(route.at(-1),p)>1)continue;
    let length=0,previous=bot;for(const q of route){length+=distance(previous,q);previous=q;}
    if(length>12)continue;
   }
   selected=point(p);break;
  }
  ai.combatGoal=selected;ai.combatRetreat=retreat;ai.combatUntil=now+(retreat?2.5:1.4+bot.personality.patience*.13);
  return selected;
 }
 decide(bot,ctx){
  const {now,mode,attackTeam,sites,bomb,allies,round,visible}=ctx,ai=bot.ai,p=bot.personality;
  const intel=this.intel(bot,now),heard=this.hear(bot,now),attacking=bot.team===attackTeam;
  const site=sites[(bot.seed+round)%sites.length],urgent=mode!=='team'&&bomb.planted&&!attacking&&bomb.timer<12;
  const result=(kind,goal,fallback=site,extra={})=>({kind,goal:point(goal),fallback:point(fallback),speed:3.4*p.pace,...extra});
  // Protect the half-defuse checkpoint; an expiring spike outranks retreat.
  const threat=visible||intel&&now-intel.at<3&&distance(bot,intel)<20&&intel;
  const retreat=ai.reloadUntil>now||ctx.blind||bot.hp<27+(1-p.aggression)*24;
  if(threat&&(visible||retreat)&&!urgent&&!bot.plantProgress&&!bot.defuseProgress){
   const d=distance(bot,threat);
   if(retreat)return result(ai.reloadUntil>now?'reload':'retreat',this.combatPosition(bot,threat,ctx,true),site,{speed:3.6});
   if(d>p.range+6&&p.aggression>.6)return result('duel',visible,site,{speed:2.6});
   return result('duel',p.strafe>.5?this.combatPosition(bot,visible,ctx,false):bot,site,{speed:1.8});
  }
  if(mode!=='team'&&bomb.planted){
   if(attacking)return result('postplant',this.post(bot,bomb,ctx,'planted:'+round),bomb);
   const active=allies.find(a=>a.alive&&(a===ctx.player?ctx.playerDefusing:a.defuseProgress>0));
   if(!this.defusers[bot.team]?.alive)this.defusers[bot.team]=allies.filter(a=>a.alive&&a!==ctx.player).sort((a,b)=>distance(a,bomb)-distance(b,bomb)||(a.seed-b.seed))[0];
   const defuser=active||this.defusers[bot.team];
   if(defuser===bot)return result('defuse',bomb,bomb);
   // Cover bots approach with the retake, then spread around the defuser.
   return result('cover',this.post(bot,bomb,ctx,'retake:'+round,3.2,7),bomb);
  }
  if(mode==='team'){
   if(intel)return result('search',intel,site);
   if(heard)return result('investigate',heard,site);
   if(ai.decision&&bot.pathFinished&&now>=ai.patrolAt){ai.patrol++;ai.patrolAt=now+1.5+p.patience*.3;ai.postKey=null;}
   const roam=sites[(bot.seed+round+ai.patrol)%sites.length];
   return result('patrol',this.post(bot,roam,ctx,'roam:'+round+':'+ai.patrol,1,6),roam);
  }
  if(attacking){
   const primary=sites[(round-1+bot.team)%sites.length];
   const carrier=bomb.carrier?.alive?bomb.carrier:null;
   const carrierSite=carrier===ctx.player?sites.reduce((a,s)=>distance(carrier,s)<distance(carrier,a)?s:a,primary):primary;
   const chosen=carrier===ctx.player&&distance(carrier,carrierSite)<24?carrierSite:primary;
   if(carrier===bot)return result('advance',chosen,chosen);
   if(intel&&now-intel.at<4&&distance(bot,intel)<23&&p.teamwork>.6)return result('rotate',intel,chosen);
   if(carrier&&p.teamwork>.8&&distance(carrier,chosen)<30&&distance(bot,carrier)>8)return result('escort',carrier,chosen);
   const flank=p.id==='lurker'&&sites.length>1&&ctx.phaseTime>30;
   const target=flank?sites[(sites.indexOf(chosen)+1)%sites.length]:chosen;
   return result(flank?'flank':'advance',this.post(bot,target,ctx,'attack:'+round+':'+target.name,2,6),target,{routeStyle:flank?'flank':'direct'});
  }
  if(intel&&now-intel.at<5){
   const threatened=sites.reduce((a,s)=>distance(intel,s)<distance(intel,a)?s:a,site);
   if(distance(intel,threatened)<24&&(p.id!=='anchor'||distance(site,threatened)<12||allies.filter(a=>a.alive).length<=2))
    return result('rotate',this.post(bot,threatened,ctx,'rotate:'+round+':'+threatened.name),threatened);
  }
  if(heard&&distance(bot,heard)<15&&p.aggression>.6)return result('investigate',heard,site);
  if(bot.pathFinished&&now>=ai.patrolAt){ai.patrol++;ai.patrolAt=now+p.patience+3;ai.postKey=null;}
  return result('guard',this.post(bot,site,ctx,'guard:'+round+':'+ai.patrol),site);
 }
 routeCost(bot,ctx){
  if(bot.ai.decision?.routeStyle!=='flank')return null;
  const threat=this.intel(bot,ctx.now),start=point(bot),goal=bot.ai.decision.goal;
  const dx=goal.x-start.x,dz=goal.z-start.z,length=Math.hypot(dx,dz)||1;
  const side=bot.seed%2?1:-1;
  return (a,b)=>{
   const lateral=((b.x-start.x)*dz-(b.z-start.z)*dx)/length;
   const exposure=threat?Math.max(0,16-distance(b,threat))*.18:0;
   return Math.max(.1,distance(a,b))*(1+exposure+(lateral*side<1?.25:0));
  };
 }
}

// Context-aware utility choice. Controlled pets/walls need dedicated control,
// so bots only select abilities they can complete without trapping their team.
export function chooseBotSkill(bot,ctx,skills,available){
 const {visible,now,allies,los}=ctx,ai=bot.ai,enemy=visible||ctx.intel,d=enemy?distance(bot,enemy):Infinity;
 const safe=!visible||d>20;
 const friends=allies.filter(a=>a!==bot&&a.alive&&distance(a,bot)<18&&los(bot,a));
 const injured=friends.filter(a=>a.hp<70).sort((a,b)=>a.hp-b.hp)[0];
 const pick=(kind,options={},aim=null)=>{const index=skills.findIndex(s=>s.kind===kind);return index>=0&&available(index)?{index,kind,options,aim}:null;};
 let skill;
 if(safe&&injured&&(skill=pick('heal',{},injured)))return skill;
 if(safe&&bot.hp<60&&!bot.kit?.healing&&(skill=pick('heal',{alt:true})))return skill;
 if(safe&&injured&&!bot.kit?.channelHeal&&(skill=pick('teamheal')))return skill;
 const dead=safe&&allies.find(a=>!a.alive&&distance(bot,a)<11&&los(bot,a));
 if(dead&&(skill=pick('revive',{},dead)))return skill;
 if(!enemy)return null;
 const noFriendsAtTarget=!allies.some(a=>a.alive&&distance(a,enemy)<5);
 if(visible&&d<24&&noFriendsAtTarget&&(skill=pick('orbital',{pos:point(enemy)},enemy)))return skill;
 if(visible&&d<30&&(skill=pick('knives',{},enemy)||pick('rebirth',{},enemy)))return skill;
 if(d<30&&(visible||now-enemy.at<3)&&(skill=pick('beam',{},enemy)))return skill;
 if(safe&&now-(enemy.at??now)<3&&(skill=pick('seekers')))return skill;
 if((ai.reloadUntil>now||bot.hp<45)&&visible&&d>7){
  const pos=bot.ai.decision?.goal||point(bot);
  if(skill=pick('smoke',{pos},bot.agent==='sarge'?null:{...point(bot),x:bot.x+(pos.x-bot.x)*.4,z:bot.z+(pos.z-bot.z)*.4,y:(bot.floor??0)+.6}))return skill;
 }
 if(visible&&d>7&&(bot.personality.aggression>.6||bot.hp<45)&&(skill=pick('dash',{},bot.hp<45?bot.ai.decision.goal:enemy)))return skill;
 if(d<30&&now-(enemy.at??now)<4&&(skill=pick('reveal',{charge:clamp((d-14)/38,0,1)},enemy)))return skill;
 if(d>6&&d<23&&noFriendsAtTarget&&now-(enemy.at??now)<1.8){
  if(skill=pick('shock',{charge:clamp((d-14)/38,0,1)},enemy)||pick('molly',{},enemy)||pick('slow',{},enemy))return skill;
 }
 if(visible&&d>8&&d<18&&!friends.some(a=>distance(a,enemy)<12)&&now>=ai.lookAwayUntil&&(skill=pick('flash',{alt:!!(bot.seed%2)},enemy)))return skill;
 if(friends.length>=2&&!visible&&(skill=pick('stim',{},bot)))return skill;
 return null;
}
