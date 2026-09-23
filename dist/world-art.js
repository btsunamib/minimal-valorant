import * as T from './three.module.js';
// Ascent-inspired reconstruction. Geometry is authored here, not extracted Riot assets.
// The existing playable footprints stay authoritative for navigation and bullet cover.
export const WORLD_PALETTE={plaster:0xdbbd91,rose:0xc99485,ivory:0xebe1c7,stone:0x9c969c,roof:0xa96350,slate:0x555664,metal:0x414e53,green:0x80bda3};
const cube=new T.BoxGeometry(1,1,1),materials=new Map();
function material(color,roughness=.95){const key=color+':'+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness:0}));return materials.get(key)}
function box(parent,x,y,z,w,h,d,color){const m=new T.Mesh(cube,typeof color==='number'?material(color):color);m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;m.castShadow=h>.15;parent.add(m);return m}
function mesh(parent,geometry,color,x=0,y=0,z=0){const m=new T.Mesh(geometry,typeof color==='number'?material(color):color);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function random(seed=91){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function canvasTexture(canvas){const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;return t}
function plaster(color){const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d'),r=random(color);q.fillStyle=new T.Color(color).getStyle();q.fillRect(0,0,256,256);
 const wash=q.createLinearGradient(0,0,0,256);wash.addColorStop(0,'rgba(255,249,229,.10)');wash.addColorStop(.58,'rgba(255,249,229,0)');wash.addColorStop(1,'rgba(66,61,84,.20)');q.fillStyle=wash;q.fillRect(0,0,256,256);
 for(let i=0;i<700;i++){q.fillStyle=i%3?'rgba(255,245,223,.025)':'rgba(77,60,72,.025)';q.beginPath();q.ellipse(r()*256,r()*256,1+r()*10,1+r()*2,0,0,Math.PI*2);q.fill()}
 // Exposed brick patches are concentrated near the base, not noisy full-wall tiling.
 for(let row=0;row<7;row++)for(let col=0;col<13;col++){const x=col*22+(row%2)*11,y=256-row*9;if(r()>.62-row*.065){q.fillStyle=row%2?'rgba(123,85,69,.22)':'rgba(124,95,78,.16)';q.fillRect(x,y,20,7);q.fillStyle='rgba(244,216,177,.14)';q.fillRect(x,y,20,1)}}
 return new T.MeshStandardMaterial({map:canvasTexture(c),roughness:1,color:0xffffff})}
function roof(parent,w,d,h,color=WORLD_PALETTE.roof){const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(0,h);s.lineTo(w/2,0);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,steps:1,curveSegments:1});geo.translate(0,0,-d/2);const m=mesh(parent,geo,color);
 // Broad terracotta tile rows, with restrained longitudinal seams.
 const slope=Math.atan2(h,w/2),len=Math.hypot(w/2,h);
 for(const side of[-1,1]){for(let j=1;j<5;j++){const t=j/5;const b=box(parent,side*w*.5*t,h*(1-t)+.02,0,.038,.038,d+.025,j%2?0xad725a:0x925649);b.rotation.z=-side*slope}
 for(let z=-d/2+.3;z<d/2;z+=.48){const b=box(parent,side*w*.25,h*.5+.03,z,len,.025,.018,0xb47a63);b.rotation.z=-side*slope}}
 box(parent,0,h+.025,0,.18,.12,d+.13,0xc3856c);return m}
