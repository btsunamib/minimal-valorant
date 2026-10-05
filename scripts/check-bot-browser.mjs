// Real WebGL/team QA. CHROME_BINARY is required; PLAYWRIGHT_MODULE is optional.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=new URL('../dist',import.meta.url).pathname,out=process.env.MINIVAL_BOT_QA_OUT||new URL('../docs/qa/ai-packs1',import.meta.url).pathname;fs.mkdirSync(out,{recursive:true});
const inject=`
const qaDrawFrame=()=>{const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;try{frame(performance.now()+100);}finally{window.requestAnimationFrame=raf;}};
window.botQA={renderer,scene,camera,player,entities,prefs,prepareMatchMap,preloadAgentModels,startMatch,beginLive,openOverlay,
 async asset(key,variant='base'){toMenu();setTab('collection');const spec=IMPORTED_WEAPONS[key];openWeaponDetail(spec.weapon);if(spec.weapon==='knife')collectionLook.knife=key;else collectionLook.skin=key;collectionLook.importedVariants[key]=variant;renderCollection();buildWeapon(spec.weapon,true);await Promise.all([weaponArt.readyPromise,weaponArt.metadataPromise]);if(!weaponArt.ready)throw Error('Asset failed: '+key);weaponArt.action('idle',1,false);renderImportedControls(weaponArt);qaDrawFrame();return {key:weaponArt.key,meshes:weaponArt.rig.meshes.length,frames:weaponArt.rig.sequences.reduce((s,a)=>s+a.frames,0)};},
 action(name){nativePreviewMode='action';weaponArt.action(name,1,false);weaponArt.seek(Math.floor(weaponArt.timeline.sequence.frames/2));qaDrawFrame();return weaponArt.timeline.sequence.name;},
 feedback(){nativeFeedback.play('champions21',5,true);nativeFeedback.update(.15);document.getElementById('killBadge').classList.remove('hidden');},
 async touch(){toMenu();prefs.controls='touch';touchDevice=true;startMatch();beginLive();await Promise.all([weaponArt.readyPromise,weaponArt.metadataPromise]);paused=false;updateHUD();qaDrawFrame();paused=true;},
 active:()=>activeMap,async map(key){document.getElementById('mapSelect').value=key;await prepareMatchMap();},
 prepare(){startMatch();beginLive();paused=true;player.alive=false;bomb.carrier=entities.find(b=>b.team===attackTeam);},
 step(dt){if(phase!=='live')return;gameTime+=dt;phaseTime-=dt;scene.updateMatrixWorld(true);mapInteractions.tick(dt,[player,...entities]);tickAgents(dt);updateBots(dt);updateEffects(dt);objective(dt);},
 view(){const b=entities.find(b=>b.alive&&b.team===0)||entities.find(b=>b.alive);if(b){camera.position.set(b.x,(b.floor||0)+1.73,b.z);camera.rotation.set(0,b.mesh.rotation.y,0,'YXZ');}followSun(sun,camera.position);renderer.autoClear=true;scene.updateMatrixWorld(true);renderer.render(scene,camera);updateHUD();},
 snap(){return {phase,software:renderer.software||false,time:gameTime,bots:entities.map(b=>({seed:b.seed,style:b.personality.id,hp:b.hp,alive:b.alive,x:b.x,z:b.z,floor:b.floor,shots:b.ai.shots,ammo:b.ai.ammo,order:b.ai.decision?.kind,goal:b.ai.decision?.goal,stuck:b.pathStuck})),programs:renderer.info.programs.map(p=>p.diagnostics?.runnable===false)}}};`;
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');const data=fs.readFileSync(file);res.end(file.endsWith('/main.js')?data.toString()+inject:data);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BINARY,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
await page.route('https://raw.githubusercontent.com/btsunamib/minimal-valorant/**',async route=>{const relative=new URL(route.request().url()).pathname.split('/dist/')[1],file=relative&&path.join(root,relative);if(file&&fs.existsSync(file))await route.fulfill({path:file});else await route.fulfill({status:404,body:'not found'});});
try{
 await page.addInitScript(()=>{window.qaNativeRAF=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;});
 console.log('Loading WebGL QA');
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>!!window.botQA,{},{timeout:90000});
 await page.evaluate(()=>{window.requestAnimationFrame=window.qaNativeRAF;return window.botQA.preloadAgentModels();});
 for(const key of (process.argv.includes('--assets')||process.argv.includes('--ui')?[]:process.argv.length>2?process.argv.slice(2):['ascent','breeze','sunset','pearl','lotus','fracture'])){
  console.log('Checking squad',key);
  await page.evaluate(async key=>{const q=window.botQA;await q.map(key);q.prepare();},key);
  const start=await page.evaluate(()=>window.botQA.snap());
  for(let batch=0;batch<8;batch++)await page.evaluate(()=>{for(let i=0;i<150;i++)window.botQA.step(1/30);});
  const result=await page.evaluate(()=>{window.botQA.view();return window.botQA.snap();});
  assert.equal(result.software,false,'Uses actual WebGL');assert.equal(new Set(result.bots.map(b=>b.style)).size,5);
  assert(result.bots.every(b=>[b.x,b.z,b.floor,b.hp,b.ammo].every(Number.isFinite)),key+' finite actors');
  const moved=result.bots.filter((b,i)=>Math.hypot(b.x-start.bots[i].x,b.z-start.bots[i].z)>10).length;
  assert(moved>=6,key+' whole team advances beyond spawn');assert(result.bots.some(b=>b.shots>0),key+' actual perception produces firefights');assert(!result.programs.includes(true),'No failed shaders');
  assert.equal(errors.length,0,JSON.stringify(errors));await page.screenshot({path:out+'/'+key+'-battle.png',timeout:60000});results.push({key,moved,...result});fs.writeFileSync(out+'/bot-results.json',JSON.stringify({results,errors},null,2));console.log('PASS WebGL bot squad',key,'moved',moved,'shots',result.bots.reduce((s,b)=>s+b.shots,0),'phase',result.phase);
 }
 if(!results.length)await page.evaluate(()=>window.botQA.prepare());
 await page.evaluate(()=>window.botQA.openOverlay('score'));await page.screenshot({path:out+'/personalities-scoreboard.png',timeout:60000});
 assert.equal(await page.locator('.bot-style').count(),9,'Every bot shows its personality in scoreboard');
 const assets=[];
 for(const key of (process.argv.includes('--ui')?[]:['gaiavandal','gaiaguardian','gaiamarshal','gaiaghost','gaiaaxe','nimingvandal'])){
  const asset=await page.evaluate(key=>window.botQA.asset(key),key);assert.equal(asset.key,key);assert(asset.meshes>0&&asset.frames>0);
  await page.screenshot({path:out+'/'+key+'-collection.png'});
  assert.match(await page.evaluate(()=>window.botQA.action('inspect')),/inspect/i);
  await page.screenshot({path:out+'/'+key+'-inspect.png'});assets.push(asset);console.log('PASS WebGL original asset',key);
 }
 if(!process.argv.includes('--ui'))await page.evaluate(()=>window.botQA.asset('gaiaguardian','sg550'));
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.botQA.touch());
 await page.screenshot({path:out+'/mobile2-landscape.png'});
 assert(await page.locator('#touch').isVisible(),'Touch control layer is visible');
 assert(await page.locator('#touchInspect').isVisible(),'Inspect button is visible');
 for(const id of ['touchInspect','touchPlant','touchPrimary','touchPistol','touchReload'])assert(await page.locator('#'+id+' .native-touch-icon').evaluate(img=>img.complete&&img.naturalWidth>0));
 await page.evaluate(()=>window.botQA.feedback());
 try{await page.waitForFunction(()=>{const images=[...document.querySelectorAll('.native-feedback img')].filter(img=>!img.hidden);return images.length>=4&&images.every(img=>img.complete&&img.naturalWidth>0);},{},{timeout:30000,polling:100});}catch(e){console.log('Feedback state',await page.evaluate(()=>[...document.querySelectorAll('.native-feedback img')].map(img=>({src:img.src,hidden:img.hidden,complete:img.complete,width:img.naturalWidth}))));throw e;}
 assert(await page.locator('.native-feedback').isVisible(),'Champion crest is visible');await page.screenshot({path:out+'/champions21-feedback.png'});
 assert.equal(errors.length,0,JSON.stringify(errors));fs.writeFileSync(out+'/results.json',JSON.stringify({results,assets,errors},null,2));
}finally{await browser.close();server.close();}
