import test from 'node:test';import assert from 'node:assert/strict';import{sensorQuaternion,sensorDelta,GyroAim}from'../dist/gyro.js';
const env=(permission)=>({isSecureContext:true,DeviceOrientationEvent:permission?{requestPermission:permission}:{},screen:{orientation:{angle:90,addEventListener(){},removeEventListener(){}}},addEventListener(){},removeEventListener(){}});
test('crossing compass zero does not spin the camera',()=>{const d=sensorDelta(sensorQuaternion(359,80,0,90),sensorQuaternion(0,80,0,90));assert.ok(Math.abs(d.yaw)<.025);assert.ok(Math.abs(d.pitch)<.025)});
test('unchanged device gives zero input in each screen orientation',()=>{for(const angle of[0,90,180,270]){const q=sensorQuaternion(53,74,20,angle),d=sensorDelta(q,q);assert.ok(Math.abs(d.yaw)<1e-10&&Math.abs(d.pitch)<1e-10)}});
test('permission denial leaves sensor disabled',async()=>{const g=new GyroAim(env(async()=>'denied'));assert.equal(await g.enable(),false);assert.equal(g.enabled,false);assert.equal(g.status,'denied');g.disable()});
test('no secure origin reports a clear error without requesting permission',async()=>{let asked=false;const e=env(async()=>{asked=true;return'granted'});e.isSecureContext=false;const g=new GyroAim(e);assert.equal(await g.enable(),false);assert.equal(asked,false);assert.equal(g.status,'insecure')});
test('calibration and ADS activation discard pre-activation rotation',async()=>{const g=new GyroAim(env(async()=>'granted'));await g.enable();g.feed({alpha:0,beta:80,gamma:0,timeStamp:10});g.feed({alpha:3,beta:80,gamma:0,timeStamp:30});assert.deepEqual(g.consume(.016,false),{yaw:0,pitch:0});assert.deepEqual(g.consume(.016,true),{yaw:0,pitch:0});g.feed({alpha:4,beta:80,gamma:0,timeStamp:50});const d=g.consume(.016,true);assert.ok(Math.abs(d.yaw)+Math.abs(d.pitch)>0);g.calibrate();assert.deepEqual(g.consume(.016,true),{yaw:0,pitch:0});g.disable()});
test('screen rotation resets reference and avoids an abrupt aim jump',async()=>{const e=env();const g=new GyroAim(e);await g.enable();g.feed({alpha:0,beta:80,gamma:0,timeStamp:10});e.screen.orientation.angle=270;g.feed({alpha:0,beta:80,gamma:0,timeStamp:30});assert.deepEqual(g.pending,{yaw:0,pitch:0});g.disable()});

test('landscape sensor motion follows screen axes even when modern orientation reports zero',async()=>{
 for(const [orientation,gamma]of[[90,-70],[-90,70]]){
  const e=env();e.orientation=orientation;e.screen.orientation.angle=0;
  const g=new GyroAim(e);await g.enable();
  g.feed({alpha:0,beta:0,gamma,timeStamp:10});g.consume(1,true);
  // Turn around gravity (left/right); it must not become vertical aim.
  g.feed({alpha:2,beta:0,gamma,timeStamp:30});const horizontal=g.consume(1,true,1,0);
  assert.ok(horizontal.yaw>.03);assert.ok(Math.abs(horizontal.pitch)<.001);
  g.calibrate();g.feed({alpha:0,beta:0,gamma,timeStamp:50});g.consume(1,true);
  // Tilt around the screen's horizontal edge; it must not become horizontal aim.
  g.feed({alpha:0,beta:0,gamma:gamma+(gamma<0?2:-2),timeStamp:70});const vertical=g.consume(1,true,1,0);
  assert.ok(vertical.pitch<-.03);assert.ok(Math.abs(vertical.yaw)<.001);
  g.disable();
 }
});
test('manual axis correction supports a browser with a stuck orientation API',async()=>{
 const e=env();e.screen.orientation.angle=0;const g=new GyroAim(e);g.setAngleOffset(90);await g.enable();
 g.feed({alpha:0,beta:0,gamma:-70,timeStamp:10});g.consume(1,true);
 g.feed({alpha:2,beta:0,gamma:-70,timeStamp:30});const d=g.consume(1,true,1,0);
 assert.ok(d.yaw>.03&&Math.abs(d.pitch)<.001);g.setAngleOffset(-90);assert.deepEqual(g.pending,{yaw:0,pitch:0});assert.equal(g.previous,null);g.disable();
});
test('orientation changes discard pending motion even before a screen change event',async()=>{
 const e=env();e.orientation=90;const g=new GyroAim(e);await g.enable();
 g.feed({alpha:0,beta:0,gamma:-70,timeStamp:10});g.consume(1,true);
 g.feed({alpha:2,beta:0,gamma:-70,timeStamp:30});assert.ok(Math.abs(g.pending.yaw)>.03);
 e.orientation=-90;g.feed({alpha:2,beta:0,gamma:70,timeStamp:50});assert.deepEqual(g.pending,{yaw:0,pitch:0});g.disable();
});
