"""Khmer temple concept study, authored in Blender. Separate review asset."""
import bpy, math, json, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='soc-trang-v2'
palette=dict(k.PALETTE,plaster='#edaa31',white='#ffe9b9',ivory='#ecdbb6',red='#ad2c16',gold='#df8c09',wood='#64301b',dark='#3a2113',brick='#bd3b20',brass='#c8871a')
k.M={name:k.material(name,value)for name,value in palette.items()}
bs=k.M['gold'].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=.32;bs.inputs['Roughness'].default_value=.42
bs=k.M['dark'].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.65
def box(name,x,y,z,w,d,h,mat='plaster',bevel=.007):
    return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='gold',r=.012):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=2;o.data.use_fill_caps=True;return o
def flame(name,x,y,z,scale=1,direction=1):
    # Tapered curved Khmer chofa leaf, not a cone or a sphere finial.
    outline=[(-.026,0),(.025,0),(.068,.047),(.080,.092),(.058,.148),(.031,.205),(.031,.276),(.008,.224),(-.006,.170),(-.040,.123),(-.042,.073)]
    n=len(outline);v=[(x+direction*a*scale,y+side*.015*scale,z+b*scale)for side in[-1,1]for a,b in outline]
    o=k.mesh(name,v,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],'gold',.004)
    strip('chofa raised central vein',[(x+direction*a*scale,y-.018*scale,z+b*scale)for a,b in[(0,.025),(.025,.08),(.027,.13),(.017,.19),(.025,.242)]],'brass',.003*scale)
    return o
def columns(x,y,bottom,h):
    k.cylinder('ochre porch column',(x,y,bottom+h/2),.040,h,'plaster',24)
    for z,r,d,mat in[(bottom+.025,.070,.05,'gold'),(bottom+.067,.054,.035,'white'),(bottom+h-.065,.054,.07,'gold'),(bottom+h-.015,.072,.035,'white')]:k.cylinder('column moulding',(x,y,z),r,d,mat,24)
    box('column square foot',x,y,bottom+.015,.15,.15,.03,'white')
def side_window(sign,y):
    before=len(k.PARTS)
    cx=sign*y
    outline=[(-.124,0),(.124,0),(.124,.605),(.065,.625),(0,.66),(-.065,.625),(-.124,.605)]
    n=len(outline);verts=[(cx+a,depth,.55+b)for depth in[-.01,.01]for a,b in outline]
    k.mesh('Khmer shouldered window reveal',verts,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],'wood',.003)
    strip('small pointed window surround',[(cx+a,-.026,.55+b)for a,b in outline]+[(cx+outline[0][0],-.026,.55)],'gold',.014)
    box('window stone sill',cx,-.028,.549,.32,.055,.035,'gold',.003)
    for off in[-.061,.061]:
        box('timber window leaf',cx+off,-.027,.84,.108,.020,.55,'wood',.002)
        box('window inset panel',cx+off,-.040,.84,.075,.010,.48,'dark',.002)
    box('window central mullion',cx,-.053,.84,.018,.014,.56,'wood',.002)
    for o in k.PARTS[before:]:
        o.location=Vector((sign*.659,0,0))+Vector((-o.location.y*sign,o.location.x*sign,o.location.z));o.rotation_euler.z+=sign*math.pi/2
        if o.type=='CURVE':o.location=(sign*.659,0,0)
def pilaster(sign,y):
    box('side square pilaster',sign*.668,y,.91,.077,.082,1.10,'plaster')
    for z,h,w in[(.395,.055,.13),(.445,.025,.10),(1.425,.035,.135),(1.38,.05,.108)]:box('side pilaster cap and base',sign*.677,y,z,w,.13,h,'gold')

box('display stone base',0,0,.065,2.02,2.61,.13,'ivory',.018)
box('base upper bevel',0,0,.139,1.98,2.57,.025,'white')
box('temple raised foundation',0,.18,.245,1.47,2.05,.18,'ivory')
box('foundation ochre string course',0,.18,.337,1.50,2.08,.038,'plaster')
box('foundation cream lip',0,.18,.366,1.55,2.13,.035,'white')
box('sanctuary walls',0,.28,.917,1.29,1.65,1.065,'plaster')
for sign in[-1,1]:
    for y in[-.28,.27,.82]:side_window(sign,y)
    for y in[-.53,-.005,.545,1.08]:pilaster(sign,y)
    for y in[-.88,-.55]:columns(sign*.567,y,.39,1.035)
    # Carved brackets under the porch beam.
    for y in[-.884,-.55]:
        x=sign*.56
        pts=[(x-sign*.105,y,1.408),(x,y,1.408),(x,y,1.26),(x-sign*.026,y,1.30),(x-sign*.045,y,1.36)]
        strip('porch carved corbel',pts,'gold',.019)
box('recessed timber entry frame',0,-.560,.84,.57,.045,.92,'gold')
box('entry shadow',0,-.588,.82,.48,.025,.85,'wood')
for side in[-1,1]:
    x=side*.116
    box('double timber door',x,-.607,.82,.224,.025,.83,'wood',.004)
    box('recessed door panel',x,-.622,.83,.160,.012,.69,'dark',.003)
    box('warm door panel face',x,-.631,.83,.139,.009,.665,'wood',.003)
    box('bronze handle',side*.026,-.645,.81,.010,.013,.043,'brass',.002)
