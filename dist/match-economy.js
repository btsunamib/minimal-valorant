import {WEAPONS} from './rules.js';
export const ARMOR_SHOP={light:{name:'轻型护甲',armor:25,cost:400},armor:{name:'重型护甲',armor:50,cost:1000}};
export const BUY_GUNS=['vandal','phantom','operator','spectre','judge'];
export function roundEquipment({mode,round,swapped=false,survived,primary,armor,money,preferred}){if(mode==='team')return{primary:preferred,armor:50,money:3900};if(round===1||swapped)return{primary:'classic',armor:0,money:800};return{primary:survived?primary:'classic',armor:survived?armor:0,money};}
export function purchaseLedger(state){return{base:{primary:state.primary,armor:state.armor},weapon:null,armor:null};}
// Pure transactions: the caller must still enforce active match / live buyer.
export function shopAction(state,ledger,id,{phase,team=false,refund=false}={}){
 if(!team&&phase!=='buy')return{ok:false,reason:'只能在购买阶段交易装备'};
 const category=BUY_GUNS.includes(id)?'weapon':Object.hasOwn(ARMOR_SHOP,id)?'armor':null;
 if(!category)return{ok:false,reason:'无效装备'};
 const next={...state},book={...ledger};
 if(refund){const receipt=book[category];if(team||!receipt||receipt.id!==id)return{ok:false,reason:'这件装备不能退款'};next.money+=receipt.cost;next[category==='weapon'?'primary':'armor']=ledger.base[category==='weapon'?'primary':'armor'];book[category]=null;return{ok:true,state:next,ledger:book};}
 const cost=team?0:category==='weapon'?WEAPONS[id].cost:ARMOR_SHOP[id].cost;
 if(category==='weapon'?state.primary===id:state.armor>=ARMOR_SHOP[id].armor)return{ok:false,reason:'已持有该装备，无需重复购买'};
 const credit=team?0:book[category]?.cost||0;if(next.money+credit<cost)return{ok:false,reason:'余额不足'};
 next.money+=credit-cost;next[category==='weapon'?'primary':'armor']=category==='weapon'?id:ARMOR_SHOP[id].armor;book[category]=team?null:{id,cost};return{ok:true,state:next,ledger:book};
}
