export const BUY_LINES={attack:14,defend:-10};
export function buyBarrierBlocks(z,r,team,attackTeam,phase,mode){
 if(phase!=='buy'||mode==='team')return false;
 return team===attackTeam?z-r<BUY_LINES.attack:z+r>BUY_LINES.defend;
}
