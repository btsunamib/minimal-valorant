// Manual WebGL QA: set CHROME_BINARY and optionally PLAYWRIGHT_MODULE.
// Set MINIVAL_QA_VARIANTS=1 for quality tiers, landscape and missing-bake checks.
import fs from 'node:fs';import path from 'node:path';import http from 'node:http';
import {createRequire} from 'node:module';const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.env.MINIVAL_QA_ROOT||new URL('../dist',import.meta.url).pathname,output=process.env.MINIVAL_LIGHTING_QA_OUT||new URL('../docs/qa/lighting2',import.meta.url).pathname;fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.join(root,name==='/'?'index.html':name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'application/octet-stream');let data=fs.readFileSync(file);if(file.endsWith('/main.js'))data=Buffer.from(data.toString()+`\nwindow.lightingQA={renderer,scene,sun,camera,player,entities,prefs,prepareMatchMap,preloadAgentModels,startMatch,beginLive,applyQuality,active:()=>activeMap,async map(key){document.getElementById('mapSelect').value=key;await prepareMatchMap();},pose(x,y,z,tx,ty,tz){camera.position.set(x,y,z);camera.lookAt(tx,ty,tz);player.x=x;player.z=z;player.floor=y-1.65;player.y=y;player.yaw=camera.rotation.y;player.pitch=camera.rotation.x;},freeze(){paused=true;player.alive=false;for(const b of entities){b.alive=false;b.mesh.visible=false;}},draw(){followSun(sun,camera.position);renderer.shadowMap.needsUpdate=true;renderer.autoClear=true;scene.updateMatrixWorld(true);renderer.render(scene,camera);},snap(){return {software:renderer.software||false,programs:renderer.info.programs.map(p=>({id:p.id,diagnostics:p.diagnostics?{runnable:p.diagnostics.runnable,log:p.diagnostics.programLog}:null})),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,baked:activeMap?.meshes.filter(m=>m.geometry.attributes.staticLight).length||0};}};`);res.end(data);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME_BINARY,headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:''}));
await page.route('https://raw.githubusercontent.com/btsunamib/minimal-valorant/**',async route=>{const url=new URL(route.request().url()),relative=url.pathname.split('/dist/')[1],file=relative&&path.join(root,relative);if(file&&fs.existsSync(file))await route.fulfill({path:file});else await route.fulfill({status:404,body:'not found'});});
try{await page.goto('http://127.0.0.1:'+port,{waitUntil:'load'});await page.waitForFunction(()=>!!window.lightingQA);const prefix=process.argv[2]||'before';
for(const key of (process.argv.length>3?process.argv.slice(3):['ascent','sunset','pearl'])){
 await page.evaluate(async key=>{const q=window.lightingQA;await q.map(key);await q.preloadAgentModels();q.startMatch();q.beginLive();q.freeze();q.prefs.quality='high';q.applyQuality();},key);
 await page.evaluate(()=>{document.querySelectorAll('#menu,#hud,#touch,#overlay,#damage,#crosshair,#scope,#fpsCounter').forEach(e=>e.style.display='none');});
 const poses=await page.evaluate(()=>{const d=window.lightingQA.active().data;return [d.sites[0],d.spawns.attack[0]];});
 for(let i=0;i<poses.length;i++){
  const p=poses[i];await page.evaluate(p=>{const q=window.lightingQA;q.pose(p.x,p.floor+1.65,p.z,p.x-8,p.floor+1.65,p.z-13);q.draw();},p);await page.waitForTimeout(100);
  await page.screenshot({path:output+'/'+prefix+'-'+key+'-'+i+'.png'});console.log(prefix,key,i,JSON.stringify(await page.evaluate(()=>window.lightingQA.snap())));
 }
}
if(process.env.MINIVAL_QA_VARIANTS==='1'){
 for(const quality of ['performance','balanced','high']){
  await page.evaluate(quality=>{const q=window.lightingQA;q.prefs.quality=quality;q.applyQuality();q.draw();},quality);
  await page.waitForTimeout(100);await page.screenshot({path:output+'/'+prefix+'-'+quality+'.png'});
  const state=await page.evaluate(()=>{const q=window.lightingQA;return {quality:q.prefs.quality,shadow:q.renderer.shadowMap.enabled,baked:q.snap().baked};});
  if(!state.baked||state.shadow!==(quality!=='performance'))throw Error('Quality lighting mismatch');console.log('PASS quality',JSON.stringify(state));
 }
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>window.lightingQA.draw());await page.screenshot({path:output+'/'+prefix+'-landscape.png'});
 await page.route('**/lighting.bin.gz*',route=>route.fulfill({status:404,body:'missing bake'}));
 await page.evaluate(async()=>{const q=window.lightingQA;await q.map('training');await q.map('sunset');q.draw();});
 const state=await page.evaluate(()=>window.lightingQA.snap());if(state.baked)throw Error('Fallback still bound stale lighting');console.log('PASS missing bake fallback',JSON.stringify(state));
}
console.log('ERRORS',JSON.stringify(errors));if(errors.some(e=>/GLSL|shader|WebGLProgram|SyntaxError|ReferenceError/.test(e)))process.exitCode=1;
}finally{await browser.close();server.close();}
