// Extend visible palette colors into fully transparent pixels before mipmaps
// are generated. Alpha and every visible source texel remain unchanged.
export function bleedMaskedTexture(texture){
 if(!(texture.flags&64))return texture;
 const {width,height}=texture,rgba=new Uint8Array(texture.rgba),count=width*height;
 const seen=new Uint8Array(count),queue=new Uint32Array(count);let end=0;
 for(let p=0;p<count;p++)if(rgba[p*4+3]){seen[p]=1;queue[end++]=p;}
 for(let at=0;at<end;at++){
  const p=queue[at],x=p%width;
  for(const q of [x?p-1:-1,x<width-1?p+1:-1,p>=width?p-width:-1,p+width<count?p+width:-1]){
   if(q<0||seen[q])continue;seen[q]=1;queue[end++]=q;
   for(let c=0;c<3;c++)rgba[q*4+c]=rgba[p*4+c];
  }
 }
 return {...texture,rgba};
}