function arch(parent,width,height,depth,color){const r=width/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(-r,height-r);s.absarc(0,height-r,r,Math.PI,0,true);s.lineTo(r,0);s.closePath();return mesh(parent,new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:16}),color)}
function archTrim(parent,w,h,color,thickness=.15){const r=w/2,pts=[];for(let i=0;i<=20;i++){const a=Math.PI-i*Math.PI/20;pts.push(new T.Vector3(Math.cos(a)*r,h-r+Math.sin(a)*r,.14))}const curve=new T.CatmullRomCurve3(pts);mesh(parent,new T.TubeGeometry(curve,16,thickness/2,5,false),color);for(const x of[-r,r])box(parent,x,(h-r)/2,.14,thickness,h-r,.24,color);}
function facade(parent,x,z,rot,w,h,id){const f=new T.Group();f.position.set(x,0,z);f.rotation.y=rot;parent.add(f);const P=WORLD_PALETTE;
 // A closed inset arched door: no visual suggestion of a traversable doorway.
 if(w>4){const door=new T.Group();door.position.set(0,.1,.035);f.add(door);arch(door,1.52,2.62,.035,0x4f5a5c);archTrim(door,1.72,2.73,P.ivory,.22);box(door,0,1.13,.075,1.43,2.1,.06,0x687374);for(let i=-2;i<=2;i++)box(door,i*.26,1.13,.113,.017,2.02,.018,0x515d61);box(door,0,1.15,.13,.05,2.1,.035,0x414d53);box(door,.13,1.15,.17,.055,.17,.06,0xc1ad88);box(f,0,.12,.2,1.9,.2,.34,P.ivory)}
 const count=Math.max(1,Math.floor(w/2.6));for(let i=0;i<count;i++){const xx=(i-(count-1)/2)*Math.min(2.9,w/count),yy=h>5.5?h-2.05:h-1.6;if(Math.abs(xx)<.9&&w>4&&yy<3.1)continue;const window=new T.Group();window.position.set(xx,yy,.055);f.add(window);arch(window,1.03,1.37,.035,0x485562);archTrim(window,1.2,1.49,P.ivory,.13);box(window,0,.67,.085,.035,1.25,.03,0xa0a7a0);box(window,0,.7,.085,.91,.035,.03,0xa0a7a0);box(window,0,-.06,.12,1.43,.15,.37,P.ivory);
 for(const side of[-1,1]){box(window,side*.78,.63,.07,.38,1.26,.10,id%2?0x697a71:0x687779);for(let k=0;k<7;k++)box(window,side*.78,.14+k*.16,.13,.34,.028,.02,0x87938a)}}
 box(f,0,.42,.04,w,.64,.09,0xb3aaa1);box(f,0,.77,.06,w,.075,.13,P.ivory);box(f,0,h-.26,.08,w+.12,.17,.21,P.ivory);box(f,0,h-.07,.08,w+.32,.16,.34,0xc4b7a5);
 for(const side of[-1,1]){box(f,side*(w/2-.12),h/2,.075,.24,h,.18,P.ivory)}
 // Downpipe follows the facade and stays inside the player's collision padding.
 if(w>5){const pipe=mesh(f,new T.CylinderGeometry(.035,.035,h-.3,7),0x7d7370,w/2-.42,h/2,.19);pipe.castShadow=false;for(let yy=.8;yy<h;yy+=1.4)box(f,w/2-.42,yy,.16,.13,.035,.09,0x544f54)}
 return f;}
function label(parent,text,x,y,z,w,color='#ded9c8',bg='#4c5c5f'){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,512,128);q.strokeStyle=color;q.lineWidth=3;q.strokeRect(9,9,494,110);q.font='500 54px Georgia';q.textAlign='center';q.textBaseline='middle';q.fillStyle=color;q.fillText(text,256,68);const m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshBasicMaterial({map:canvasTexture(c)}));m.position.set(x,y,z);parent.add(m);return m}
function crate(parent,x,z,w,d,h){const g=new T.Group();g.name='Radianite-style cover';g.position.set(x,0,z);parent.add(g);const P=WORLD_PALETTE;
 for(const [width,depth,rotation]of[[w,d,0],[w,d,Math.PI],[d,w,Math.PI/2],[d,w,-Math.PI/2]]){const face=new T.Group();face.rotation.y=rotation;g.add(face);const zz=depth/2+.021;box(face,0,h/2,zz,width-.24,h-.24,.04,P.green);box(face,0,h*.68,zz+.026,width-.42,.035,.02,0xb3dcc0);
 for(const xx of[-width/2+.10,width/2-.10])box(face,xx,h/2,zz+.03,.18,h,.12,P.metal);for(const yy of[.12,h-.12])box(face,0,yy,zz+.04,width,.22,.12,P.metal);
 const diagonal=box(face,0,h/2,zz+.07,.14,Math.hypot(width-.3,h-.3),.09,P.metal);diagonal.rotation.z=-Math.atan2(width-.3,h-.3);for(const xx of[-width/2+.1,width/2-.1])for(const yy of[.15,h-.15])box(face,xx,yy,zz+.115,.055,.055,.02,0xa1adb1);}
 box(g,0,h-.025,0,w,.05,d,0x677e76);for(const side of[-1,1])box(g,side*(w/2-.10),h+.025,0,.20,.10,d+.10,P.metal);
}
function groundMap(solids){const c=document.createElement('canvas');c.width=2048;c.height=1792;const q=c.getContext('2d'),r=random(512),sx=c.width/56,sz=c.height/48,X=x=>(x+28)*sx,Z=z=>(z+24)*sz;q.fillStyle='#b3aca8';q.fillRect(0,0,c.width,c.height);
 // Large irregular grey paving rather than high-contrast voxel checkerboard.
 const stepX=1.35*sx,stepY=.78*sz;for(let row=0;row<c.height/stepY;row++)for(let col=-1;col<c.width/stepX;col++){const x=col*stepX+(row%2)*stepX*.5,y=row*stepY,v=Math.floor(r()*12);q.fillStyle=`rgb(${169+v},${164+v},${160+v})`;q.fillRect(x+1,y+1,stepX-2,stepY-2);q.strokeStyle='rgba(229,224,208,.17)';q.lineWidth=1;q.strokeRect(x+2,y+2,stepX-4,stepY-4)}
 // Static grounding and sunlight projection remain on every quality tier.
 for(const [x,z,w,d,h]of solids){const dx=h*.53,dz=-h*.3;q.save();q.filter='blur(8px)';q.fillStyle='rgba(58,54,76,.24)';q.fillRect(X(x-w/2)-7,Z(z-d/2)-7,w*sx+14,d*sz+14);q.restore();q.fillStyle='rgba(69,62,84,.17)';q.beginPath();for(const [i,p]of [[x-w/2,z-d/2],[x-w/2+dx,z-d/2+dz],[x+w/2+dx,z-d/2+dz],[x+w/2+dx,z+d/2+dz],[x+w/2,z+d/2],[x-w/2,z+d/2]].entries()){if(i)q.lineTo(X(p[0]),Z(p[1]));else q.moveTo(X(p[0]),Z(p[1]))}q.closePath();q.fill()}
 return canvasTexture(c);}
