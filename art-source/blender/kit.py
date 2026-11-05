"""Shared authored geometry helpers for the Vietnam landmark sources. No filesystem side effects."""
import bpy, math
from mathutils import Vector
PALETTE = dict(ivory='#fff0d1', plaster='#e7ba68', white='#ffeaca', red='#bd4827', jade='#08705a',
    gold='#e8a42e', wood='#713c24', teal='#125669', stone='#a8987d', brick='#b95833',
    dark='#25303c', water='#299caa', brass='#a67842', thatch='#d69736', shadow='#303436')
PARTS=[]; M={}; CURRENT=''

def color(h):
    vals=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v<.04045 else ((v+.055)/1.055)**2.4 for v in vals)

def material(key,h):
    mat=bpy.data.materials.new(key);mat.use_nodes=True
    p=mat.node_tree.nodes.get('Principled BSDF');c=color(h)
    p.inputs['Base Color'].default_value=(*c,1)
    p.inputs['Roughness'].default_value=.26 if key in ('teal','dark','water') else .63
    p.inputs['Metallic'].default_value=.45 if key in ('gold','brass') else .18 if key in ('teal','dark') else 0
    mat.diffuse_color=(*c,1)
    return mat

def register(o,name,mat,bevel=0):
    o.name=f'{CURRENT}_{name}';o.data.materials.append(M[mat]);PARTS.append(o)
    if bevel:
        mod=o.modifiers.new('Crafted bevel','BEVEL');mod.width=bevel;mod.segments=2
        mod.affect='EDGES'
        mod.harden_normals=True
    return o

def box(name,loc,size,mat='plaster',bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return register(o,name,mat,min(bevel,min(size)*.18))

def cylinder(name,loc,radius,depth,mat='gold',vertices=24,r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=radius if r2 is None else r2,depth=depth,location=loc)
    o=register(bpy.context.object,name,mat,.006)
    for p in o.data.polygons:p.use_smooth=vertices>12
    return o

def mesh(name,verts,faces,mat='red',bevel=.006):
    data=bpy.data.meshes.new(name);data.from_pydata(verts,[],faces);data.update()
    o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o)
    return register(o,name,mat,bevel)

def line(name,pts,mat='gold',thickness=.012):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=8;c.bevel_depth=thickness;c.bevel_resolution=1
    s=c.splines.new('POLY');s.points.add(len(pts)-1)
    for p,co in zip(s.points,pts):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);return register(o,name,mat)

def beam(name,a,b,width=.035,mat='wood'):
    a,b=Vector(a),Vector(b);o=box(name,(a+b)*.5,(width,width,(b-a).length),mat,.004)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def ball(name,loc,r,mat='gold',scale=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=r,location=loc)
    o=register(bpy.context.object,name,mat)
    if scale:o.scale=scale
    for p in o.data.polygons:p.use_smooth=True
    return o

def steps(x,y,z,w=.5,count=4,depth=.34,height=.18,mat='stone'):
    for i in range(count):
        box('stair',(x,y+depth*i/(2*count),z+height*(i+.5)/count),(w,depth*(1-i/count),height/count),mat,.007)

def arch_points(w,h,pointed=False):
    if pointed:
        return [(-w/2,0),(w/2,0),(w/2,h*.55)]+[(w/2*(1-t),h*.55+h*.45*(1-(1-t)**1.5)) for t in [i/8 for i in range(1,9)]]+[( -w/2*t,h*.55+h*.45*(1-t**1.5)) for t in [i/8 for i in range(1,9)]]
    spring=h-w*.5
    return [(-w/2,0),(w/2,0),(w/2,spring)]+[(math.cos(a)*w/2,spring+math.sin(a)*w/2) for a in [math.pi*i/18 for i in range(1,19)]]

def panel(name,x,y,z,w,h,mat='teal',pointed=False,rotation=0):
    pts=arch_points(w,h,pointed);n=len(pts);verts=[(a,-.012,b) for a,b in pts]+[(a,.012,b) for a,b in pts]
    o=mesh(name,verts,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],mat)
    o.location=(x,y,z);o.rotation_euler.z=rotation
    return o

def arch_wall(name,x,y,z,w,h,d,holes,mat='stone',taper=1):
    # Two-dimensional filled curves use opposite winding for genuine through-openings.
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=d/2;c.resolution_u=1
    outlines=[[(-w/2,0),(w/2,0),(w*taper/2,h),(-w*taper/2,h)]]
    for hx,hw,hh,pointed in holes:
        # A tiny threshold keeps a closed 2D contour while reading as an open doorway.
        outlines.append(list(reversed([(a+hx,b+.006)for a,b in arch_points(hw,hh,pointed)])))
    for pts in outlines:
        s=c.splines.new('POLY');s.points.add(len(pts)-1)
        for p,(a,b)in zip(s.points,pts):p.co=(a,b,0,1)
        s.use_cyclic_u=True
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=(x,y,z);o.rotation_euler.x=math.pi/2
    return register(o,name,mat)

