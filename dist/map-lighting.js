// Compact RGB8 vertex lighting; no full-screen AO pass or per-frame raycasts.
export function decodeMapLighting(buffer,meshes){
 const bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer);
 const count=meshes.reduce((n,m)=>n+m.positions.length/3,0);
 if(bytes.length!==8+count*3||String.fromCharCode(...bytes.subarray(0,4))!=='MVL1'||new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(4,true)!==count)throw Error('地图光照数据与几何不匹配');
 let offset=8;
 return meshes.map(m=>{const length=m.positions.length,result=bytes.slice(offset,offset+length);offset+=length;return result;});
}

export function materialHighlight(name=''){
 if(/glass|water|chrome/i.test(name))return .075;
 if(/metal|steel|vent|pipe|alum/i.test(name))return .035;
 return 0;
}