function backdrop(parent){const P=WORLD_PALETTE;
 function house(x,z,w,d,h,col,id){const g=new T.Group();g.position.set(x,0,z);parent.add(g);box(g,0,h/2,0,w,h,d,col);for(const [fw,fd,rotation]of[[w,d,0],[d,w,Math.PI/2]]){const f=new T.Group();f.rotation.y=rotation;g.add(f);for(const yy of[h-1.8,h-4.1])for(let xx=-fw/2+1.3;xx<fw/2-.7;xx+=2.4){box(f,xx,yy,fd/2+.012,1.0,1.35,.035,0x63707a);box(f,xx,yy-.72,fd/2+.045,1.20,.11,.20,P.ivory);box(f,xx,yy,fd/2+.04,.05,1.3,.025,0xaab0ac);}box(f,0,h-.2,fd/2+.045,fw+.25,.15,.18,P.ivory);}const top=new T.Group();top.position.y=h;g.add(top);roof(top,w+.6,d+.5,1.25);box(g,w*.24,h+1.3,0,.55,1.5,.55,0xb9a491)}
 for(let i=0;i<9;i++){house(-43+i*10,-33-(i%3)*3,8.8,7,8+(i%3)*1.3,[P.rose,P.plaster,0xb9b3b1][i%3],i)}
 for(const side of[-1,1])for(let i=0;i<5;i++)house(side*(35+(i%2)*3),-14+i*10,7,8,7+(i%3)*1.4,[0xbfac99,P.rose,P.plaster][i%3],i);
 // Venetian dome and campanile, outside the playable volume.
 const tower=new T.Group();tower.position.set(-30,0,-39);parent.add(tower);box(tower,0,8,0,5.1,16,5.1,0xdbcbb2);for(const yy of[3,11.8,15.8])box(tower,0,yy,0,5.6,.35,5.6,P.ivory);for(const rot of[0,Math.PI/2,Math.PI,-Math.PI/2]){const f=new T.Group();f.rotation.y=rot;tower.add(f);for(const x of[-1.1,1.1]){const a=new T.Group();a.position.set(x,12.1,2.57);f.add(a);arch(a,1.25,2.85,.025,0x676878);archTrim(a,1.4,2.9,P.ivory)}}mesh(tower,new T.ConeGeometry(4.3,4.4,4),0x647b7e,0,18.2,0).rotation.y=Math.PI/4;
 const dome=new T.Group();dome.position.set(-12,0,-43);parent.add(dome);mesh(dome,new T.CylinderGeometry(6.2,6.5,6,16),P.plaster,0,8,0);mesh(dome,new T.SphereGeometry(6.3,24,12,0,Math.PI*2,0,Math.PI/2),0x71999b,0,11,0);for(let i=0;i<12;i++){const a=i*Math.PI/6;box(dome,Math.sin(a)*6.2,8,Math.cos(a)*6.2,.3,5.6,.3,P.ivory)}mesh(dome,new T.CylinderGeometry(.65,.8,1.5,10),P.ivory,0,17.6,0);mesh(dome,new T.ConeGeometry(1.1,1.1,12),0x678c8e,0,18.9,0);
}
export function detailedWorld(scene,solids,wallMeshes,ground){const root=new T.Group();root.name='Ascent-inspired architectural reconstruction';scene.add(root);const P=WORLD_PALETTE,plasters=[plaster(P.plaster),plaster(P.rose),plaster(0xc8c2b8),plaster(P.ivory)];
 ground.geometry=cube;ground.scale.set(56,.06,48);ground.rotation.x=0;ground.position.y=-.043;ground.material=new T.MeshBasicMaterial({map:groundMap(solids)});ground.name='Static shaded stone pavement';
 solids.forEach(([x,z,w,d,h],i)=>{const solid=wallMeshes[i];solid.name='Solid '+i;solid.material=i<4?plasters[2]:i>=10?material(P.metal):plasters[(i-4)%4];
 if(i>=10){crate(root,x,z,w,d,h);return}
 if(i<4){box(root,x,h-.06,z,w+.04,.18,d+.04,P.ivory);return}
 const g=new T.Group();g.position.set(x,0,z);root.add(g);
 facade(g,0,d/2+.008,0,w,h,i);facade(g,0,-d/2-.008,Math.PI,w,h,i);facade(g,w/2+.008,0,Math.PI/2,d,h,i);facade(g,-w/2-.008,0,-Math.PI/2,d,h,i);
 const cap=new T.Group();cap.position.y=h;g.add(cap);roof(cap,w+.4,d+.35,Math.min(1.45,w*.18));
 if(i===4||i===5){const f=new T.Group();f.position.set(0,0,d/2+.25);g.add(f);label(f,i===4?'VINI  •  VENETO':'MERCATO',0,3.40,0,3.25);}
 if(i===6||i===7){const f=new T.Group();f.position.set(0,0,d/2+.22);g.add(f);label(f,i===6?'GELATO':'FARMACIA',0,2.94,0,2.2,'#e8dbbe',i===6?'#a77467':'#61716e');}
 });
 // Site labels sit on the existing rear boundary wall, not floating over crosshairs.
 for(const [x,letter]of[[-18,'A'],[18,'B']]){label(root,letter+'   /   SITE',x,2.5,-23.46,3,'#ddd9c8','#65766f');}
 // Two vaulted lane entrances: supports sit inside existing wall boundaries.
 for(const side of[-1,1]){const gate=new T.Group();gate.position.set(side*24.1,0,-5);root.add(gate);archTrim(gate,5.9,6.1,P.ivory,.28);for(const x of[-3.04,3.04])box(gate,x,2.5,0,.18,5,.65,P.plaster);const rim=new T.Group();rim.position.z=-.34;gate.add(rim);archTrim(rim,5.9,6.1,0xb6a58f,.26);}
 // Floating masonry islands reproduce the reference's distant broken-city silhouette.
 const islands=new T.Group();islands.name='Distant floating city';root.add(islands);
 for(let i=0;i<7;i++){const x=-60+i*20,z=-74-(i%2)*9,y=15+(i%3)*5;const rock=mesh(islands,new T.ConeGeometry(10+i%3*2,14,7,1),0x9e949f,x,y-8,z);rock.rotation.z=Math.PI;box(islands,x,y-.4,z,16,.8,12,0xb9a4a4);for(let j=0;j<3;j++){const h=4+(i+j)%4;box(islands,x-5+j*5,y+h/2,z,4,h,6,[0xba9c95,0xc2aa9b,0xb2a6ad][j]);const top=new T.Group();top.position.set(x-5+j*5,y+h,z);islands.add(top);roof(top,4.4,6.3,.85,0x9f7d7b)}for(let j=0;j<2;j++){const shard=mesh(islands,new T.OctahedronGeometry(1.2+j*.5),0x9b919f,x+10+j*3,y-7-j*4,z+4);shard.rotation.set(.3*i,j,.5);}}
 backdrop(root);
 root.updateMatrixWorld(true);return{group:root,groundMap:ground.material.map,palette:P};
}
