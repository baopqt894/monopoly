"""Kon Klor communal house concept study: tall reed roof, timber gable, raised floor."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='kon-tum-v2'
palette=dict(k.PALETTE,ivory='#eddbb5',white='#ffebc3',wood='#643718',plaster='#8d4f1e',gold='#d88a13',brass='#b87513',dark='#302114',thatch='#c87c0d',stone='#ad6b2c',red='#6c3718')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['thatch','gold','brass','dark']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.76
def box(name,x,y,z,w,d,h,mat='wood',bevel=.006):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='gold',r=.006,res=1):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=res;o.data.use_fill_caps=True;return o
def log_between(name,a,b,r=.027,mat='wood'):
    a,b=Vector(a),Vector(b)
    o=k.cylinder(name,(a+b)/2,r,(b-a).length,mat,20);o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()
    return o
box('cream display base',0,-.16,.055,2.35,2.30,.11,'ivory',.016)
box('display top bevel',0,-.16,.117,2.31,2.26,.018,'white',.004)

# Eight rounded timber stilts and actual floor/double rim beams.
for x in[-.68,0,.68]:
    for y in[-.43,.43]:
        k.cylinder('round timber stilt',(x,y,.337),.042,.424,'wood',24)
        k.cylinder('post foot collar',(x,y,.142),.047,.032,'wood',24)
for x in[-.68,.68]:k.cylinder('middle side stilt',(x,0,.337),.042,.424,'wood',24)
box('raised plank floor',0,0,.562,1.62,1.13,.065,'wood')
for y in[-.56,.56]:
    box('long dark floor beam',0,y,.547,1.71,.065,.09,'wood')
    box('floor edge warm bevel',0,y-.012,.593,1.72,.07,.022,'plaster',.003)
for x in[-.82,.82]:box('end floor beam',x,0,.552,.065,1.19,.09,'wood')
box('solid timber wall body',0,0,.867,1.57,1.065,.55,'wood')
# Individually raised wall boards; door and window frames sit proud of these boards.
for side in[-1,1]:
    for i in range(31):
        x=-.765+(i+.5)*1.53/31
        box('long wall vertical board',x,side*.538,.865,1.53/31-.004,.018,.53,'plaster'if i%5==0 else'red',.002)
    for i in range(21):
        y=-.52+(i+.5)*1.04/21
        box('end wall vertical board',side*.793,y,.865,.018,1.04/21-.004,.53,'plaster'if i%4==0 else'red',.002)
    for z in[.627,1.105]:
        box('long wall timber rail',0,side*.557,z,1.63,.035,.034,'wood',.003)
        box('end wall timber rail',side*.811,0,z,.035,1.13,.034,'wood',.003)
    for x in[-.755,-.30,.30,.755]:box('front timber upright',x,side*.56,.867,.032,.035,.52,'wood',.003)

def front_window(x):
    box('deep square window recess',x,-.566,.858,.235,.022,.274,'dark',.002)
    for px in[x-.128,x+.128]:box('window jamb',px,-.587,.858,.028,.04,.31,'plaster',.003)
    for z in[.706,1.010]:box('window sill and lintel',x,-.59,z,.28,.047,.027,'plaster',.003)
    box('window wooden center mullion',x,-.597,.858,.028,.027,.274,'wood',.003)
front_window(-.51);front_window(.51)
box('central entry shadow',0,-.570,.827,.325,.025,.465,'dark',.003)
for x in[-.18,.18]:box('door heavy timber jamb',x,-.597,.827,.038,.055,.50,'plaster',.004)
box('entry wooden lintel',0,-.597,1.077,.40,.055,.044,'wood')
box('door threshold',0,-.60,.602,.39,.095,.032,'plaster')
for side in[-1,1]:
    box('side small window shadow',side*.819,.10,.863,.020,.20,.245,'dark',.002)
    for y in[-.015,.215]:box('side window jamb',side*.836,y,.863,.035,.025,.282,'plaster',.003)
    for z in[.728,.998]:box('side window sill',side*.837,.10,z,.04,.255,.026,'plaster',.003)
    box('side window mullion',side*.844,.10,.863,.025,.025,.245,'wood',.003)

# Seven open timber treads on rounded ladder stringers, no modern railing.
for i in range(7):
    y=-1.17+i*.087;top=.170+i*.066
    box('entry timber stair tread',0,y,top-.020,.36,.092,.040,'wood',.006)
    log_between('round stair nosing',(-.18,y-.04,top),(.18,y-.04,top),.013,'plaster')
for x in[-.205,.205]:
    a=(x,-1.225,.145);b=(x,-.585,.60)
    log_between('ladder side log stringer',a,b,.029,'wood')
    k.ball('soft ladder foot',a,.029,'wood');k.ball('ladder top end',b,.030,'plaster')

ROOF_X=.76;ROOF_Y=.95;EAVE=1.125;RIDGE=3.24
def roof_point(x,t,side):return(x*(1+.34*t),side*ROOF_Y*t,EAVE+(RIDGE-EAVE)*(1-t)**1.53+.015*t**8)
# Dark vertical timber infill in the tall triangular gables at the two ends.
for x in[-.74,.74]:
    count=42;half=.725
    for i in range(count):
        y0=-half+2*half*i/count+.001;y1=-half+2*half*(i+1)/count-.001
        h0=roof_point(x,abs(y0)/ROOF_Y,1)[2]-.025;h1=roof_point(x,abs(y1)/ROOF_Y,1)[2]-.025
        v=[(xx,y,z)for xx in[x-.009,x+.009]for y,z in[(y0,1.108),(y1,1.108),(y1,h1),(y0,h0)]]
        k.mesh('gable fine vertical timber plank',v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'plaster'if i%6==0 else'wood',.001)
    for z in[1.15,1.54,1.94,2.34,2.72]:
        halfspan=ROOF_Y*(1-((z-EAVE)/(RIDGE-EAVE))**(1/1.53))
        box('gable horizontal lashing batten',x+( .018 if x>0 else-.018),0,z,.025,2*halfspan,.021,'stone',.002)

for side in[-1,1]:
    along=80;across=64
    v=[roof_point(-ROOF_X+2*ROOF_X*i/along,j/across,side)for i in range(along+1)for j in range(across+1)]
    f=[]
    for i in range(along):
        for j in range(across):
            a=i*(across+1)+j;face=(a,a+1,a+across+2,a+across+1)
            p0,p1,p2=[Vector(v[k])for k in face[:3]]
            if(p1-p0).cross(p2-p0).z<0:face=tuple(reversed(face))
            f.append(face)
    o=k.mesh('tall curved golden reed roof',v,f,'thatch',0);o.modifiers.new('Thatch roof thickness','SOLIDIFY').thickness=.035
    for poly in o.data.polygons:poly.use_smooth=True
    for i in range(97):
        x=-ROOF_X+2*ROOF_X*i/96
        strip('fine reed bundle',[tuple(Vector(roof_point(x,j/40,side))+Vector((0,0,.006)))for j in range(41)],'gold',.0035,0)
    for j in range(1,19):
        t=j/19
        strip('subtle reed binding course',[tuple(Vector(roof_point(-ROOF_X+2*ROOF_X*i/64,t,side))+Vector((0,0,.007)))for i in range(65)],'brass',.0018,0)
    for x in[-ROOF_X,ROOF_X]:
        points=[tuple(Vector(roof_point(x,j/64,side))+Vector((0,0,.007)))for j in range(65)]
        strip('thick golden gable edge',points,'gold',.025,2)
        strip('gable edge warm inner line',[(xx,yy,zz-.016)for xx,yy,zz in points],'brass',.006)
    strip('rounded reed eave edge',[roof_point(-ROOF_X+2*ROOF_X*i/64,1,side)for i in range(65)],'gold',.021,2)
ridge=k.cylinder('rolled reed ridge cap',(0,0,RIDGE+.015),.057,2*ROOF_X,'thatch',48);ridge.rotation_euler.y=math.pi/2
for i in range(34):
    x=-ROOF_X+2*ROOF_X*i/33
    strip('ridge reed wrapping',[(x,.059*math.cos(math.tau*j/32),RIDGE+.015+.059*math.sin(math.tau*j/32))for j in range(33)],'gold',.004,0)
for x in[-ROOF_X,ROOF_X]:
    k.cylinder('ridge end carved upward peg',(x,0,RIDGE+.110),.042,.212,'gold',24,r2=.009)
    k.cylinder('ridge end binding collar',(x,0,RIDGE+.025),.049,.045,'brass',24)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"kon-tum","Kon Tum","Nhà rông Kon Klor",revision=2,status='visual-direction-accepted')
