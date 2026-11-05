"""Da Nang Dragon Bridge, concept study with sculpted dragon profiles and true arch openings."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';k.PARTS=[];k.CURRENT='da-nang-v2'
palette=dict(k.PALETTE,ivory='#ecdec0',white='#eee8d9',stone='#aba99d',shadow='#8e8d82',gold='#d58b05',brass='#e7a31f',amber='#aa6903',dark='#432a12',water='#139fac',foam='#51bbc0')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in ['ivory','white','stone','shadow','dark','gold','brass','amber']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.06 if name in ['gold','brass','amber'] else 0;p.inputs['Roughness'].default_value=.42 if name in ['gold','brass','amber'] else .68
p=k.M['water'].node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.25;p.inputs['Coat Weight'].default_value=.35

def box(name,x,y,z,w,d,h,mat='stone',bevel=.008):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='brass',r=.008):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=2;o.data.use_fill_caps=True;return o
def profile(name,points,y=0,depth=.18,mat='gold',bevel=.014):
    # Sculpted, closed, extruded silhouette. The mouth remains the gap between two distinct volumes.
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=depth/2;c.bevel_depth=bevel;c.bevel_resolution=3
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,(x,z) in zip(s.points,points):p.co=(x,z,0,1)
    s.use_cyclic_u=True
    o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);o.location.y=y;o.rotation_euler.x=math.pi/2;k.register(o,name,mat);return o
def bezier(a,b,c,d,n=16):
    return [tuple((1-t)**3*a[j]+3*(1-t)**2*t*b[j]+3*(1-t)*t*t*c[j]+t**3*d[j] for j in range(2)) for t in [i/n for i in range(n+1)]]

def sculpt_leaf(name,points,y,depth,mat='gold'):
    # Lenticular volumes taper to the silhouette, avoiding a constant-depth cutout at the tips.
    cx=(min(p[0]for p in points)+max(p[0]for p in points))/2
    cz=(min(p[1]for p in points)+max(p[1]for p in points))/2
    n=len(points);v=[(x,y,z)for x,z in points];f=[]
    for sy in [-1,1]:
        previous=0
        for shrink,bulge in [(.90,.55),(.68,.88),(.36,1.0)]:
            start=len(v);v.extend((cx+(x-cx)*shrink,y+sy*depth*.5*bulge,cz+(z-cz)*shrink)for x,z in points)
            for j in range(n):f.append((previous+j,previous+(j+1)%n,start+(j+1)%n,start+j))
            previous=start
        center=len(v);v.append((cx,y+sy*depth*.52,cz))
        for j in range(n):f.append((previous+j,previous+(j+1)%n,center))
    obj=k.mesh(name,v,f,mat,0)
    for face in obj.data.polygons:face.use_smooth=True
    return obj

# Low warm display plinth, water contained inside a fine cream rim.
box('warm display plinth',0,0,.064,4.12,1.70,.128,'ivory',.014)
for y in [-.805,.805]:box('long water tray rim',0,y,.145,4.12,.075,.06,'white',.006)
for x in [-2.0225,2.0225]:box('end water tray rim',x,0,.145,.075,1.54,.06,'white',.006)
verts=[];faces=[];nx,ny=100,36
for j in range(ny+1):
    y=-.765+1.53*j/ny
    for i in range(nx+1):
        x=-1.985+3.97*i/nx;z=.145+.004*math.sin(x*14+y*11)+.002*math.sin(x*24-y*7)
        verts.append((x,y,z))
for j in range(ny):
    for i in range(nx):
        a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
water=k.mesh('subtle turquoise rippling river',verts,faces,'water',0)
for p in water.data.polygons:p.use_smooth=True

# Four piers, pale slab and a restrained, slightly inset walking surface.
for x,w in [(-1.79,.22),(-.89,.33),(.89,.33),(1.79,.22)]:
    box('river pier',x,.04,.328,w,.55,.365,'stone',.009)
    box('pier bearing cap',x,.04,.509,w+.06,.58,.055,'white',.006)
    for y in [-.241,.321]:box('pier chamfered front panel',x,y,.332,w-.065,.009,.275,'stone',.005)
box('continuous pale bridge deck',0,.04,.559,3.99,.69,.105,'white',.009)
box('inset gray walking surface',0,.04,.617,3.93,.62,.018,'stone',.004)
for y in [-.28,.36]:box('deck fine kerb',0,y,.632,3.99,.04,.033,'white',.004)
for x in [-1.90,1.90]:box('end expansion joint',x,.04,.629,.006,.58,.002,'shadow',0)

# Two parallel ribbons form the central golden arch; fine longitudinal edge lips and cross ties.
def arch(t):return -1.16+2.16*t,.652+1.04*math.sin(math.pi*t)**.85
def band(name,offset,height,depth,y,mat):
    v=[];n=88
    for i in range(n+1):
        x,z=arch(i/n);z+=offset
        v.extend([(x,y-depth/2,z),(x,y+depth/2,z),(x,y+depth/2,z+height),(x,y-depth/2,z+height)])
    f=[(3,2,1,0),(4*n,4*n+1,4*n+2,4*n+3)]
    for i in range(n):
        for q in range(4):f.append((4*i+q,4*i+(q+1)%4,4*(i+1)+(q+1)%4,4*(i+1)+q))
    return k.mesh(name,v,f,mat,.008)
band('broad golden upper dragon arch',0,.125,.245,.04,'gold')
band('separate inner golden arch rib',-.158,.079,.245,.04,'gold')
for y in [-.088,.168]:
    for offset in [.012,.115,-.15,-.085]:strip('raised arch edge',[(arch(i/88)[0],y,arch(i/88)[1]+offset)for i in range(89)],'brass',.008)
for t in [.16,.28,.40,.52,.64,.76,.87]:
    x,z=arch(t)
    for y in [-.087,.167]:k.beam('arch web connecting cleat',(x,y,z-.081),(x,y,z+.008),.025,'amber')
for i in range(1,8):
    t=.12+i*.095;x,z=arch(t)
    k.beam('slender vertical suspension hanger',(x,.04,.642),(x,.04,z-.16),.025,'amber')
    box('hanger deck shoe',x,.04,.648,.054,.054,.022,'brass',.003)

def dragon(x0,z0,s=1,sign=1,open_mouth=True):
    def p(x,z):return (x0+sign*s*x,z0+s*z)
    def shape(name,pts,y=0,depth=.20,mat='gold',bevel=.012):return profile(name,[p(x,z)for x,z in pts],.04+y*s,depth*s,mat,bevel*s)
    def line(name,pts,y,mat='brass',r=.008):return strip(name,[(x0+sign*s*x,.04+y*s,z0+s*z)for x,z in pts],mat,r*s)
    # Curved neck widening at its foot, with raised flowing longitudinal ribs.
    neck=bezier((-.22,-.49),(-.20,-.28),(-.13,-.09),(-.10,.02))+bezier((-.10,.02),(-.04,.08),(.055,.015),(.045,-.08))[1:]+bezier((.045,-.08),(-.01,-.25),(.015,-.38),(.01,-.49))[1:]
    shape('curved golden neck',neck,depth=.20)
    for y in [-.113,.113]:
        line('neck sculpted flute',bezier((-.16,-.47),(-.15,-.31),(-.10,-.14),(-.07,-.055)),y,'brass',.012)
        line('neck inner flute',bezier((-.06,-.47),(-.08,-.30),(-.045,-.16),(-.025,-.07)),y,'amber',.006)
    # Rounded leaf-shaped mane spikes, each a real gold volume rather than flat image artwork.
    leaves=[((-.15,.17),(-.57,.36),(-.44,.14),(-.25,.10)),((-.19,.085),(-.62,.16),(-.49,-.025),(-.25,-.015)),((-.20,-.02),(-.58,-.10),(-.42,-.20),(-.18,-.10)),((-.13,-.09),(-.42,-.30),(-.26,-.30),(-.08,-.16))]
    for i,(a,b,c,d) in enumerate(leaves):
        pts=bezier(a,((a[0]+b[0])*.5,a[1]+.06),b,b,12)+bezier(b,b,c,d,16)[1:]
        sculpt_leaf('rounded swept leaf mane '+str(i),[p(x,z)for x,z in pts],.04,.23*s)
    for i,(a,tip,end) in enumerate([((-.20,.21),(-.41,.48),(-.05,.23)),((-.02,.25),(-.20,.52),(.11,.24)),((.15,.24),(.06,.42),(.25,.22))]):
        pts=bezier(a,(a[0]-.05,a[1]+.12),tip,tip,14)+bezier(tip,tip,(end[0]-.04,end[1]+.02),end,14)[1:]
        sculpt_leaf('rounded swept crown horn '+str(i),[p(x,z)for x,z in pts],.04,.21*s)
    # Upper head, expressive brow and lifted blunt snout.
    outline=bezier((-.26,.15),(-.26,.25),(-.20,.32),(-.10,.29))
    outline+=bezier((-.10,.29),(.05,.27),(.20,.21),(.30,.23))[1:]
    outline+=bezier((.30,.23),(.37,.25),(.40,.32),(.44,.31))[1:]
    outline+=bezier((.44,.31),(.48,.26),(.45,.15),(.42,.10))[1:]
    outline+=bezier((.42,.10),(.34,.05),(.29,.04),(.20,.04))[1:]
    outline+=bezier((.20,.04),(.12,-.015),(.03,-.05),(-.07,-.055))[1:]
    outline+=bezier((-.07,-.055),(-.20,-.05),(-.25,.04),(-.26,.15))[1:]
    shape('sculpted upper dragon head',outline,depth=.26,bevel=.016)
    if open_mouth:
        jaw=bezier((-.10,-.06),(-.02,-.105),(.08,-.105),(.18,-.14))+bezier((.18,-.14),(.28,-.13),(.35,-.065),(.405,-.055))[1:]
        jaw+=bezier((.405,-.055),(.44,-.10),(.41,-.19),(.35,-.21))[1:]+bezier((.35,-.21),(.21,-.245),(.025,-.20),(-.10,-.14))[1:]
        shape('separate open lower jaw',jaw,depth=.22,bevel=.012)
        # Deep throat behind open jaw; mouth remains visibly open at its outer lip.
        shape('dark recessed throat',[(-.10,-.055),(.12,.01),(.24,.035),(.22,-.10),(.10,-.13),(-.10,-.12)],depth=.11,mat='amber',bevel=.005)
        for y in [-.11,.11]:line('lower lip bevel',bezier((.02,-.13),(.12,-.15),(.28,-.12),(.39,-.075)),y,'brass',.009)
        for u in [.18,.29,.37]:
            shape('short golden chin beard',[(u-.035,-.18),(u+.025,-.17),(u-.002,-.285),(u-.045,-.24)],depth=.17,bevel=.009)
    # Raised cheek line, gold eye surround, dark pupil and fine brow on both sides.
    for sy in [-1,1]:
        y=sy*.151
        line('flowing cheek outline',bezier((-.23,.04),(-.18,-.035),(-.03,-.06),(.12,.035)),y,'brass',.009)
        line('brow ridge',bezier((-.13,.20),(-.05,.235),(.015,.205),(.08,.18)),y,'brass',.013)
        for mat,r,dy in [('amber',.056,0),('dark',.043,.006),('brass',.027,.014),('dark',.012,.021)]:
            eye=k.cylinder('layered expressive eye',(x0+sign*s*(-.04),.04+sy*(.151+dy)*s,z0+.125*s),r*s,.013*s,mat,32)
            eye.rotation_euler.x=math.pi/2
        glint=k.ball('eye small glint',(x0+sign*s*(-.049),.04+sy*.178*s,z0+.14*s),.006*s,'white')
        # Tiny inset nostrils, following the raised muzzle.
        for xx,zz,rr in[(.27,.16,.014),(.395,.23,.012)]:
            nostril=k.ball('snout nostril',(x0+sign*s*xx,.04+sy*.144*s,z0+zz*s),rr*s,'dark',scale=(1,.30,.68))

dragon(1.43,1.170,1.08,1,True)
# The far end is an upright fan tail, not a second dragon face.
tailneck=bezier((-1.56,.645),(-1.62,.87),(-1.71,1.14),(-1.67,1.32))+bezier((-1.67,1.32),(-1.60,1.47),(-1.38,1.38),(-1.38,1.22))[1:]+bezier((-1.38,1.22),(-1.41,1.04),(-1.38,.84),(-1.37,.645))[1:]
profile('upright curved fan tail stem',tailneck,.04,.21,'gold',.012)
for y in [-.078,.158]:
    for x in [-1.52,-1.44]:strip('tail stem flowing rib',[(x,y,.65),(x-.05,y,.91),(x-.10,y,1.19),(x-.075,y,1.35)],'brass',.012)
tailleaves=[((-1.54,1.36),(-1.92,1.63),(-1.71,1.69),(-1.43,1.45)),((-1.53,1.42),(-1.78,1.95),(-1.61,1.86),(-1.42,1.48)),((-1.45,1.47),(-1.60,1.97),(-1.40,1.87),(-1.34,1.49)),((-1.40,1.46),(-1.30,1.88),(-1.24,1.74),(-1.28,1.46)),((-1.54,1.38),(-1.92,1.40),(-1.80,1.28),(-1.42,1.29)),((-1.46,1.35),(-1.74,1.19),(-1.63,1.12),(-1.37,1.27))]
for i,(a,b,c,d) in enumerate(tailleaves):
    pts=bezier(a,((a[0]+b[0])/2,b[1]),b,b,16)+bezier(b,b,c,d,16)[1:]
    sculpt_leaf('rounded fan tail petal '+str(i),pts,.04,.21)
k.ball('tail center sculpted knot',(-1.51,-.092,1.42),.075,'brass',scale=(1,.55,1.15))


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"da-nang","Đà Nẵng","Cầu Rồng",revision=2,status='visual-direction-accepted')
