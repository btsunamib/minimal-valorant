// Immutable, already published resource tree. No credentials go to the client.
export const WEAPON_ASSET_COMMIT='9f9a2a13fb80293f4b0b8cc3d85c86f430c0ecae';
export const WEAPON_ASSET_ROOT=`https://raw.githubusercontent.com/btsunamib/minimal-valorant/${WEAPON_ASSET_COMMIT}/dist/`;
export const NEW_ASSET_ROOT='./';
export function weaponAssetURL(path){
 const clean=String(path).replace(/^\.\//,'').replace(/^\//,'');
 if(/^assets\/(maps|native-ui|feedback)\//.test(clean)||/^assets\/imported\/(singularitybutterfly|dolmirvandal|protocol781phantom|champions24phantom|valstrike|phaseguard|sovereign|eternal|forsaken|neofrontier|kuronamivfx|champions25source|champions22knifev2|originbuckyv2|utilities)/.test(clean))return NEW_ASSET_ROOT+clean;
 if(clean.startsWith('assets/imported/')&&!clean.split('/').includes('..'))return WEAPON_ASSET_ROOT+clean;
 return String(path);
}
export async function fetchWeaponAsset(path,{kind='binary',timeout=25000,attempts=2,onProgress=()=>{},signal}={}){
 const url=weaponAssetURL(path);let last;
 for(let attempt=0;attempt<attempts;attempt++){
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const controller=new AbortController(),abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});
  const timer=setTimeout(abort,timeout);
  try{
   onProgress({phase:'download',loaded:0,total:0,attempt:attempt+1,url});
   const response=await fetch(url,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',cache:attempt?'reload':'default',signal:controller.signal});
   if(!response.ok)throw Error('GitHub HTTP '+response.status);
   let buffer;
   if(response.body?.getReader){
    const reader=response.body.getReader(),chunks=[];let loaded=0;
    const total=Number(response.headers.get('content-length'))||0;
    for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;onProgress({phase:'download',loaded,total,attempt:attempt+1,url});}
    const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}buffer=bytes.buffer;
   }else buffer=await response.arrayBuffer();
   if(kind==='json')return JSON.parse(new TextDecoder().decode(buffer));
   const bytes=new Uint8Array(buffer);
   // Reject login pages, stale partial downloads and Git LFS pointer text.
   if(kind==='model'&&!(bytes[0]===31&&bytes[1]===139)&&!(bytes[0]===73&&bytes[1]===68&&bytes[2]===83&&bytes[3]===84))throw Error('GitHub 返回的不是模型文件');
   if(kind==='model'&&bytes[0]===73&&(buffer.byteLength<76||new DataView(buffer).getInt32(72,true)!==buffer.byteLength))throw Error('模型下载不完整');
   return buffer;
  }catch(e){last=e;if(signal?.aborted)throw new DOMException('Cancelled','AbortError');}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
 }
 throw last?.name==='AbortError'?Error('GitHub 下载超时'):last;
}
