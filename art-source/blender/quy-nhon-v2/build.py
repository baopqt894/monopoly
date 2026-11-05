"""Twin brick towers concept study, authored masonry, stepped crowns and recessed portals."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='quy-nhon-v2'
palette=dict(k.PALETTE,ivory='#eeddbb',white='#ffedcc',brick='#a93213',red='#b43a17',gold='#c64b22',wood='#8a2d11',dark='#292522',shadow='#642714',stone='#943317')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['brick','red','gold','wood','dark','shadow','stone']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.72
def box(name,x,y,z,w,d,h,mat='brick',bevel=.006):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def frustum(name,z,w,d,h,inset=.035,mat='red'):
    v=[(x*w/2,y*d/2,z)for x,y in[(-1,-1),(1,-1),(1,1),(-1,1)]]
    v.extend((x*(w/2-inset),y*(d/2-inset),z+h)for x,y in[(-1,-1),(1,-1),(1,1),(-1,1)])
    return k.mesh(name,v,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],mat,.006)
def front_open_wall():
    # A genuinely open portal, with masonry thickness and a dark chamber behind it.
    c=bpy.data.curves.new('Masonry front with pointed opening','CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=.055;c.resolution_u=1
    outer=[(-.43,0),(.43,0),(.43,1.20),(-.43,1.20)]
    hole=[(-.124,.004),(.124,.004),(.124,.65),(0,.79),(-.124,.65)]
    for pts in[outer,list(reversed(hole))]:
        s=c.splines.new('POLY');s.points.add(len(pts)-1)
        for p,(x,z)in zip(s.points,pts):p.co=(x,z,0,1)
        s.use_cyclic_u=True
    o=bpy.data.objects.new('open front masonry',c);scene.collection.objects.link(o);o.location=(0,-.40,.38);o.rotation_euler.x=math.pi/2
    k.register(o,'open pointed portal masonry','brick')
def tower(cx,cy,scale):
    start=len(k.PARTS)
    # Three broad foot courses and two projecting entrance steps.
    for z,w,d,h,mat in[(.19,1.12,1.03,.10,'red'),(.28,1.03,.94,.08,'brick'),(.35,.94,.85,.06,'red')]:box('tiered brick plinth',0,0,z,w,d,h,mat,.010)
    box('lower entry step',0,-.54,.205,.43,.24,.11,'red',.008)
    box('upper entry step',0,-.49,.295,.37,.18,.08,'brick',.007)
    front_open_wall()
    box('back sanctuary masonry',0,.355,.98,.86,.13,1.20,'brick')
    box('deep doorway chamber',0,-.08,.78,.27,.035,.80,'dark',.002)
    box('chamber floor',0,-.22,.385,.27,.37,.02,'shadow',.002)
    # Side elevation has a real shallow blind recess between masonry strips.
    for sign in[-1,1]:
        for y,d in[(-.245,.37),(.255,.33)]:box('side masonry around blind niche',sign*.38,y,.98,.10,d,1.20,'brick')
        box('blind niche recessed backing',sign*.355,.035,1.00,.055,.15,1.04,'wood',.002)
        for z in[.435,1.535]:box('blind niche closing course',sign*.38,.035,z,.10,.16,.11,'brick')
        # Broad corner pilasters have separate feet and shafts.
        x=sign*.355
        box('front corner brick pilaster',x,-.463,.995,.105,.092,1.12,'red',.005)
        box('pilaster square foot',x,-.466,.432,.145,.12,.09,'red')
        for y in[-.345,.345]:
            box('side corner brick pilaster',sign*.447,y,.995,.060,.108,1.12,'red',.005)
            box('side pilaster foot',sign*.454,y,.432,.085,.15,.09,'red')
    # Delicate mortar courses rather than a noisy full texture.
    for row in range(13):
        z=.45+row*.083
        for sign in[-1,1]:
            box('front fine masonry course',sign*.329,-.456,z,.187,.002,.0024,'stone',0)
            for yy,dd in[(-.23,.30),(.255,.29)]:box('side fine masonry course',sign*.432,yy,z,.002,dd,.0024,'stone',0)
        for x in[-.39,-.27,.27,.39]:
            if(row+int(abs(x)*100))%2==0:box('front staggered brick head joint',x,-.457,z+.041,.0023,.002,.074,'stone',0)
    # Pointed portal: thick jambs, a triangular relief and double raking surround.
    for sign in[-1,1]:
        box('portal square upright',sign*.169,-.498,.719,.067,.105,.674,'red',.005)
        box('portal springing collar',sign*.170,-.509,1.047,.100,.13,.070,'gold',.005)
    tri=[(-.231,-.481,1.035),(.231,-.481,1.035),(0,-.481,1.430)]
    panel=k.mesh('portal triangular pediment',tri,[(0,1,2)],'brick',0);panel.modifiers.new('Pediment relief thickness','SOLIDIFY').thickness=.055
    for sign in[-1,1]:
        k.beam('portal outer pointed rake',(sign*.244,-.528,1.026),(0,-.528,1.444),.066,'red')
        k.beam('portal inset pointed rake',(sign*.116,-.553,1.060),(0,-.553,1.266),.018,'wood')
    apex=k.mesh('solid brick portal miter',[(-.036,-.567,1.414),(.036,-.567,1.414),(0,-.567,1.476)],[(0,1,2)],'red',.002)
    apex.modifiers.new('Miter cap thickness','SOLIDIFY').thickness=.044
    box('portal stone threshold',0,-.506,.387,.35,.13,.026,'red',.004)
    # The large three-part shoulder cornice anchors the five stepped crown courses.
    for z,w,d,h,mat in[(1.589,1.00,.93,.073,'brick'),(1.663,1.09,1.01,.105,'red'),(1.732,1.12,1.04,.041,'gold')]:box('massive shoulder cornice',0,0,z,w,d,h,mat,.009)
    for i in range(5):
        z=1.755+i*.16;w=1.00-i*.148;d=.94-i*.139
        box('stepped crown lower vertical course',0,0,z+.046,w,d,.092,'brick',.007)
        frustum('sloping crown shoulder',z+.092,w+.012,d+.012,.066,.040,'red')
        # Fine divisions on the larger crown blocks remain visible in the close render.
        if i<4:
            box('crown horizontal brick course',0,-d/2-.001,z+.047,w-.025,.002,.0025,'stone',0)
            for x in[-w*.23,w*.23]:box('crown brick head joint',x,-d/2-.002,z+.044,.0025,.002,.077,'stone',0)
        if i in[0,2]:
            box('small crown side inset',w/2+.001,d*.18,z+.056,.003,.032,.065,'shadow',0)
    box('square crown cap',0,0,2.596,.285,.268,.083,'brick',.006)
    k.mesh('final pyramidal crown tip',[(-.143,-.1345,2.638),(.143,-.1345,2.638),(.143,.1345,2.638),(-.143,.1345,2.638),(0,0,2.785)],[(3,2,1,0),(0,1,4),(1,2,4),(2,3,4),(3,0,4)],'red',.002)
    # Uniformly scale the complete smaller tower, keeping the authored parts editable.
    for o in k.PARTS[start:]:o.location=o.location*scale+Vector((cx,cy,.14*(1-scale)));o.scale*=scale

box('cream display slab',0,0,.065,2.45,1.72,.13,'ivory',.017)
box('slab upper bevel',0,0,.139,2.41,1.68,.025,'white',.004)
tower(-.60,.13,1.00)
tower(.70,-.13,.80)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"quy-nhon","Quy Nhơn","Tháp Đôi",revision=2,status='visual-direction-accepted')
