// Coordinates follow the supplied BSP reconstruction. Original spawn locations
// were recovered from the pre-normalization import, never guessed from sites.
export const MAP_FEATURES={
 ascent:{spawn:{attack:{x:-14,z:55,floor:0},defend:{x:2,z:-52,floor:.25}},doors:[{id:'a-tree',name:'A 树屋门',x:7,z:-35,floor:.25,width:2.6,yaw:0},{id:'b-market',name:'B 市场门',x:-22,z:-25,floor:-2.125,width:2.8,yaw:Math.PI/2}],orbs:[{x:5,z:-17,floor:-1.125},{x:-35,z:-8,floor:-2.125}]},
 breeze:{spawn:{attack:{x:-8.4375,z:56.5938,floor:.001},defend:{x:-17.75,z:-51.7656,floor:4.001}},doors:[{id:'a-hall',name:'A 廊道门',x:16,z:-14,floor:7,width:2.5,yaw:0}],ropes:[{name:'A 廊道升降绳',a:{x:18,z:-8,floor:3},b:{x:18,z:-8,floor:7}}],orbs:[{x:29,z:22,floor:3},{x:-38,z:2,floor:0}]},
 sunset:{spawn:{attack:{x:14.75,z:-38.6094,floor:.501},defend:{x:-63.3,z:-13.7,floor:3.5}},doors:[{id:'b-market',name:'B 市场门',x:-27,z:-44,floor:1.5,width:3,yaw:0}],orbs:[{x:-17,z:34,floor:4.25},{x:-21,z:-39,floor:1.5}]},
 pearl:{spawn:{attack:{x:-4.2062,z:57.9688,floor:2.2979},defend:{x:3.7,z:-42.3281,floor:-4}},orbs:[{x:28,z:5,floor:0},{x:-35,z:15,floor:0}]},
 lotus:{spawn:{attack:{x:-6.875,z:-56.375,floor:3.001},defend:{x:7.25,z:29.875,floor:2.751}},doors:[{id:'a-rotate',name:'A 树屋旋转门',x:39,z:-20,floor:3,width:4,yaw:0,rotating:true},{id:'c-rotate',name:'C 土丘旋转门',x:-48,z:-19,floor:3,width:4,yaw:0,rotating:true}],breakables:[{name:'A 连通破坏墙',x:17,z:-4,floor:1.5,width:2.5,yaw:Math.PI/2}],orbs:[{x:47,z:-15,floor:3},{x:-51,z:-21,floor:3}]},
 fracture:{spawn:{attack:{x:7,z:68.5469,floor:1.4385},defend:{x:18.2688,z:18.4531,floor:4.126}},ropes:[{name:'南侧至北侧绳索',oneWay:true,a:{x:6,z:64,floor:2},b:{x:6,z:-29,floor:2}},{name:'北侧至南侧绳索',oneWay:true,a:{x:8,z:-29,floor:2},b:{x:8,z:64,floor:2}}],orbs:[{x:38,z:30,floor:5},{x:42,z:-15,floor:4},{x:-36,z:40,floor:4},{x:-42,z:-9,floor:4}]}
};