def arch_trim(x,y,z,w,h,mat='white',pointed=False):
    pts=arch_points(w,h,pointed)[1:]
    line('arch frame',[(x+a,y,z+b) for a,b in pts]+[(x-w/2,y,z)],mat,.018)
    box('window sill',(x,y,z),(w+.08,.06,.035),mat,.006)

def window(x,y,z,w=.16,h=.3,rotation=0):
    o=panel('recessed arch',x,y,z,w,h);o.rotation_euler.z=rotation
    if rotation==0:
        arch_trim(x,y-.014,z,w,h)
        beam('mullion',(x,y-.018,z+.015),(x,y-.018,z+h-.025),.013,'gold')
    else:
        # Trim strips on side windows retain an actual side elevation.
        for dy in [-w/2,w/2]:box('side jamb',(x,y+dy,z+h*.45),(.035,.025,h*.9),'white',.004)

def roof(x,y,z,w,d,h,mat='red',hip=True,ridge_mat='white',tile=True):
    ridge=w*.28 if hip else w*.5
    verts=[(-w/2,-d/2,0),(w/2,-d/2,0),(w/2,d/2,0),(-w/2,d/2,0),(-ridge,0,h),(ridge,0,h)]
    faces=[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4),(3,2,1,0)]
    o=mesh('hip roof',[(a+x,b+y,c+z)for a,b,c in verts],faces,mat,.008)
    for i,j in [(0,1),(1,2),(2,3),(3,0),(0,4),(1,5),(2,5),(3,4),(4,5)]:
        a,b=Vector(verts[i]),Vector(verts[j]);line('roof edge',[(x+a.x,y+a.y,z+a.z+.01),(x+b.x,y+b.y,z+b.z+.01)],ridge_mat,.014)
    if tile:
        # Continuous tile ribs on the broad roof slopes, plus horizontal tile courses.
        count=max(8,int(w/.065))
        for side in [-1,1]:
            for i in range(count+1):
                ex=-w/2+w*i/count;tx=max(-ridge,min(ridge,ex*.55))
                pts=[]
                for k in range(6):
                    t=k/5;pts.append((x+ex*(1-t)+tx*t,y+side*d/2*(1-t),z+h*t+.009+math.sin(t*math.pi)*.009))
                line('roof tile rib',pts,mat,.004)
            for k in range(1,6):
                t=k/6;half=w/2*(1-t)+ridge*t
                line('roof tile course',[(x-half,y+side*d/2*(1-t),z+h*t+.01),(x+half,y+side*d/2*(1-t),z+h*t+.01)],mat,.0025)
        if hip:
            for side in [-1,1]:
                for i in range(1,10):
                    yy=-d/2+d*i/10
                    line('hip tile rib',[(x+side*w/2,y+yy,z+.012),(x+side*ridge,y,z+h+.012)],mat,.004)
                for k in range(1,6):
                    t=k/6;xx=side*(w/2*(1-t)+ridge*t)
                    line('hip tile course',[(x+xx,y-d/2*(1-t),z+h*t+.012),(x+xx,y+d/2*(1-t),z+h*t+.012)],mat,.0025)
    return o

def finial(x,y,z,mat='gold'):
    cylinder('finial collar',(x,y,z+.025),.045,.05,mat)
    ball('finial bead',(x,y,z+.075),.04,mat)
    cylinder('finial point',(x,y,z+.145),.035,.12,mat,r2=0)

def cornice(x,y,z,w,d,mat='white'):
    box('moulded cornice',(x,y,z),(w,d,.045),mat,.008)
    box('moulded shadow line',(x,y,z-.032),(w-.035,d-.035,.018),'gold',.003)

def plinth(w=1.45,d=1.0):
    box('foundation',(0,0,.04),(w,d,.08),'ivory',.02)
    box('foundation upper',(0,0,.095),(w-.075,d-.075,.035),'white',.008)

def pavilion(x,y,z,w,d,h,roof_mat='jade',walls='plaster',roof_h=.27):
    box('pavilion hall',(x,y,z+h/2),(w*.88,d*.83,h),walls)
    for px in [-w*.37,w*.37]:cylinder('pavilion column',(x+px,y-d*.4,z+h*.5),.032,h,'red',16)
    for px in [-w*.2,0,w*.2]:panel('door',x+px,y-d*.425,z+.025,w*.16,h*.8,'wood')
    cornice(x,y,z+h,w,d)
    roof(x,y,z+h+.035,w*1.13,d*1.2,roof_h,roof_mat,ridge_mat='gold')
    for side in [-1,1]:
        line('swept eave',[(x+side*w*.45,y-d*.6,z+h+.035),(x+side*w*.58,y-d*.6,z+h+.06),(x+side*w*.63,y-d*.57,z+h+.12)],'gold',.016)
