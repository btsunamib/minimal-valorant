import * as T from './three.module.js';
// A restrained three-band diffuse ramp keeps the core shadow readable.
// Inspired by Riot's published Gradient Lambert; tuned for the supplied palettes.
export function stylizeMaterial(material){
 if(!material?.isMeshStandardMaterial||material.userData.gradientLambert)return material;
 material.userData.gradientLambert=true;
 material.onBeforeCompile=shader=>{const chunk=T.ShaderChunk.lights_physical_pars_fragment.replace('float dotNL = saturate( dot( geometryNormal, directLight.direction ) );','float rawNL = dot( geometryNormal, directLight.direction );\nfloat dotNL = mix(0.22, 0.68, smoothstep(-0.35, 0.4, rawNL)) + 0.32 * smoothstep(0.4, 0.95, rawNL);');shader.fragmentShader=shader.fragmentShader.replace('#include <lights_physical_pars_fragment>',chunk);};
 material.customProgramCacheKey=()=> 'mini-gradient-lambert-v1';material.needsUpdate=true;return material;
}
export function nativeMaterial(texture,flags=0,{world=false}={}){
 const effect=!!(flags&48);
 // Native effect geometry can contain inward-facing glow shells. Rendering
 // both sides adds the whole shell over the gun instead of just its edge.
 if(effect)return new T.MeshBasicMaterial({map:texture,side:T.FrontSide,transparent:true,depthWrite:false,blending:flags&32?T.AdditiveBlending:T.NormalBlending,toneMapped:false});
 if(world)return worldMaterial({map:texture,alphaTest:flags&64?.5:0});
 // These indexed palettes already contain their surface shading. Feeding them
 // through the map's strong PBR lights and ACES loses their original colors.
 // Use the same texture color on WebGL and the software fallback; effects keep
 // their original additive/alpha mode above.
 return new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,alphaTest:flags&64?.5:0,toneMapped:false});
}
// Baked map colors remain the base. Only a bounded diffuse ramp and shadow
// factor are applied, so strong scene lights cannot bleach indexed palettes.
export function worldMaterial(options={}){
 const material=new T.MeshLambertMaterial({side:T.DoubleSide,toneMapped:false,...options});
 material.userData.worldLighting=true;
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
  shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',`
   vec3 worldNormal = inverseTransformDirection(normal, viewMatrix);
   float facing = dot(worldNormal, normalize(vec3(-28.0, 55.0, 12.0)));
   float ramp = smoothstep(-0.25, 0.65, facing);
   float diffuseShade = mix(0.83, 1.02, ramp);
   vec3 lightTint = mix(vec3(0.90, 0.94, 1.0), vec3(1.02, 1.0, 0.96), ramp);
   float shadowShade = mix(0.68, 1.0, getShadowMask());
   vec3 outgoingLight = diffuseColor.rgb * lightTint * diffuseShade * shadowShade + totalEmissiveRadiance;
  `);
 };
 material.customProgramCacheKey=()=> 'minival-baked-gradient-shadow-v1';return material;
}
export function shadowQuality(quality,software=false){
 return {enabled:!software&&quality!=='performance',size:quality==='high'?2048:1024,radius:quality==='high'?36:28,interval:quality==='high'?0:1000/30};
}
export function configureSun(renderer,sun,quality){
 const q=shadowQuality(quality,renderer.software),changed=sun.shadow.mapSize.x!==q.size;
 renderer.shadowMap.enabled=q.enabled;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;sun.castShadow=q.enabled;
 sun.shadow.mapSize.set(q.size,q.size);sun.shadow.camera.left=-q.radius;sun.shadow.camera.right=q.radius;sun.shadow.camera.top=q.radius;sun.shadow.camera.bottom=-q.radius;
 sun.shadow.camera.near=.5;sun.shadow.camera.far=150;sun.shadow.normalBias=.065;sun.shadow.bias=-.0004;sun.shadow.radius=2;sun.shadow.camera.updateProjectionMatrix();
 if(changed&&sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}return q;
}
export function followSun(sun,point){
 // Snap in light-space to whole shadow texels to avoid crawling edges.
 const direction=new T.Vector3(-28,55,12).normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),p=new T.Vector3(point.x,point.y,point.z),texel=(sun.shadow.camera.right-sun.shadow.camera.left)/sun.shadow.mapSize.x;
 p.addScaledVector(right,Math.round(p.dot(right)/texel)*texel-p.dot(right));p.addScaledVector(up,Math.round(p.dot(up)/texel)*texel-p.dot(up));
 sun.target.position.copy(p);sun.position.copy(p).add(new T.Vector3(-28,55,12));sun.target.updateMatrixWorld();
}
export function configureValorantRender(renderer,scene,viewScene){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
 for(const root of [scene,viewScene])root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)stylizeMaterial(m);});
}
