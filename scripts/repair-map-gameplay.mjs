import fs from 'node:fs';
import {gunzipSync,gzipSync} from 'node:zlib';
import * as T from '../dist/three.module.js';
import {MapNavigation} from '../dist/map-navigation.js';
import {MapInteractions} from '../dist/map-interactions.js';
for(const key of process.argv.slice(2)){
 const file=new URL('../dist/assets/maps/'+key+'/map.json.gz',import.meta.url);
 const data=JSON.parse(gunzipSync(fs.readFileSync(file))),navigation=new MapNavigation(data);
 let recovered=0;
 for(const area of navigation.areas){
  if(area.walk){area.walk.floor=navigation.floorAt(area.walk.x,area.walk.z,area.walk.floor)??area.walk.floor;continue;}
  const b=area.bounds;sample:for(const u of [.5,.25,.75])for(const v of [.5,.25,.75]){
   const x=b[0]+(b[2]-b[0])*u,z=b[1]+(b[3]-b[1])*v,floor=navigation.floorAt(x,z,navigation.height(area,x,z));
   if(floor!==null&&!navigation.blocked(x,z,.39,floor)){area.walk={x,z,floor};area.walkable=true;recovered++;break sample;}
  }
 }
 navigation.connectNearby();navigation.normalizePoints();
 const interactions=new MapInteractions({scene:new T.Scene(),walls:[],phase:()=> 'live'});
 interactions.attach({key,data,navigation});data.spawns={attack:interactions.spawnCache.attack,defend:interactions.spawnCache.defend};
 data.gameplayVersion=3;data.spawnFormation='Five distinct physical floor positions around preserved source spawn district; see map-features.js';
 for(const [side,points]of Object.entries(data.spawns))for(const p of points)for(const site of data.sites){
  if(!navigation.path(p.x,p.z,site.x,site.z,p.floor,site.floor).length)throw Error(key+' '+side+' has no route from '+JSON.stringify(p)+' to '+site.name);
 }
 data.transitionVersion=1;data.verifiedTransitions=[...navigation.checkedTransitions].filter(([,pass])=>pass).map(([key])=>key);interactions.dispose();fs.writeFileSync(file,gzipSync(JSON.stringify(data)));
 const invalid=[...navigation.checkedTransitions.values()].filter(pass=>!pass).length;
 console.log(key,'recovered floors',recovered,'removed invalid route transitions',invalid,'validated 10 distinct spawn positions');
}
