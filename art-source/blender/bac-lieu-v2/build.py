"""Cao Van Lau theatre concept study. Three real conical roofs and curved facades."""
import bpy, math, json, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='bac-lieu-v2'
palette=dict(k.PALETTE,plaster='#dfb16e',white='#ffebc5',ivory='#e8d8b6',red='#cb5331',brick='#e57b52',thatch='#edd09b',gold='#cfac75',wood='#44483c',teal='#285f70',water='#326c78')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['teal','water']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=.16;bs.inputs['Roughness'].default_value=.27;bs.inputs['Coat Weight'].default_value=.35
bs=k.M['wood'].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=.1;bs.inputs['Roughness'].default_value=.42
def box(name,x,y,z,w,d,h,mat='plaster',bevel=.007):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat,r=.010,roundness=1):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=roundness;o.data.use_fill_caps=True;return o
def circle(name,x,y,z,radius,mat,thick=.01,count=128):
    return strip(name,[(x+radius*math.cos(i*math.tau/count),y+radius*math.sin(i*math.tau/count),z)for i in range(count+1)],mat,thick,0)
def sector(name,cx,cy,r,z,h,mat,start=-155,end=-25):
    angles=[math.radians(start+(end-start)*i/80)for i in range(81)]
    outline=[(cx,cy)]+[(cx+r*math.cos(a),cy+r*math.sin(a))for a in angles]
    n=len(outline);v=[(x,y,zz)for zz in[z,z+h]for x,y in outline]
    k.mesh(name,v,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],mat,.003)
    strip('curved stair rounded nosing',[(cx+r*math.cos(a),cy+r*math.sin(a),z+h+.002)for a in angles],'brick',.005)
def glazed_drum(name,x,y,r,bottom,h,bays,rows,piers=8):
    # Continuous curved glazing, with individual panels and physical mullion frames.
    for i in range(bays):
        a0=math.tau*i/bays;a1=math.tau*(i+1)/bays
        for j in range(rows):
            lo=bottom+j*h/rows;hi=bottom+(j+1)*h/rows
            verts=[(x+r*math.cos(a),y+r*math.sin(a),z)for z in[lo,hi]for a in[a0,a1]]
            k.mesh(name+' curved blue glass panel',verts,[(0,1,3,2)],'water'if(i+j)%5==0 else'teal',0)
        px=x+(r+.004)*math.cos(a0);py=y+(r+.004)*math.sin(a0)
        box('dark bronze vertical mullion',px,py,bottom+h/2,.012,.012,h,'wood',.001)
    for j in range(rows+1):circle('continuous bronze glazing transom',x,y,bottom+j*h/rows,r+.006,'wood',.007,bays*3)
    # Interior floor/ceiling give depth behind the glazing without a billboard.
    k.cylinder('interior timber floor',(x,y,bottom+.008),r-.014,.016,'wood',64)
    k.cylinder('interior ceiling',(x,y,bottom+h-.015),r-.016,.025,'wood',64)
    k.cylinder('ochre foundation drum',(x,y,bottom-.045),r+.04,.09,'plaster',96)
    circle('rounded stone drum base',x,y,bottom-.078,r+.038,'white',.012)
    circle('drum base moulding',x,y,bottom-.005,r+.035,'white',.012)
    for i in range(piers):
        a=(0 if piers==6 else -math.pi/2)+math.tau*i/piers;rr=r+.052
        px=x+rr*math.cos(a);py=y+rr*math.sin(a)
        box('cream structural pier',px,py,bottom+h/2,.065,.066,h+.045,'plaster',.008)
        box('pier bright face',px,py-.029,bottom+h/2,.032,.012,h+.018,'white',.003)
        for z in[bottom-.012,bottom+h+.006]:box('pier base and capital',px,py,z,.09,.087,.026,'white',.005)
def hat_roof(name,x,y,r,z,h,ribs,courses):
    sides=128;rows=16
    def point(a,t):return(x+r*t*math.cos(a),y+r*t*math.sin(a),z+h*(1-t)+.014*t**8)
    verts=[(x,y,z+h)]
    for j in range(1,rows+1):verts.extend(point(math.tau*i/sides,j/rows)for i in range(sides))
    faces=[(0,1+i,1+(i+1)%sides)for i in range(sides)]
    for j in range(rows-1):
        a=1+j*sides;b=a+sides
        faces.extend((a+i,b+i,b+(i+1)%sides,a+(i+1)%sides)for i in range(sides))
    o=k.mesh(name+' woven conical roof',verts,faces,'thatch',0);o.modifiers.new('Woven roof thickness','SOLIDIFY').thickness=.018
    for p in o.data.polygons:p.use_smooth=True
    for i in range(ribs):
        a=math.tau*i/ribs
        strip('fine radial bamboo rib',[tuple(Vector(point(a,.025+.975*j/18))+Vector((0,0,.003)))for j in range(19)],'white',.0015,0)
    for j in range(1,courses+1):
        t=j/courses
        strip('woven concentric roof course',[tuple(Vector(point(math.tau*i/128,t))+Vector((0,0,.003)))for i in range(129)],'gold',.0010,0)
    circle('rolled cream roof edge',x,y,z+.014,r,'white',.015)
    circle('roof underside warm fascia',x,y,z-.006,r-.004,'plaster',.011)
    k.ball('soft conical roof apex',(x,y,z+h),.012,'thatch',(1,1,.65))

box('display stone base',0,0,.063,2.77,2.25,.126,'ivory',.019)
box('stone base upper bevel',0,0,.137,2.73,2.21,.026,'white')
# Front circular stairs fan out between the two lower halls.
for i in range(4):sector('broad circular forecourt step',0,.16,1.19-i*.065,.15,.0225*(i+1),'red',-139,-41)
for i in range(3):sector('central entrance curved step',0,.31,.69-i*.06,.24,.06*(i+1),'red',-151,-29)
glazed_drum('central tall hall',0,.34,.46,.42,1.06,24,5,6)
for sign in[-1,1]:glazed_drum('side rotunda',sign*.66,-.12,.415,.235,.715,20,4)
# Door hardware identifies the central entrance within the curved curtain wall.
for sign in[-1,1]:
    box('entrance door vertical stile',sign*.105,-.116,.74,.013,.017,.62,'wood',.002)
    box('entrance bronze pull',sign*.028,-.129,.73,.008,.017,.074,'gold',.002)
hat_roof('central large non la',0,.34,.775,1.49,.63,104,34)
for sign in[-1,1]:hat_roof('side non la',sign*.66,-.12,.655,.962,.565,88,29)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"bac-lieu","Bạc Liêu","Nhà hát Cao Văn Lầu",revision=2,status='visual-direction-accepted')