box('porch red floor',0,-.731,.389,1.18,.38,.037,'brick')
box('front ornamental lintel',0,-.889,1.405,1.22,.11,.13,'plaster')
for x in[-.44,-.22,0,.22,.44]:
    box('lintel recessed gold panel',x,-.949,1.41,.16,.008,.086,'gold',.002)
for side in[-1,1]:
    box('side roof support beam',side*.665,.18,1.46,.085,2.08,.07,'gold')
for i in range(5):
    h=.043*(i+1);y=-1.185+i*.064
    box('red entrance stair',0,y,.155+h/2,.59,.075,h,'red',.004)
    strip('stair rounded nosing',[(-.295,y-.037,.155+h),(.295,y-.037,.155+h)],'brick',.004)
for s in[-1,1]:
    x=s*.36;yf=-1.235;yb=-.90
    v=[(x-.045,yf,.155),(x+.045,yf,.155),(x+.045,yb,.155),(x-.045,yb,.155),(x-.045,yf,.22),(x+.045,yf,.22),(x+.045,yb,.48),(x-.045,yb,.48)]
    k.mesh('sloping stair cheek',v,[(0,3,2,1),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7),(4,5,6,7)],'white',.012)
    strip('stair cheek cream cap',[(x,yf,.225),(x,yb,.485)],'white',.018)

def roof(name,w,front,back,z,h,cols,gable=False):
    def pt(sign,t,y):return(sign*w/2*t,y,z+h*(1-t)**1.42+.035*t**9)
    for sign in[-1,1]:
        rows=28
        verts=[pt(sign,i/rows,y)for y in[front,back]for i in range(rows+1)]
        faces=[(i,i+1,i+rows+2,i+rows+1)for i in range(rows)]
        o=k.mesh(name+' curved red roof',verts,faces,'red',0);o.modifiers.new('Solid clay roof','SOLIDIFY').thickness=.022
        for p in o.data.polygons:p.use_smooth=True
        for i in range(cols+1):
            y=front+(back-front)*i/cols
            strip('fine terracotta tile barrel',[tuple(Vector(pt(sign,j/28,y))+Vector((0,0,.006)))for j in range(29)],'red',.0028)
        for j in range(1,19):
            t=j/19
            strip('terracotta overlapping tile course',[tuple(Vector(pt(sign,t,y))+Vector((0,0,.006)))for y in[front,back]],'red',.0012)
        for y in[front-.005,back+.005]:
            edge=[tuple(Vector(pt(sign,i/28,y))+Vector((0,0,.009)))for i in range(29)]
            strip('thick gilded Khmer bargeboard',edge,'gold',.024)
            strip('bargeboard highlight fillet',[(x,y-.012,zz+.014)for x,y,zz in edge],'white',.005)
            ex,ey,ez=pt(sign,1,y)
            flame('upturned eave flame',ex,ey,ez,1.0,sign)
        strip('ochre timber soffit',[(sign*w/2,front,z-.005),(sign*w/2,back,z-.005)],'wood',.017)
        strip('gold eave fascia',[(sign*w/2,front,z+.027),(sign*w/2,back,z+.027)],'gold',.014)
    strip('golden roof ridge',[(0,front,z+h+.014),(0,back,z+h+.014)],'gold',.024)
    for y in[front,back]:flame('ridge chofa finial',0,y,z+h+.015,1.05)
    # Close the raised roof heads and rear with timber infill: no floating roof gaps.
    for y in ([back-.025] if gable else [front+.025,back-.025]):
        outline=[pt(-1,i/28,y)for i in range(28,-1,-1)]+[pt(1,i/28,y)for i in range(1,29)]
        k.mesh('timber infill beneath roof head',outline,[tuple(range(len(outline)))],'wood',0)
    if gable:
        # Filled pediment follows the same curved rake as the roof surfaces.
        outline=[pt(-1,i/28,front+.023)for i in range(28,-1,-1)]+[pt(1,i/28,front+.023)for i in range(1,29)]
        k.mesh('front golden tympanum',outline,[tuple(range(len(outline)))],'plaster',0)
        for side in[-1,1]:
            strip('recessed triangular gable moulding',[(side*.56,front-.006,z+.08),(0,front-.006,z+h-.095)],'brass',.012)
        strip('gable lower horizontal moulding',[(-.61,front-.01,z+.06),(.61,front-.01,z+.06)],'gold',.025)
        # Diamond relief and flanking triangular fields visible in the concept.
        centerz=z+h*.43
        diamond=[(0,front-.024,centerz-.19),(.17,front-.024,centerz),(0,front-.024,centerz+.22),(-.17,front-.024,centerz)]
        k.mesh('pediment raised diamond',diamond,[(0,1,2,3)],'gold',0)
        strip('diamond relief outline',diamond+[diamond[0]],'brass',.009)
        for side in[-1,1]:strip('gable diagonal relief',[(side*.44,front-.026,z+.12),(side*.18,front-.026,centerz+.02)],'gold',.011)

# Three longitudinal gabled roof tiers, stepping back as they rise.
roof('lower temple roof',1.72,-.955,1.20,1.47,.66,55,True)
roof('middle temple roof',1.45,-.57,1.18,1.72,.72,47)
roof('upper temple roof',1.18,-.17,1.16,2.04,.75,37)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"soc-trang","Sóc Trăng","Chùa Khleang",revision=2,status='visual-direction-accepted')
