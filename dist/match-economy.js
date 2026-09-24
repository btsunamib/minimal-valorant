import {WEAPONS} from './rules.js';
export const ARMOR_SHOP={light:{name:'轻甲',armor:25,cost:400,pool:0},regen:{name:'再生甲',armor:25,cost:650,pool:50},armor:{name:'重甲',armor:50,cost:1000,pool:0}};
export const SIDEARMS=Object.keys(WEAPONS).filter(id=>WEAPONS[id].slot==='sidearm');
export const PRIMARY_GUNS=Object.keys(WEAPONS).filter(id=>WEAPONS[id].slot==='primary');
export const BUY_GUNS=[...SIDEARMS,...PRIMARY_GUNS];
export function roundEquipment({mode,round,swapped=false,survived,primary,armor,money,preferred}){if(mode==='team')return{primary:PRIMARY_GUNS.includes(preferred)?preferred:'vandal',armor:50,money:3900};if(round===1||swapped)return{primary:'classic',armor:0,money:800};return{primary:survived?primary:'classic',armor:survived?armor:0,money};}
const armorFields=['armor','armorType','armorPool','armorHitAt'];
export function purchaseLedger(state){return{base:{...state},weapon:null,sidearm:null,armor:null};}
export function armorOwned(state,id){const w=ARMOR_SHOP[id],type=state.armorType||(state.armor>25?'armor':state.armor>0?'light':null);return type===id&&state.armor>=w.armor&&(state.armorPool||0)>=w.pool;}
export function shopAction(state,ledger,id,{phase,team=false,refund=false}={}){
 if(!team&&phase!=='buy')return{ok:false,reason:'只能在购买阶段交易装备'};
 const category=SIDEARMS.includes(id)?'sidearm':PRIMARY_GUNS.includes(id)?'weapon':Object.hasOwn(ARMOR_SHOP,id)?'armor':null;
 if(!category||!ledger)return{ok:false,reason:'无效装备'};
 const next={...state},book={...ledger},key=category==='weapon'?'primary':category;
 if(refund){const receipt=book[category];if(team||!receipt||receipt.id!==id)return{ok:false,reason:'这件装备不能退款'};next.money+=receipt.cost;if(category==='armor'){for(const f of armorFields){if(Object.hasOwn(ledger.base,f))next[f]=ledger.base[f];else delete next[f];}}else if(Object.hasOwn(ledger.base,key))next[key]=ledger.base[key];else delete next[key];book[category]=null;return{ok:true,state:next,ledger:book};}
 const cost=team?0:category==='armor'?ARMOR_SHOP[id].cost:WEAPONS[id].cost;
 if(category==='armor'?armorOwned(state,id):(category==='sidearm'?(state.sidearm||'classic'):state.primary)===id)return{ok:false,reason:'已持有该装备，无需重复购买'};
 const credit=team?0:book[category]?.cost||0;if(next.money+credit<cost)return{ok:false,reason:'余额不足'};
 next.money+=credit-cost;if(category==='armor'){next.armor=ARMOR_SHOP[id].armor;next.armorType=id;next.armorPool=ARMOR_SHOP[id].pool;next.armorHitAt=-100;}else next[key]=id;
 book[category]=team?null:{id,cost};return{ok:true,state:next,ledger:book};
}
// Regen absorbs the complete hit until its active 25 HP shield is depleted.
export function damageArmor(e,amount,now){const used=Math.min(e.armor,amount*(e.armorType==='regen'?1:.66));return{hp:Math.max(0,e.hp-amount+used),armor:Math.max(0,e.armor-used),armorHitAt:now};}
export function tickRegen(e,dt,now){if(!e.alive||e.armorType!=='regen'||!e.armorPool||e.armor>=25)return 0;const available=Math.max(0,now-Math.max(now-dt,(e.armorHitAt??now)+3)),gain=Math.min(25-e.armor,e.armorPool,available*12.5);e.armor+=gain;e.armorPool-=gain;if(e.armorPool<1e-7)e.armorPool=0;if(Math.abs(e.armor-25)<1e-7)e.armor=25;return gain;}
