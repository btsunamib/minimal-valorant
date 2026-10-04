"""Mesa EGL raster proof using actual sampled meshes, textures and outline shell.

Usage: node scripts/export-native-raster-fixture.mjs /tmp/native.json
       python scripts/check-native-opengl.py /tmp/native.json OUTPUT_DIRECTORY
This exercises real OpenGL CCW culling and depth. It is not a mobile WebGL test.
"""
import base64,ctypes as C,json,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw

E=C.CDLL('libEGL.so.1');G=C.CDLL('libGL.so.1')
def api(lib,name,restype,args):
    f=getattr(lib,name);f.restype=restype;f.argtypes=args;return f
I,U,F,P=C.c_int,C.c_uint,C.c_float,C.c_void_p
getproc=api(E,'eglGetProcAddress',P,[C.c_char_p])
platform=C.CFUNCTYPE(P,U,P,P)(getproc(b'eglGetPlatformDisplayEXT'))
display=platform(0x31DD,None,None)
major,minor=I(),I()
assert api(E,'eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)])(display,C.byref(major),C.byref(minor))
assert api(E,'eglBindAPI',U,[U])(0x30A2) # desktop OpenGL
attrs=(I*17)(0x3033,1,0x3040,8,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3025,24,0x3026,8,0x3038)
config,count=P(),I()
assert api(E,'eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attrs,C.byref(config),1,C.byref(count)) and count.value
surface_attrs=(I*5)(0x3057,384,0x3056,512,0x3038)
surface=api(E,'eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,surface_attrs)
context_attrs=(I*1)(0x3038)
context=api(E,'eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,context_attrs)
assert api(E,'eglMakeCurrent',U,[P,P,P,P])(display,surface,surface,context)

def gl(name,restype,*args):return api(G,name,restype,list(args))
enable=gl('glEnable',None,U);disable=gl('glDisable',None,U)
clear=gl('glClear',None,U);gl('glClearColor',None,F,F,F,F)(.035,.08,.1,1)
gl('glViewport',None,I,I,I,I)(0,0,384,512);enable(0x0B71)
gl('glDepthFunc',None,U)(0x0203);gl('glFrontFace',None,U)(0x0901)
depthmask=gl('glDepthMask',None,C.c_ubyte);cull=gl('glCullFace',None,U)
stencilmask=gl('glStencilMask',None,U);stencilfunc=gl('glStencilFunc',None,U,I,U);stencilop=gl('glStencilOp',None,U,U,U)
create_shader=gl('glCreateShader',U,U);source=gl('glShaderSource',None,U,I,C.POINTER(C.c_char_p),P)
compile_shader=gl('glCompileShader',None,U);get_shader=gl('glGetShaderiv',None,U,U,C.POINTER(I))
def shader(kind,code):
    s=create_shader(kind);text=C.c_char_p(code.encode());source(s,1,C.byref(text),None);compile_shader(s);ok=I();get_shader(s,0x8B81,C.byref(ok));assert ok.value;return s
vs=shader(0x8B31,'#version 120\nvarying vec2 uv;void main(){uv=gl_MultiTexCoord0.xy;gl_Position=gl_Vertex;}')
frag=shader(0x8B30,'#version 120\nuniform sampler2D t;uniform int outline;varying vec2 uv;void main(){gl_FragColor=outline==1?vec4(1.,229./255.,43./255.,1.):texture2D(t,uv);}')
program=gl('glCreateProgram',U)();attach=gl('glAttachShader',None,U,U);attach(program,vs);attach(program,frag);gl('glLinkProgram',None,U)(program)
gl('glUseProgram',None,U)(program)
uniform=gl('glGetUniformLocation',I,U,C.c_char_p);set_uniform=gl('glUniform1i',None,I,I);location=uniform(program,b'outline');set_uniform(uniform(program,b't'),0)
gen_texture=gl('glGenTextures',None,I,C.POINTER(U));bind_texture=gl('glBindTexture',None,U,U)
texparam=gl('glTexParameteri',None,U,U,I);upload=gl('glTexImage2D',None,U,I,I,I,I,I,U,U,P)
delete_textures=gl('glDeleteTextures',None,I,C.POINTER(U))
client=gl('glEnableClientState',None,U);client(0x8074);client(0x8078)
vertex_pointer=gl('glVertexPointer',None,I,U,I,P);uv_pointer=gl('glTexCoordPointer',None,I,U,I,P)
draw=gl('glDrawElements',None,U,I,U,P);pixels=gl('glReadPixels',None,I,I,I,I,U,U,P)
renderer=gl('glGetString',C.c_char_p,U)(0x1F01).decode()
fixtures=json.load(open(sys.argv[1]));out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True);report=[];gallery=[]
for fixture in fixtures:
    textures=[];palette=[]
    for t in fixture['textures']:
        handle=U();gen_texture(1,C.byref(handle));bind_texture(0x0DE1,handle.value)
        for param,value in [(0x2801,0x2600),(0x2800,0x2600),(0x2802,0x812F),(0x2803,0x812F)]:texparam(0x0DE1,param,value)
        data=np.frombuffer(base64.b64decode(t['rgba']),np.uint8);palette.append(np.unique(data.view(np.uint32)))
        upload(0x0DE1,0,0x8058,t['width'],t['height'],0,0x1908,0x1401,data.ctypes.data);textures.append(handle)
    def render(shells=True,old_winding=False):
        depthmask(1);stencilmask(255);clear(0x4000|0x0100|0x0400)
        for m in fixture['meshes']:
            if m['outline'] and not shells:continue
            if m['outline']:enable(0x0B44);cull(0x0404);depthmask(0)
            else:disable(0x0B44);depthmask(1)
            if old_winding:disable(0x0B90)
            else:
                assert m['stencilWrite']
                enable(0x0B90);stencilmask(m['stencilWriteMask']);stencilfunc(m['stencilFunc'],m['stencilRef'],255);stencilop(0x1E00,0x1E00,m['stencilZPass'])
            set_uniform(location,int(m['outline']));bind_texture(0x0DE1,textures[m['texture']].value)
            vertices=np.array(m['vertices'],np.float32);uvs=np.array(m['uv'],np.float32);indices=np.array(m['triangles'],np.uint32)
            if old_winding:indices=indices.reshape(-1,3)[:,[0,2,1]].copy().reshape(-1)
            vertex_pointer(4,0x1406,0,vertices.ctypes.data);uv_pointer(2,0x1406,0,uvs.ctypes.data);draw(4,len(indices),0x1405,indices.ctypes.data)
        image=np.empty((512,384,4),np.uint8);pixels(0,0,384,512,0x1908,0x1401,image.ctypes.data);return image[::-1].copy()
    body=render(False);fixed=render();broken=render(old_winding=True)
    mask=np.any(body[:,:,:3]!=body[0,0,:3],axis=2)
    yellow=lambda im:(im[:,:,0]>250)&(im[:,:,1]>220)&(im[:,:,1]<235)&(im[:,:,2]<50)
    fixed_cover=float((yellow(fixed)&mask).sum()/max(1,mask.sum()))
    broken_cover=float((yellow(broken)&mask).sum()/max(1,mask.sum()))
    colored=float((np.ptp(body[:,:,:3],axis=2)>25)[mask].mean())
    assert fixed_cover<.001,(fixture['id'],fixture['angle'],fixed_cover)
    assert broken_cover>.8,(fixture['id'],fixture['angle'],broken_cover)
    # Palette saturation varies by character; preserve it rather than tinting.
    palette_match=float(np.isin(body[mask].copy().view(np.uint32).ravel(),np.concatenate(palette)).mean())
    assert palette_match>.9999,(fixture['id'],palette_match)
    report.append(dict(paletteMatchFraction=palette_match,agent=fixture['id'],angle=fixture['angle'],bodyPixels=int(mask.sum()),coloredFraction=colored,oldYellowCoverage=broken_cover,fixedYellowCoverage=fixed_cover))
    if fixture['angle']==0:
        im=Image.new('RGBA',(768,544),(9,20,26,255));im.paste(Image.fromarray(broken),(0,32));im.paste(Image.fromarray(fixed),(384,32));ImageDraw.Draw(im).text((12,10),fixture['id']+'   OLD WINDING                         FIXED OUTLINE',fill='white');gallery.append(im)
    for handle in textures:delete_textures(1,C.byref(handle))
sheet=Image.new('RGBA',(768*3,544*2),(9,20,26,255))
for i,im in enumerate(gallery):sheet.paste(im,((i%3)*768,(i//3)*544))
sheet.convert('RGB').save(out/'native-opengl-winding.jpg',quality=92)
(out/'native-opengl-results.json').write_text(json.dumps(dict(renderer=renderer,scope='Real EGL/OpenGL raster with Three-sampled original geometry; not a device WebGL certification',samples=report),indent=2))
print(json.dumps(dict(renderer=renderer,samples=len(report),maxFixedYellowCoverage=max(r['fixedYellowCoverage'] for r in report),averageOldYellowCoverage=sum(r['oldYellowCoverage'] for r in report)/len(report))))
