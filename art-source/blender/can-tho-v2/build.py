"""Binh Thuy concept study. Editable Blender geometry; separate from game map."""
import bpy, math, json, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='can-tho-v2'
palette=dict(k.PALETTE,plaster='#edaa31',white='#fff0cd',ivory='#eddfbf',red='#aa2914',wood='#073e35',teal='#075345',brick='#b6351a',shadow='#253b2f')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in ['teal','wood']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.43
def box(name,x,y,z,w,d,h,mat='plaster',bevel=.009):
    return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='white',r=.012):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=2;o.data.use_fill_caps=True;return o
def pilaster(x,y,z,h,w=.065):
    box('cream pilaster shaft',x,y,z+h/2,w,.065,h,'white')
    for zz,ww,hh in [(z+.035,w+.055,.07),(z+.09,w+.025,.035),(z+h-.045,w+.065,.045),(z+h-.012,w+.045,.025)]:
        box('pilaster moulded base and capital',x,y,zz,ww,.102,hh,'white',.005)
def shutter(x,y,z,w,h):
    # Author in local front plane, then rotate the entire window for side elevations.
    k.panel('arched recessed window',x,y+.008,z,w+.028,h+.035,'wood')
    k.arch_trim(x,y-.012,z-.003,w+.045,h+.045,'white')
    for j in [-1,1]:
        px=x+j*w/4
        box('green shutter leaf',px,y-.017,z+(h-.06)/2,w/2-.009,.032,h-.06,'teal',.003)
        for xx in [px-w/4+.014,px+w/4-.014]:box('shutter stile',xx,y-.041,z+(h-.06)/2,.017,.012,h-.07,'wood',.002)
        for zz in [z+.025,z+h*.38,z+h-.085]:box('shutter cross rail',px,y-.04,zz,w/2-.023,.015,.02,'wood',.002)
        for i in range(10):
            zz=z+.055+i*(h-.15)/10
            box('shutter louver',px,y-.033,zz,w/2-.045,.009,.008,'teal',.001)
def door(x):
    k.panel('dark arched door recess',x,-.325,.385,.43,.91,'wood')
    for s in[-1,1]:
        px=x+s*.104
        box('green entry leaf',px,-.349,.80,.199,.025,.81,'teal',.004)
        for zz,hh in[(.60,.29),(.99,.32)]:
            box('inset door panel',px,-.367,zz,.148,.014,hh,'wood',.003)
            box('raised door panel',px,-.377,zz,.128,.012,hh-.025,'teal',.003)
        box('door handle',x+s*.032,-.391,.805,.009,.013,.045,'brass',.002)
    for zz in[.40,1.20]:box('entry horizontal rail',x,-.368,zz,.427,.02,.027,'wood',.002)
    box('door center stile',x,-.376,.80,.018,.022,.83,'wood',.002)

# Raised stone platform and warm ochre masonry.
box('display base',0,-.08,.065,2.80,2.20,.13,'ivory',.02)
box('display bevel lip',0,-.08,.137,2.76,2.16,.026,'white',.007)
box('house stone foundation',0,.16,.245,2.32,1.43,.19,'ivory')
box('ochre stone plinth',0,.16,.32,2.30,1.41,.10,'plaster')
box('rear sanctuary wall',0,.34,.91,2.28,1.02,1.10,'plaster')
# Side wings flank a genuinely open, recessed two-bay veranda.
for sign in[-1,1]:
    box('front window wing',sign*.89,-.49,.91,.50,.35,1.10,'plaster')
    pilaster(sign*1.126,-.674,.36,1.10)
    pilaster(sign*.628,-.674,.36,1.10,.055)
    shutter(sign*.88,-.677,.61,.31,.69)
    for yy in[-.32,.40]:
        # side windows built in local front coordinates, then transformed rigidly
        before=len(k.PARTS);shutter(-yy,0,.61,.33,.69)
        for o in k.PARTS[before:]:
            o.location=Vector((sign*1.151,0,0))+Vector((-o.location.y*sign,o.location.x*sign,o.location.z))
            o.rotation_euler.z+=sign*math.pi/2
            if o.type=='CURVE':
                o.location=(sign*1.151,0,0)
    door(sign*.282)
box('veranda red floor',0,-.495,.374,1.27,.385,.048,'brick',.006)
k.arch_wall('two open veranda arches',0,-.65,.378,1.28,1.082,.105,[(-.303,.495,.965,False),(.303,.495,.965,False)],'plaster')
for x in[-.303,.303]:
    # Arch trim has no sill across the open passage.
    pts=k.arch_points(.495,.965)[1:]
    strip('ivory arched archivolt',[(x+a,-.71,.384+b)for a,b in pts]+[(x-.2475,-.71,.384)],'white',.019)
