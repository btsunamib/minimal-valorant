import * as T from './three.module.js';
import {MAP_LIGHTING} from './map-lighting-profiles.js?v=20261006-collection1';
const worldUniforms={
 worldSunDirection:{value:new T.Vector3(-28,55,12).normalize()},
 worldSunTint:{value:new T.Vector3(1.04,1.015,.965)},
 worldShadeTint:{value:new T.Vector3(.87,.93,1.035)}
};
export function configureMapLighting(scene,sun,key='training'){
 const profile=MAP_LIGHTING[key]||MAP_LIGHTING.training;
 worldUniforms.worldSunDirection.value.fromArray(profile.direction).normalize();
 worldUniforms.worldSunTint.value.fromArray(profile.sun);worldUniforms.worldShadeTint.value.fromArray(profile.shade);
 sun.userData.mapLightDirection=new T.Vector3().fromArray(profile.direction);
 sun.color.setRGB(...profile.sun);scene.fog=new T.Fog(profile.fog,profile.near,profile.far);
 return profile;
}
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
export function worldMaterial({staticLighting=false,highlight=0,...options}={}){
 const material=new T.MeshLambertMaterial({side:T.DoubleSide,toneMapped:false,...options});
 material.userData.worldLighting=true;
 material.userData.staticLighting=staticLighting;
 if(staticLighting)material.defines={...material.defines,STATIC_MAP_LIGHTING:1};
 if(highlight>0)material.defines={...material.defines,WORLD_HIGHLIGHT:1};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,worldUniforms,{worldHighlight:{value:highlight}});
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   #ifdef STATIC_MAP_LIGHTING
   attribute vec3 staticLight;
   varying vec3 vStaticLight;
   #endif`);
  shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>',`#include <color_vertex>
   #ifdef STATIC_MAP_LIGHTING
   vStaticLight=staticLight;
   #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   uniform vec3 worldSunDirection;
   uniform vec3 worldSunTint;
   uniform vec3 worldShadeTint;
   uniform float worldHighlight;
   #ifdef STATIC_MAP_LIGHTING
   varying vec3 vStaticLight;
   #endif`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
  shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',`
   vec3 worldNormal = inverseTransformDirection(normal, viewMatrix);
   float facing = dot(worldNormal, worldSunDirection);
   float ramp = smoothstep(-0.25, 0.65, facing);
   float liveShadow=getShadowMask();
   float contact = 1.0, sky = 0.7, sunlight = liveShadow;
   #ifdef STATIC_MAP_LIGHTING
   contact=clamp(vStaticLight.x,0.78,1.0);
   sky=clamp(vStaticLight.y,0.0,1.0);
   sunlight=min(clamp(vStaticLight.z,0.0,1.0),liveShadow);
   #endif
   // Baked colors provide the main illumination. Keep indirect light readable
   // indoors, with warmer sunlit planes and a cooler open-sky core shadow.
   float keyWeight=clamp(ramp*sunlight*0.75+sky*0.15,0.0,1.0);
   vec3 shadeTint=mix(vec3(0.97,0.985,1.0),worldShadeTint,sky);
   vec3 lightTint=mix(shadeTint,worldSunTint,keyWeight);
   float diffuseShade=mix(0.86,1.10,ramp*sunlight*0.75+sky*0.25);
   vec3 base=max(diffuseColor.rgb,vec3(0.0));
   float luminance=dot(base,vec3(0.2126,0.7152,0.0722));
   base/=1.0+max(luminance-0.65,0.0)*0.28;
   float highlight=0.0;
   #ifdef WORLD_HIGHLIGHT
   vec3 sunView=transformDirection(worldSunDirection,viewMatrix);
   highlight=pow(max(dot(normal,normalize(normalize(vViewPosition)+sunView)),0.0),28.0)*worldHighlight*sunlight;
   #endif
   vec3 outgoingLight=base*lightTint*diffuseShade*contact+worldSunTint*highlight+totalEmissiveRadiance;
  `);
 };
 material.customProgramCacheKey=()=> 'minival-static-irradiance-v2-'+(staticLighting?1:0);return material;
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
 const offset=sun.userData.mapLightDirection||new T.Vector3(-28,55,12),direction=offset.clone().normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right),p=new T.Vector3(point.x,point.y,point.z),texel=(sun.shadow.camera.right-sun.shadow.camera.left)/sun.shadow.mapSize.x;
 p.addScaledVector(right,Math.round(p.dot(right)/texel)*texel-p.dot(right));p.addScaledVector(up,Math.round(p.dot(up)/texel)*texel-p.dot(up));
 sun.target.position.copy(p);sun.position.copy(p).add(offset);sun.target.updateMatrixWorld();
}
export function configureValorantRender(renderer,scene,viewScene){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
 for(const root of [scene,viewScene])root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)stylizeMaterial(m);});
}
