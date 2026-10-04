import {SKINS,KNIVES} from './rules.js';
import {IMPORTED_WEAPONS} from './imported-weapons.js?v=20261004-native4';

export function equippedSkin(id,prefs){
 const key=prefs.weaponSkins?.[id]??prefs.skin??'standard',s=SKINS[key];
 return s&&(!s.weapon||s.weapon===id)&&(key==='standard'||IMPORTED_WEAPONS[key])?key:'standard';
}
export function collectionDraft(id,prefs){return {...prefs,skin:equippedSkin(id,prefs),importedVariants:{...prefs.importedVariants}};}
export function equipCollection(id,draft,prefs){
 if(id==='knife')prefs.knife=draft.knife;
 else{prefs.weaponSkins={...prefs.weaponSkins,[id]:draft.skin};prefs.skin=draft.skin;}
 const key=id==='knife'?draft.knife:draft.skin;
 prefs.importedVariants={...prefs.importedVariants,[key]:draft.importedVariants?.[key]||'base'};
 for(const field of ['kuronamiVariant','chaosVariant','mercyVariant','naruVariant','naruForm'])if(field in draft)prefs[field]=draft[field];
}
export function skinItems(id){
 const entries=id==='knife'?Object.entries(KNIVES).filter(([key])=>IMPORTED_WEAPONS[key]).map(([key,name])=>({key,name,color:IMPORTED_WEAPONS[key]?.color||'#b0d7e1'})):Object.entries(SKINS).filter(([key,s])=>(key==='standard'||IMPORTED_WEAPONS[key])&&(!s.weapon||s.weapon===id)).map(([key,s])=>({key,name:s.name,color:s.css}));
 return entries.flatMap(item=>item.key==='vctclassic'?Object.entries(IMPORTED_WEAPONS.vctclassic.variants).map(([variant,label])=>({...item,variant,name:label+' · 标配'})):[item]);
}
export function skinThumbnail(id,key,variant='base'){
 if(key==='standard'&&IMPORTED_WEAPONS['valstrike'+id])return `assets/imported/valstrike${id}/base/thumb.webp`;
 if(IMPORTED_WEAPONS[key]){const spec=IMPORTED_WEAPONS[key],selected=Object.hasOwn(spec.variants,variant)?variant:Object.hasOwn(spec.variants,'base')?'base':Object.keys(spec.variants)[0];return `assets/imported/${key}/${selected}/thumb.webp`;}
 return `assets/ui/${key==='chaos'?'chaos':key==='champions26'?'champions26':key==='champions24'?'champions24':id}.png`;
}
export function variantColor(id){return ({base:'#71ced8',purple:'#9472c4',pink:'#e2a4c8',white:'#ede8da',black:'#c25164',red:'#c25164',blue:'#61bdda',brown:'#c5aa8a',aura:'#eed991',level1:'#b2b4b7',plain:'#71757a',shatter:'#cfab59'})[id]||'#78a8ad';}
