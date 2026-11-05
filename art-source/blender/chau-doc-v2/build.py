"""One-at-a-time concept matching: Chau Doc, revision 2. Not integrated in game."""
import bpy, math, sys, json, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('landmark_kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='chau-doc-v2'
palette=dict(k.PALETTE,plaster='#eda83e',white='#fff0cc',ivory='#efdfbb',red='#ae2816',jade='#08694f',gold='#e3a323',wood='#972a15',teal='#153e35')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in ['jade','gold']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.34 if name=='jade'else.3
    bs.inputs['Metallic'].default_value=.08 if name=='jade'else.65
    bs.inputs['Coat Weight'].default_value=.24

def strip(name,pts,mat,r=.012,roundness=1):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=roundness;o.data.use_fill_caps=True;return o

def box(name,x,y,z,w,d,h,mat='plaster',bevel=.012):
    return k.box(name,(x,y,z),(w,d,h),mat,bevel)

def roof_point(face,u,t,w,d,h,z,ridge):
    # Swept hipped roof: concave slope, continuous soft upturn at all four corners.
    x=u*(w/2*(1-t)+ridge*t);y=-d/2*(1-t)
    lift=.075*(abs(u)**8)*(1-t)**4+.009*(1-t)**6
    zz=z+h*(.62*t+.38*t*t)+lift
    if face=='back':y=-y
    elif face in ['right','left']:
        x=(w/2*(1-t)+ridge*t)*(1 if face=='right'else-1)
        y=u*d/2*(1-t)
    return(x,y,zz)

def curved_roof(name,w,d,z,h,ridge,cols):
    rows=16
    for face in ['front','back','left','right']:
        count=cols if face in ['front','back']else max(18,int(cols*d/w))
        verts=[roof_point(face,-1+2*i/count,j/rows,w,d,h,z,ridge)for j in range(rows+1)for i in range(count+1)]
        faces=[]
        for j in range(rows):
            for i in range(count):
                a=j*(count+1)+i;f=(a,a+1,a+count+2,a+count+1)
                p0,p1,p2=[Vector(verts[v])for v in f[:3]]
                if(p1-p0).cross(p2-p0).z<0:f=tuple(reversed(f))
                faces.append(f)
        o=k.mesh(name+' ceramic surface '+face,verts,faces,'jade',0)
        o.modifiers.new('Ceramic roof thickness','SOLIDIFY').thickness=.025
        for p in o.data.polygons:p.use_smooth=True
        for i in range(count+1):
            u=-1+2*i/count
            strip('fine glazed tile roll',[tuple(Vector(roof_point(face,u,t/16,w,d,h,z,ridge))+Vector((0,0,.006)))for t in range(17)],'jade',.003,0)
        for j in range(1,10):
            t=j/10
            strip('subtle overlapping tile course',[tuple(Vector(roof_point(face,-1+2*i/28,t,w,d,h,z,ridge))+Vector((0,0,.005)))for i in range(29)],'jade',.0018,0)
        edge=[roof_point(face,-1+2*i/40,0,w,d,h,z,ridge)for i in range(41)]
        strip('red timber soffit',[(x,y,zz-.029)for x,y,zz in edge],'red',.021)
        strip('ivory fascia',[(x,y,zz-.006)for x,y,zz in edge],'white',.018)
        strip('glazed eave lip',edge,'jade',.012)
    for face in ['front','back']:
        for u in[-1,1]:
            points=[tuple(Vector(roof_point(face,u,j/24,w,d,h,z,ridge))+Vector((0,0,.016)))for j in range(25)]
            strip('gilded hip ridge',points,'gold',.022,2)
            corner=Vector(points[0]);sign=1 if face=='front'else-1
            strip('upturned eave curl',[tuple(corner+Vector((0,-sign*.015,0))),tuple(corner+Vector((u*.018,-sign*.03,.035))),tuple(corner+Vector((u*.01,-sign*.018,.071)))],'gold',.018,2)
    strip('gilded horizontal ridge',[(-ridge,0,z+h+.02),(ridge,0,z+h+.02)],'gold',.025,2)

def rect_door(x,y,z,w,h,panels=2):
    box('door reveal',x,y+.01,z+h/2,w+.065,.055,h+.04,'wood',.008)
    for i in range(panels):
        px=x-w/2+(i+.5)*w/panels
        box('vermilion door leaf',px,y-.023,z+h/2,w/panels-.008,.028,h,'red',.004)
        box('door raised central panel',px,y-.041,z+h*.53,w/panels-.04,.008,h*.79,'wood',.003)
    for px in[x-w/2-.02,x+w/2+.02]:box('ivory door jamb',px,y-.025,z+h/2,.035,.07,h+.075,'white',.006)
    box('door lintel',x,y-.03,z+h+.018,w+.11,.075,.047,'gold',.006)

def pilaster(x,y,bottom,h):
    box('square ivory pilaster',x,y,bottom+h/2,.085,.095,h,'white',.01)
    for zz,ww,hh in[(bottom+.045,.14,.09),(bottom+.105,.105,.032),(bottom+h-.04,.13,.04)]:
        box('pilaster moulding',x,y,zz,ww,.135,hh,'white',.008)

def clerestory(w,d,z,h,divisions):
    box('clerestory red body',0,0,z+h/2,w,d,h,'red')
    for y in[-d/2-.005,d/2+.005]:
        for i in range(divisions):
            x=-w/2+(i+.5)*w/divisions
            box('clerestory inset red panel',x,y,z+h*.53,w/divisions-.045,.018,h*.66,'wood',.003)
        for i in range(divisions+1):box('clerestory cream upright',-w/2+i*w/divisions,y-.01,z+h/2,.025,.045,h+.01,'white',.004)
        for zz in[z+.01,z+h-.01]:box('clerestory horizontal moulding',0,y,zz,w+.045,.055,.028,'white',.004)
    for x in[-w/2-.005,w/2+.005]:
        for i in range(3):
            y=-d/2+(i+.5)*d/3
            box('side clerestory panel',x,y,z+h/2,.018,d/3-.04,h*.7,'wood',.003)
        for yy in[-d/2,-d/6,d/6,d/2]:box('side clerestory upright',x,yy,z+h/2,.04,.022,h,'white',.003)

# Broad, squat hall and porch rather than the previous tall pagoda tower.
box('display foundation',0,0,.055,2.42,1.75,.11,'ivory',.025)
box('foundation rim',0,0,.125,2.32,1.63,.035,'white',.008)
box('hall stone foot',0,.055,.205,2.04,1.20,.15,'ivory',.015)
box('main sanctuary',0,.075,.60,1.93,1.05,.68,'plaster',.015)
for side in[-1,1]:
    box('projecting side portal',side*.77,-.34,.6,.41,.46,.68,'plaster',.012)
    rect_door(side*.77,-.58,.28,.23,.53,panels=1)
    pilaster(side*.98,-.57,.265,.67)
    pilaster(side*.55,-.57,.265,.67)
# Dark recess behind the central red door and paired round red columns.
box('porch recessed shadow',0,-.459,.59,1.04,.027,.64,'wood',.006)
rect_door(0,-.49,.275,.51,.55)
for side in[-1,1]:
    k.cylinder('porch red column',(side*.47,-.58,.60),.039,.67,'red',24)
    k.cylinder('porch column base',(side*.47,-.58,.285),.055,.045,'gold',24)
    k.cylinder('porch column capital',(side*.47,-.58,.915),.057,.05,'gold',24)
    # A framed dark rectangular side window, as in the reference, not an arch.
    box('side window reveal',side*.971,.17,.57,.018,.30,.41,'wood',.003)
    box('side window dark glass',side*.983,.17,.57,.015,.25,.35,'teal',.002)
    for yy in[.015,.325]:box('side window ivory jamb',side*.993,yy,.57,.035,.025,.44,'white',.004)
    for zz in[.35,.79]:box('side window lintel',side*.993,.17,zz,.035,.33,.025,'gold',.004)
    box('side window mullion',side*1.003,.17,.57,.018,.015,.35,'wood',.002)
box('veranda front floor',0,-.51,.263,1.25,.27,.05,'white',.008)
for i in range(5):
    y=-1.01+i*.075;h=(i+1)*.027
    box('broad entrance step',0,y,.14+h/2,1.12,.075,h,'white',.006)
for side in[-1,1]:
    x=side*.61;yf=-1.065;yb=-.615;zb=.14
    verts=[(x-.055,yf,zb),(x+.055,yf,zb),(x+.055,yb,zb),(x-.055,yb,zb),(x-.055,yf,.20),(x+.055,yf,.20),(x+.055,yb,.405),(x-.055,yb,.405)]
    o=k.mesh('sloped ivory stair cheek',verts,[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],'white',.018)
    strip('stair rail rounded cap',[(x,yf,.21),(x,yb,.415)],'white',.023,2)
    box('stair end square foot',x,yf+.02,.17,.15,.14,.10,'ivory',.012)

curved_roof('lower roof',2.19,1.34,.96,.33,.58,56)
# Two gold ribs divide the broad front roof into the three bays visible in the concept.
for u in[-.55,.55]:
    points=[tuple(Vector(roof_point('front',u,j/24,2.19,1.34,.33,.96,.58))+Vector((0,0,.018)))for j in range(25)]
    strip('lower roof bay gilding',points,'gold',.022,2)
    x,y,z=points[0];strip('bay curled finial',[(x,y,z),(x,y-.025,z+.026),(x,y-.012,z+.06)],'gold',.018,2)

clerestory(1.33,.79,1.245,.245,5)
curved_roof('middle roof',1.70,1.10,1.505,.305,.36,44)
clerestory(.89,.57,1.765,.205,3)
curved_roof('upper roof',1.18,.83,1.985,.27,.075,34)
for r,z,depth in[(.105,2.283,.055),(.082,2.342,.065),(.056,2.407,.068)]:k.cylinder('tiered finial collar',(0,0,z),r,depth,'gold',32,r2=r*.86)
k.ball('finial lotus bud',(0,0,2.438),.052,'gold',(1,1,1.2))
k.cylinder('finial tapered point',(0,0,2.515),.039,.115,'gold',24,r2=0)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"chau-doc","Châu Đốc","Miếu Bà Chúa Xứ",revision=2,status='visual-direction-accepted')
