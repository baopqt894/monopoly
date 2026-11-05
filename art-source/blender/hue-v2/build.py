"""Ngo Mon concept study: three true vaulted passages, battered stone wings, imperial roofs."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='hue-v2'
palette=dict(k.PALETTE,ivory='#ecdec0',white='#f7e8ca',stone='#9f9b91',shadow='#89867d',plaster='#9e8258',red='#a52b0c',wood='#542c18',dark='#263c31',gold='#d58b05',brass='#e7a31f',jade='#075b4b')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['stone','shadow','plaster','white','ivory','wood','red','dark']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.70
for name in['gold','brass','jade']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.04;p.inputs['Roughness'].default_value=.44;p.inputs['Coat Weight'].default_value=.14
def box(name,x,y,z,w,d,h,mat='stone',bevel=.005):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='brass',r=.008,res=1):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=res;o.data.use_fill_caps=True;return o
def battered_wing(x):
    w0,d0,w1,d1=.77,.97,.66,.84;z=.13;h=1.10
    v=[(x+a*w0/2,b*d0/2,z)for a,b in[(-1,-1),(1,-1),(1,1),(-1,1)]]
    v.extend((x+a*w1/2,b*d1/2,z+h)for a,b in[(-1,-1),(1,-1),(1,1),(-1,1)])
    k.mesh('battered stone wing',v,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'stone',.005)
    for row in range(12):
        zz=.17+row*.088;t=(zz-z)/h;w=w0+(w1-w0)*t;d=d0+(d1-d0)*t
        box('wing front masonry bed joint',x,-d/2-.001,zz,w-.006,.002,.0017,'shadow',0)
        sign=1 if x>0 else-1
        box('wing end masonry bed joint',x+sign*(w/2+.001),0,zz,.002,d-.006,.0017,'shadow',0)
        for j in range(4):
            xx=x-w/2+.065+(j+(row%2)*.5)*.17
            if xx<x+w/2-.02:
                z2=zz+.078;d2=d0+(d1-d0)*(z2-z)/h
                strip('wing staggered head joint',[(xx,-d/2-.002,zz+.004),(xx,-d2/2-.002,z2)],'shadow',.00085,0)
box('cream display foundation',0,0,.055,3.40,1.55,.11,'ivory',.015)
box('display upper bevel',0,0,.119,3.36,1.51,.020,'white',.004)
holes=[(-.58,.306,.650,False),(0,.346,.700,False),(.58,.306,.650,False)]
k.arch_wall('three open vaulted gateways',0,0,.13,1.98,1.10,.78,holes,'stone',taper=.96)
for x in[-1.15,1.15]:battered_wing(x)
for cx,hw,hh,_ in holes:
    w=hw-.006;spring=hh-w/2
    path=k.arch_points(w,hh)[1:]+[(-w/2,0)]
    n=len(path);v=[(cx+x,y,.13+z)for y in[-.398,.398]for x,z in path]
    k.mesh('warm stone tunnel lining',v,[(i,i+1,n+i+1,n+i)for i in range(n-1)],'plaster',0)
    # Individually cut voussoirs and squared jambs, not an arch decal.
    for sign in[-1,1]:box('arch pale stone jamb',cx+sign*(w/2+.012),-.405,.13+spring/2,.025,.055,spring,'ivory',.003)
    for i in range(14):
        a=math.pi*i/14+.003;b=math.pi*(i+1)/14-.003;r=w/2;th=.025
        v=[(cx+rr*math.cos(angle),y,.13+spring+rr*math.sin(angle))for y in[-.434,-.381]for rr,angle in[(r,a),(r,b),(r+th,b),(r+th,a)]]
        k.mesh('cut arch ring voussoir',v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'ivory',.0015)
for row in range(12):
    z=.17+row*.088;local=z-.13
    intervals=[]
    for cx,w,h,_ in holes:
        r=w/2;spring=h-r
        if local<h:
            half=r if local<=spring else math.sqrt(max(0,r*r-(local-spring)**2))
            intervals.append((cx-half-.003,cx+half+.003))
    segments=[(-.98,.98)]
    for lo,hi in intervals:
        updated=[]
        for a,b in segments:
            if hi<=a or lo>=b:updated.append((a,b))
            else:
                if a<lo:updated.append((a,lo))
                if hi<b:updated.append((hi,b))
        segments=updated
    for a,b in segments:
        if b-a>.006:box('front masonry bed joint',(a+b)/2,-.3915,z,b-a,.002,.0017,'shadow',0)
    for j in range(12):
        x=-.94+(j+(row%2)*.5)*.16
        if abs(x)<.95 and(local>.72 or .18<abs(x)<.40 or abs(x)>.75):box('front staggered masonry joint',x,-.392,z+.043,.0017,.002,.076,'shadow',0)

# Terrace slab and simple pale parapet caps; no extra crenellation pattern.
box('terrace stone slab',0,0,1.245,2.94,.87,.045,'ivory',.005)
box('front central pale cornice',0,-.408,1.267,1.89,.050,.062,'white',.004)
for x in[-1.15,1.15]:
    box('wing pale top cornice',x,0,1.255,.70,.88,.055,'white',.005)
    for y in[-.43,.43]:box('wing low parapet rim',x,y,1.293,.71,.036,.045,'ivory',.004)
    for side in[-1,1]:
        box('wing end parapet return',x+side*.34,0,1.293,.036,.87,.045,'ivory',.004)
        for y in[-.40,.40]:box('parapet corner stone',x+side*.34,y,1.322,.055,.055,.067,'ivory',.004)

def timber_hall(name,x,y,z,w,d,h,bays):
    box(name+' vermilion body',x,y,z+h/2,w,d,h,'red')
    box(name+' red foot rail',x,y,z+.025,w+.045,d+.035,.042,'red',.004)
    for side in[-1,1]:
        yy=y+side*(d/2+.008)
        for i in range(bays):
            xx=x-w/2+(i+.5)*w/bays
            box('recessed dark wooden shutter',xx,yy,z+h*.52,w/bays-.047,.018,h*.72,'wood',.002)
            for j in[-1,0,1]:box('fine vertical shutter slat',xx+j*(w/bays-.06)/3,yy+side*.011,z+h*.52,.009,.007,h*.66,'dark',.001)
        for i in range(bays+1):box('red veranda column',x-w/2+i*w/bays,yy+side*.026,z+h/2,.038,.045,h+.015,'red',.004)
        for zz in[z+.040,z+h-.022]:box('veranda horizontal timber rail',x,yy+side*.026,zz,w+.030,.045,.031,'red',.003)
    for side in[-1,1]:
        xx=x+side*(w/2+.008)
        box('side dark timber window',xx,y,z+h*.52,.018,d*.67,h*.72,'dark',.002)
        for yy in[y-d/2,y,y+d/2]:box('side red upright',xx+side*.015,yy,z+h/2,.035,.035,h+.01,'red',.003)
        for zz in[z+.04,z+h-.02]:box('side red sill and lintel',xx+side*.015,y,zz,.035,d+.025,.031,'red',.003)

def roof_point(face,u,t,w,d,z,h,ridge,curl):
    x=u*(w/2*(1-t)+ridge*t);y=-d/2*(1-t)
    zz=z+h*(.68*t+.32*t*t)+curl*abs(u)**8*(1-t)**4+.005*(1-t)**6
    if face=='back':y=-y
    elif face in['right','left']:x=(w/2*(1-t)+ridge*t)*(1 if face=='right'else-1);y=u*d/2*(1-t)
    return Vector((x,y,zz))
def roof(name,cx,cy,w,d,z,h,ridge,mat,cols=44,curl=.035):
    offset=Vector((cx,cy,0));rows=16
    for face in['front','back','left','right']:
        count=cols if face in['front','back']else max(14,int(cols*d/w))
        v=[tuple(roof_point(face,-1+2*i/count,j/rows,w,d,z,h,ridge,curl)+offset)for j in range(rows+1)for i in range(count+1)]
        f=[]
        for j in range(rows):
            for i in range(count):
                a=j*(count+1)+i;face_idx=(a,a+1,a+count+2,a+count+1)
                p0,p1,p2=[Vector(v[k])for k in face_idx[:3]]
                if(p1-p0).cross(p2-p0).z<0:face_idx=tuple(reversed(face_idx))
                f.append(face_idx)
        o=k.mesh(name+' curved glazed roof',v,f,mat,0);o.modifiers.new('Glazed roof thickness','SOLIDIFY').thickness=.018
        for poly in o.data.polygons:poly.use_smooth=True
        for i in range(count+1):strip('fine glazed tile roll',[tuple(roof_point(face,-1+2*i/count,j/24,w,d,z,h,ridge,curl)+offset+Vector((0,0,.005)))for j in range(25)],mat,.0022,0)
        for j in range(1,10):strip('subtle overlapping tile course',[tuple(roof_point(face,-1+2*i/32,j/10,w,d,z,h,ridge,curl)+offset+Vector((0,0,.004)))for i in range(33)],mat,.0013,0)
        edge=[roof_point(face,-1+2*i/40,0,w,d,z,h,ridge,curl)+offset for i in range(41)]
        strip('red timber roof soffit',[tuple(p-Vector((0,0,.022)))for p in edge],'red',.017)
        strip('gilded eave lip',[tuple(p)for p in edge],'brass',.014,2)
    for face in['front','back']:
        for u in[-1,1]:
            pts=[roof_point(face,u,j/32,w,d,z,h,ridge,curl)+offset+Vector((0,0,.010))for j in range(33)]
            strip('gilded hip seam',[tuple(p)for p in pts],'brass',.014,2)
            p=pts[0];sy=-1 if face=='front' else 1
            strip('small rising roof corner',[tuple(p),tuple(p+Vector((u*.015,sy*.025,.030))),tuple(p+Vector((u*.006,sy*.012,.064)))],'brass',.012,2)
    strip('golden ridge',[(cx-ridge,cy,z+h+.014),(cx+ridge,cy,z+h+.014)],'brass',.020,2)
def ridge_crest(x,y,z,size=1):
    k.cylinder('crest short stem',(x,y,z+.018*size),.022*size,.042*size,'brass',24)
    leaf=[(-.025,0),(.022,0),(.054,.035),(.056,.068),(.029,.12),(.017,.16),(.003,.111),(-.025,.072),(-.033,.028)]
    n=len(leaf);v=[(x+a*size,y+side*.013*size,z+b*size)for side in[-1,1]for a,b in leaf]
    k.mesh('small gilded flame crest',v,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],'brass',.004)

timber_hall('central lower hall',0,.02,1.30,1.34,.58,.315,5)
roof('central lower gold canopy',0,.015,1.62,.80,1.615,.160,.40,'gold',44,.017)
timber_hall('central upper hall',0,.045,1.755,1.25,.52,.345,5)
roof('great upper golden roof',0,.045,1.88,1.07,2.100,.340,.40,'gold',56,.050)
for x in[-.40,.40]:ridge_crest(x,.045,2.452,.85)
k.ball('ridge small central bead',(0,.045,2.47),.019,'brass')
for x in[-1.15,1.15]:
    timber_hall('side vermilion pavilion',x,0,1.315,.61,.59,.345,2)
    roof('side emerald roof',x,0,.83,.81,1.660,.255,.018,'jade',34,.040)
    k.ball('green pavilion ridge ornament',(x,0,1.944),.025,'brass')


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"hue","Huế","Ngọ Môn",revision=2,status='visual-direction-accepted')
