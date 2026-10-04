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
 if(effect)return new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,transparent:true,depthWrite:false,blending:flags&32?T.AdditiveBlending:T.NormalBlending,toneMapped:false});
 if(flags&4)return new T.MeshBasicMaterial({map:texture,side:T.DoubleSide,alphaTest:flags&64?.5:0,toneMapped:false});
 const m=new T.MeshStandardMaterial({map:texture,roughness:world?.93:.68,metalness:world?0:.08,side:T.DoubleSide,alphaTest:flags&64?.5:0,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:world?.04:.06});return stylizeMaterial(m);
}
export function configureValorantRender(renderer,scene,viewScene){
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
 for(const root of [scene,viewScene])root.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)stylizeMaterial(m);});
}
