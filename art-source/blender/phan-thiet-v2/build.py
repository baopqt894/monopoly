"""Phan Thiet water tower: tapered octagonal shaft, arched glass, panelled tank, red roofs."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='phan-thiet-v2'
palette=dict(k.PALETTE,ivory='#e9c78d',white='#ffe1ac',plaster='#d49b45',gold='#ca8c38',wood='#bd8e50',red='#a72c0d',brick='#c23e16',teal='#126d82',dark='#765534')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['ivory','white','plaster','gold','wood','red','brick']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.61
p=k.M['teal'].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.08;p.inputs['Roughness'].default_value=.30;p.inputs['Coat Weight'].default_value=.24
FRONT=-math.pi/3;START=FRONT-math.pi/8
def box(name,x,y,z,w,d,h,mat='white',bevel=.005):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='white',r=.008,res=1):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=res;o.data.use_fill_caps=True;return o
def ring_points(r,z):return[(r*math.cos(START+i*math.pi/4),r*math.sin(START+i*math.pi/4),z)for i in range(9)]
def octagon(name,r0,r1,z,h,mat='ivory',bevel=.006):
    v=ring_points(r0,z)[:-1]+ring_points(r1,z+h)[:-1]
    f=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8)for i in range(8)]
    return k.mesh(name,v,f,mat,bevel)
def pose_parts(first,theta,radius,z=0):
    rot=theta+math.pi/2;turn=Matrix.Rotation(rot,4,'Z')
    for o in k.PARTS[first:]:
        o.location=turn@o.location+Vector((radius*math.cos(theta),radius*math.sin(theta),z));o.rotation_euler.z+=rot
def panel_drum(name,r,z,h,panel='ivory',frame='white',bar=.024):
    octagon(name+' inner body',r*.88,r*.88,z,h,panel,.003)
    w=2*r*math.sin(math.pi/8);ap=r*math.cos(math.pi/8)
    for i in range(8):
        first=len(k.PARTS)
        box('recessed rectangular tank panel',0,.017,z+h/2,w-2*bar,.024,h-2*bar,panel,.003)
        for x in[-w/2+bar/2,w/2-bar/2]:box('tank panel corner stile',x,0,z+h/2,bar,.058,h,frame,.004)
        for zz in[z+bar/2,z+h-bar/2]:box('tank panel horizontal border',0,0,zz,w,.058,bar,frame,.004)
        pose_parts(first,FRONT+i*math.pi/4,ap)

box('cream display parcel',0,0,.055,2.30,2.05,.11,'ivory',.016)
box('display top bevel',0,0,.116,2.26,2.01,.018,'white',.004)
sculpture_start=len(k.PARTS)
octagon('octagonal stone foot',.73,.73,.13,.165,'ivory',.010)
octagon('stone foot bright top edge',.735,.72,.285,.023,'white',.006)
panel_drum('ochre base pedestal',.56,.307,.275,'gold','plaster',.026)
octagon('base pedestal cream shoulder',.575,.515,.582,.046,'white',.005)

RB=.48;RT=.40;ZB=.625;HEIGHT=1.405
ap0=RB*math.cos(math.pi/8);ap1=RT*math.cos(math.pi/8)
wb=2*RB*math.sin(math.pi/8);wt=2*RT*math.sin(math.pi/8)
for i in range(8):
    first=len(k.PARTS)
    c=bpy.data.curves.new('Tapered shaft with rounded arch opening','CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=.022;c.resolution_u=1
    outline=[(-wb/2,0),(wb/2,0),(wt/2,HEIGHT),(-wt/2,HEIGHT)]
    hole=[(x,z+.108)for x,z in k.arch_points(.145,1.130)]
    for pts in[outline,list(reversed(hole))]:
        sp=c.splines.new('POLY');sp.points.add(len(pts)-1)
        for p,(x,z)in zip(sp.points,pts):p.co=(x,z,0,1)
        sp.use_cyclic_u=True
    o=bpy.data.objects.new('octagonal tapered shaft face',c);scene.collection.objects.link(o);o.rotation_euler.x=math.pi/2
    k.register(o,'shaft wall with true arch opening','plaster')
    k.panel('recessed tall blue arched glazing',0,.010,.108,.145,1.130,'teal')
    arch=k.arch_points(.170,1.165)[1:]
    strip('ivory round arch window reveal',[(x,-.025,z+.095)for x,z in arch]+[(-.085,-.025,.095)],'white',.008,2)
    box('window bevel sill',0,-.026,.105,.194,.046,.030,'white',.003)
    # Apply a true shear so wall, glass and reveal lean inward consistently with the shaft.
    for idx in range(first,len(k.PARTS)):
        o=k.PARTS[idx]
        if o.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
            bpy.ops.object.convert(target='MESH');o=bpy.context.object;k.PARTS[idx]=o
        o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
        for v in o.data.vertices:v.co.y+=(ap0-ap1)*v.co.z/HEIGHT
        o.data.update()
    pose_parts(first,FRONT+i*math.pi/4,ap0,ZB)
# Cream corner pilasters follow the taper and hide the seams between eight wall panels.
for i in range(8):
    a=START+i*math.pi/4
    k.beam('sloping cream shaft corner',(RB*math.cos(a),RB*math.sin(a),ZB),(RT*math.cos(a),RT*math.sin(a),ZB+HEIGHT),.042,'white')
octagon('shaft top neck collar',.435,.435,2.030,.055,'white')
octagon('splayed tank support bowl',.420,.655,2.085,.310,'plaster',.006)
for i in range(8):
    a=START+i*math.pi/4
    k.beam('support bowl faceted rib',(.426*math.cos(a),.426*math.sin(a),2.092),(.655*math.cos(a),.655*math.sin(a),2.390),.027,'ivory')
octagon('tank lower moulded band',.668,.668,2.388,.055,'white')
panel_drum('main octagonal water tank',.655,2.443,.385,'ivory','white',.027)
octagon('tank upper cornice',.684,.684,2.825,.050,'white')

def tiled_roof(name,r0,r1,z,h):
    def point(face,u,t):
        a=START+face*math.pi/4;b=a+math.pi/4
        left=Vector((math.cos(a),math.sin(a),0));right=Vector((math.cos(b),math.sin(b),0))
        p=(left*(1-u)+right*u)*(r0*(1-t)+r1*t)
        p.z=z+h*t
        return p
    for face in range(8):
        rows=12;cols=16
        v=[tuple(point(face,i/cols,j/rows))for j in range(rows+1)for i in range(cols+1)]
        f=[]
        for j in range(rows):
            for i in range(cols):
                a=j*(cols+1)+i;f.append((a,a+1,a+cols+2,a+cols+1))
        o=k.mesh(name+' red ceramic facet',v,f,'red',0);o.modifiers.new('Ceramic roof thickness','SOLIDIFY').thickness=.018
        for poly in o.data.polygons:poly.use_smooth=True
        for i in range(13):strip('fine red tile barrel',[tuple(point(face,i/12,j/16)+Vector((0,0,.004)))for j in range(17)],'brick',.0016,0)
        for j in range(1,7):strip('red tile overlapping course',[tuple(point(face,i/24,j/7)+Vector((0,0,.004)))for i in range(25)],'red',.0011,0)
        strip('red roof hip cap',[tuple(point(face,0,j/24)+Vector((0,0,.010)))for j in range(25)],'brick',.012,2)
        strip('red eave rounded lip',[tuple(point(face,i/24,0))for i in range(25)],'brick',.012,2)

tiled_roof('lower wide roof',.735,.470,2.875,.205)
panel_drum('middle cream roof drum',.470,3.080,.160,'ivory','white',.018)
octagon('middle roof cream fascia',.508,.508,3.228,.027,'white')
tiled_roof('middle roof',.540,.290,3.250,.170)
panel_drum('upper cream roof drum',.290,3.420,.130,'ivory','white',.015)
octagon('top roof cream fascia',.330,.330,3.538,.025,'white')
tiled_roof('top octagonal cap',.360,0,3.560,.300)
k.ball('small red roof apex',(0,0,3.863),.013,'brick')
for o in k.PARTS[sculpture_start:]:o.location.z=.13+(o.location.z-.13)*.88;o.scale.z*=.88


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"phan-thiet","Phan Thiết","Tháp nước Phan Thiết",revision=2,status='visual-direction-accepted')