for x in[-.595,0,.595]:pilaster(x,-.716,.378,.715,.071)
for z,h,w,d in[(.37,.04,2.35,1.47),(1.465,.045,2.37,1.48),(1.506,.034,2.43,1.54),(1.54,.03,2.47,1.58)]:
    # Cornices are four perimeter bars to preserve open porch headspace.
    for y in[.16-d/2,.16+d/2]:box('continuous moulded cornice',0,y,z,w,.055,h,'white',.005)
    for x in[-w/2+.027,w/2-.027]:box('side cornice',x,.16,z,.055,d,h,'white',.005)
for sign in[-1,1]:
    for y in[-.50,.84]:
        box('side corner pilaster',sign*1.151,y,.93,.055,.07,1.06,'white')

# Five terracotta steps, each with a rounded nosing.
for i in range(5):
    h=(i+1)*.044;y=-1.045+i*.075
    box('terracotta stair tread',0,y,.15+h/2,1.19,.086,h,'red',.006)
    strip('rounded stair nosing',[(-.588,y-.044,.15+h),(.588,y-.044,.15+h)],'brick',.005)
for sign in[-1,1]:
    x=sign*.68
    # S-curve cheek profile with a thick white cap, matching the concept.
    yz=[(-1.105,.29),(-1.02,.295),(-.94,.32),(-.86,.40),(-.78,.49),(-.70,.525),(-.62,.53)]
    verts=[(x+side*.052,y,z)for side in[-1,1]for y,z in yz]
    n=len(yz);verts.extend([(x-.052,yz[-1][0],.15),(x-.052,yz[0][0],.15),(x+.052,yz[-1][0],.15),(x+.052,yz[0][0],.15)])
    faces=[tuple(list(range(n))+[2*n,2*n+1]),tuple(list(range(n,2*n))+[2*n+2,2*n+3])]
    faces +=[(i,i+1,n+i+1,n+i)for i in range(n-1)]
    faces +=[(0,n,2*n+3,2*n+1),(n-1,2*n-1,2*n+2,2*n),(2*n,2*n+2,2*n+3,2*n+1)]
    k.mesh('sculpted stair cheek',verts,faces,'plaster',.009)
    strip('curving cream stair cap',[(x,y,z+.01)for y,z in yz],'white',.031)
    for z,w,d,h,mat in[(.19,.21,.19,.08,'plaster'),(.245,.17,.15,.035,'white'),(.345,.135,.125,.17,'plaster'),(.445,.19,.17,.04,'white'),(.48,.145,.13,.035,'plaster')]:
        box('stair end post',x,-1.06,z,w,d,h,mat,.008)
    for xx in[x-.058,x+.058]:box('post cream inset edge',xx,-1.13,.345,.015,.016,.145,'white',.002)

def roof(name,w,d,y,z,h,ridge,cols):
    def pt(face,u,t):
        x=u*(w/2*(1-t)+ridge*t);yy=-d/2*(1-t)
        if face=='back':yy=-yy
        elif face in['right','left']:x=(w/2*(1-t)+ridge*t)*(1 if face=='right'else-1);yy=u*d/2*(1-t)
        return(x,y+yy,z+h*t)
    for face in['front','back','left','right']:
        count=cols if face in['front','back']else int(cols*d/w)
        verts=[pt(face,u,t)for t in[0,1]for u in[-1,1]]
        o=k.mesh(name+' terracotta slope '+face,verts,[(0,1,3,2)],'red',0);o.modifiers.new('Roof clay thickness','SOLIDIFY').thickness=.025
        # Fine barrel tiles, clipped to a hipped plane, with staggered course joints.
        for i in range(count+1):
            u=-1+2*i/count
            strip('rounded ceramic tile channel',[tuple(Vector(pt(face,u,j/16))+Vector((0,0,.005)))for j in range(17)],'red',.004)
        for j in range(1,18):
            t=j/18
            strip('overlapping clay tile courses',[tuple(Vector(pt(face,-1+2*i/32,t))+Vector((0,0,.005)))for i in range(33)],'red',.0012)
        strip('rounded roof eave',[pt(face,-1,0),pt(face,1,0)],'brick',.015)
    for face in['front','back']:
        for u in[-1,1]:strip('hip ridge cap',[tuple(Vector(pt(face,u,t))+Vector((0,0,.012)))for t in[0,1]],'brick',.022)
    strip('horizontal ridge cap',[(-ridge,y,z+h+.012),(ridge,y,z+h+.012)],'brick',.026)
roof('main hipped roof',2.58,1.70,.16,1.58,.47,.64,72)
# The reference has a shallow raised red roof section behind the main ridge.
box('raised rear ridge cream fascia',0,.43,1.977,1.10,.43,.045,'white',.006)
roof('raised rear roof',1.30,.60,.43,1.995,.11,.48,38)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"can-tho","Cần Thơ","Nhà cổ Bình Thủy",revision=2,status='visual-direction-accepted')
