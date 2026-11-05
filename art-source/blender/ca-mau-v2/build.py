"""Dat Mui sculptural sailboat, rebuilt from the supplied concept. Review only."""
import bpy, math, json, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='ca-mau-v2'
palette=dict(k.PALETTE,ivory='#edddbd',white='#fff0d3',plaster='#e0c8a0',gold='#cbb18a',water='#329daa',thatch='#f3ddba',stone='#dcc49e')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['gold','stone']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.56
bs=k.M['water'].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=.03;bs.inputs['Roughness'].default_value=.24;bs.inputs['Coat Weight'].default_value=.28
def box(name,x,y,z,w,d,h,mat='ivory',bevel=.01):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='white',r=.012,roundness=2):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=roundness;o.data.use_fill_caps=True;return o
def smooth(o):
    for p in o.data.polygons:p.use_smooth=True
    return o
def rounded_outline(w,d,r):
    points=[]
    for x,y,a in[(w/2-r,d/2-r,0),(-w/2+r,d/2-r,90),(-w/2+r,-d/2+r,180),(w/2-r,-d/2+r,270)]:
        for i in range(17):
            angle=math.radians(a+90*i/16);points.append((x+r*math.cos(angle),y+r*math.sin(angle)))
    return points

# Quiet turquoise inset and a cream display plinth, matching the concept.
box('display stone base',0,0,.065,2.60,1.85,.13,'ivory',.018)
box('base upper chamfer',0,0,.139,2.56,1.81,.025,'white',.006)
outer=rounded_outline(2.30,1.43,.24);inner=rounded_outline(2.17,1.30,.19);n=len(outer)
verts=[(x,y,z)for z in[.151,.164]for ring in[outer,inner]for x,y in ring]
faces=[]
for i in range(n):
    j=(i+1)%n
    faces.extend([(2*n+i,2*n+j,3*n+j,3*n+i),(i,j,2*n+j,2*n+i),(n+j,n+i,3*n+i,3*n+j)])
k.mesh('recessed basin stone rim',verts,faces,'ivory',.002)
k.mesh('turquoise still water',[(x,y,.155)for x,y in inner],[tuple(range(n))],'water',0)

# Elliptical stepped pedestal under the keel, rather than a floating boat.
for z,r,depth,sx,sy,mat in[(.184,.71,.057,1.29,.43,'plaster'),(.218,.70,.025,1.29,.43,'white'),(.263,.66,.070,1.29,.43,'plaster'),(.303,.66,.023,1.29,.43,'ivory')]:
    o=k.cylinder('elliptical sculptural foot',(0,0,z),r,depth,mat,96);o.scale=(sx,sy,1)

def hull_point(u,t):
    width=.325*max(0,1-u*u)**.65
    top=.86+.46*abs(u)**2.7;bottom=.31+.96*abs(u)**3.5
    return(1.10*u,-width*math.cos(t),bottom+(top-bottom)*abs(math.cos(t))**2.2)
cols=112;rows=40
verts=[hull_point(-1+2*i/cols,math.pi*j/rows)for i in range(cols+1)for j in range(rows+1)]
faces=[]
for i in range(cols):
    for j in range(rows):
        a=i*(rows+1)+j;faces.append((a,a+1,a+rows+2,a+rows+1))
hull=smooth(k.mesh('continuous hollow crescent hull',verts,faces,'plaster',0))
shell=hull.modifiers.new('Carved stone hull thickness','SOLIDIFY');shell.thickness=.042;shell.offset=-1
shell.use_even_offset=True
for t in[0,math.pi]:
    strip('thick bright gunwale',[hull_point(-1+2*i/112,t)for i in range(113)],'white',.024,3)
    pts=[]
    for i in range(109):
        u=-.965+1.93*i/108;x,y,z=hull_point(u,t);pts.append((x,y,z-.045))
    strip('outer gunwale moulding',pts,'ivory',.009)
# Two restrained curved relief bands on the visible hull, not a plank texture.
for value,lo,hi,mat,r in[(.82,-.87,.36,'gold',.008),(.53,-.71,.71,'ivory',.012)]:
    pts=[]
    for i in range(97):
        u=lo+(hi-lo)*i/96;x,y,z=hull_point(u,math.acos(value));pts.append((x,y-.006,z))
    strip('shallow hull relief band',pts,mat,r)

def sail_point(side,u,t):
    if side==1:
        inner=0;outer=1.00*t**1.65
    else:
        inner=-.22*t;outer=-.80*t**1.25
    x=inner*(1-u)+outer*u
    z=3.40-(2.28*(1-u)+2.10*u)*t
    y=.035+(.11 if side==1 else .075)*math.sin(math.pi*u)*math.sin(math.pi*t)
    return(x,y,z)
for side in[-1,1]:
    # True curved stone sail sheets; thickness and both sides are retained in GLB.
    across=24;down=64
    v=[sail_point(side,i/across,j/down)for j in range(down+1)for i in range(across+1)]
    f=[]
    for j in range(down):
        for i in range(across):
            a=j*(across+1)+i;f.append((a,a+1,a+across+2,a+across+1))
    o=smooth(k.mesh('right curved sail'if side==1 else'left inset curved sail',v,f,'thatch'if side==1 else'ivory',0))
    m=o.modifiers.new('Sculptural sail panel thickness','SOLIDIFY');m.thickness=.018;m.offset=0
    for edge in[0,1]:strip('sail fine raised edge',[sail_point(side,edge,j/64)for j in range(65)],'white',.007)
    strip('sail curved lower hem',[sail_point(side,i/40,1)for i in range(41)],'white',.010)
strip('left diagonal sculptural sail spar',[sail_point(-1,0,j/64)for j in range(65)],'ivory',.018)

# Tapered mast and three gently upturned arms in front of the sail.
mast=k.cylinder('tapered ivory mast',(.012,-.105,1.985),.027,2.85,'white',48,r2=.011)
k.ball('mast soft top',(.012,-.105,3.410),.013,'white')
for z,length,r in[(1.56,.43,.024),(2.00,.35,.023),(2.44,.27,.022)]:
    pts=[]
    for i in range(25):
        q=-1+2*i/24;pts.append((.012+q*length/2,-.145-.012*(1-q*q),z+.031*q*q))
    strip('rounded upward cross arm',pts,'white',r,3)
k.cylinder('small upper mast collar',(.012,-.105,2.99),.020,.032,'ivory',32)

# Partial cream walkway wrapping the starboard edge of the water inset.
segments=64;v=[]
for z in[.16,.218]:
    for radius in[.93,1.08]:
        for i in range(segments+1):
            a=math.radians(-53+106*i/segments);v.append((radius*math.cos(a),radius*.52*math.sin(a),z))
n=segments+1;f=[]
for i in range(segments):f.extend([(2*n+i,3*n+i,3*n+i+1,2*n+i+1),(i,2*n+i,2*n+i+1,i+1),(n+i+1,3*n+i+1,3*n+i,n+i)])
f.extend([(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)])
k.mesh('curved stone water edge walkway',v,f,'white',.006)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"ca-mau","Cà Mau","Biểu tượng Đất Mũi",revision=2,status='visual-direction-accepted')
