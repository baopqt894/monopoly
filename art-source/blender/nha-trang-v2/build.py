"""Tram Huong concept study: layered curved petal walls, true apertures, blue glazing."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='nha-trang-v2'
palette=dict(k.PALETTE,ivory='#eeddb9',white='#ffe8bc',plaster='#d75739',red='#e98551',wood='#a6452c',teal='#24606a',water='#2b727b',dark='#3d4d46',gold='#efbe7b')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['plaster','red','wood','gold']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.56
for name in['teal','water']:
    p=k.M[name].node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.12;p.inputs['Roughness'].default_value=.28;p.inputs['Coat Weight'].default_value=.25
def box(name,x,y,z,w,d,h,mat='white',bevel=.005):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,points,mat='white',r=.009,res=2):
    o=k.line(name,points,mat,r);o.data.bevel_resolution=res;o.data.use_fill_caps=True;return o
def bezier(a,b,c,d,steps=24):
    return[tuple((1-t)**3*Vector(a)+3*(1-t)**2*t*Vector(b)+3*(1-t)*t*t*Vector(c)+t**3*Vector(d))for t in[i/steps for i in range(steps+1)]]
def hole_outline(w,h,cx=0):
    spring=h*.58
    pts=[(cx-w/2,.005),(cx+w/2,.005),(cx+w/2,spring)]
    pts +=[(cx+w/2*(1-t)**.66,spring+(h-spring)*t)for t in[i/24 for i in range(1,25)]]
    pts +=[(cx-w/2*t**.66,h-(h-spring)*t)for t in[i/24 for i in range(1,25)]]
    return pts
def curved_petal(theta,radius,zbase,w,h,opening_w,opening_h,mat='plaster',blue=True,window_offset=None):
    first=len(k.PARTS);cx=w*.06 if window_offset is None else window_offset
    right=bezier((w/2,0),(w*.55,h*.44),(w*.43,h*.75),(w*.10,h))
    left=bezier((w*.10,h),(-w*.38,h*.80),(-w*.64,h*.43),(-w/2,0))
    outline=right+left[1:]
    opening=hole_outline(opening_w,opening_h,cx)
    c=bpy.data.curves.new('Petal with true pointed aperture','CURVE');c.dimensions='2D';c.fill_mode='BOTH';c.extrude=.038;c.resolution_u=1
    for contour in[outline,list(reversed(opening))]:
        sp=c.splines.new('POLY');sp.points.add(len(contour)-1)
        for p,(x,z)in zip(sp.points,contour):p.co=(x,z,0,1)
        sp.use_cyclic_u=True
    o=bpy.data.objects.new('sculpted petal wall',c);scene.collection.objects.link(o);o.rotation_euler.x=math.pi/2
    k.register(o,'petal wall with opening',mat)
    # Fine cream outlines reveal the thickness, with glazing set behind the opening.
    strip('cream petal outer edge',[(x,-.041,z)for x,z in outline],'white',.008)
    strip('cream pointed window reveal',[(x,-.043,z)for x,z in opening]+[(opening[0][0],-.043,opening[0][1])],'white',.0075)
    rows=32;columns=8;v=[]
    for j in range(rows+1):
        z=.006+(opening_h-.006)*j/rows
        t=max(0,(z-opening_h*.58)/(opening_h*.42));half=opening_w/2*(1-min(1,t))**.66
        v.extend((cx-half+2*half*i/columns,-.022,z)for i in range(columns+1))
    f=[]
    for j in range(rows):
        for i in range(columns):
            a=j*(columns+1)+i;f.append((a,a+1,a+columns+2,a+columns+1))
    glass=k.mesh('recessed curved blue glazing'if blue else'recessed terracotta slit',v,f,'teal'if blue else'wood',0)
    for p in glass.data.polygons:p.use_smooth=True
    if blue:
        strip('glazing center mullion',[(cx,-.030,opening_h*j/32)for j in range(33)],'dark',.006,0)
        for fraction in[.24,.48,.70]:
            z=opening_h*fraction;t=max(0,(z-opening_h*.58)/(opening_h*.42));half=opening_w/2*(1-min(1,t))**.66
            box('glazing horizontal transom',cx,-.030,z,2*half,.012,.013,'dark',.001)
    # Bake the gentle curvature into actual geometry, including all outlines and glazing.
    for idx in range(first,len(k.PARTS)):
        o=k.PARTS[idx]
        if o.type=='CURVE':
            bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
            bpy.ops.object.convert(target='MESH');o=bpy.context.object;k.PARTS[idx]=o
        o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
        if 'petal wall' in o.name:
            o.data.materials.append(k.M['wood'])
            o.data.update()
            for p in o.data.polygons:
                if p.normal.y>.5:p.material_index=1
        for vertex in o.data.vertices:
            t=min(1,max(0,vertex.co.z/h))
            vertex.co.y*=1-.82*t**4
            vertex.co.y+=-.045*t*t+.025*math.sin(math.pi*t)
        o.data.update()
        o.location=(radius*math.cos(theta),radius*math.sin(theta),zbase);o.rotation_euler.z=theta+math.pi/2

box('cream display parcel',0,0,.055,2.30,2.05,.11,'ivory',.016)
box('display upper bevel',0,0,.116,2.26,2.01,.018,'white',.004)
for z,r,h,mat in[(.167,.90,.078,'ivory'),(.226,.85,.040,'white'),(.265,.80,.040,'ivory'),(.302,.76,.032,'white')]:
    k.cylinder('circular stepped monument base',(0,0,z),r,h,mat,128)
    strip('rounded cream step nosing',[(r*math.cos(i*math.tau/128),r*math.sin(i*math.tau/128),z+h/2)for i in range(129)],'white',.010)
sculpture_start=len(k.PARTS)
# The broad outer tier and alternating inner flames remain separate editable petals.
for i in range(6):
    theta=-math.pi/2+i*math.tau/6
    curved_petal(theta,.52,.318,1.00,2.03 if i==0 else 1.86,.36,1.27,'red'if math.cos(theta)>.3 else'plaster',True,-.15 if i==5 else None)
for i in range(4):
    theta=-math.pi*.75+i*math.pi/2
    curved_petal(theta,.24,.66,.47,2.16,.135,1.84,'red'if math.cos(theta)>0 else'plaster',i%2==1)

# Rounded faceted bud at the crown, with restrained cream seams and a short tip.
profile=[(2.43,.175),(2.60,.195),(2.76,.190),(2.93,.150),(3.10,.080),(3.25,.015)]
segments=32;v=[(r*math.cos(i*math.tau/segments),r*math.sin(i*math.tau/segments),z)for z,r in profile for i in range(segments)]
f=[]
for j in range(len(profile)-1):
    for i in range(segments):
        a=j*segments+i;b=j*segments+(i+1)%segments;f.append((a,b,b+segments,a+segments))
bud=k.mesh('central tapered lotus bud',v,f,'red',0)
bud.data.materials.append(k.M['plaster'])
for p in bud.data.polygons:p.use_smooth=True;p.material_index=(p.index%segments//8)%2
for angle in[-math.pi/2,0,math.pi/2,math.pi]:strip('cream bud seam',[(r*math.cos(angle),r*math.sin(angle),z)for z,r in profile],'white',.007)
def bud_radius(z):
    for i in range(len(profile)-1):
        z0,r0=profile[i];z1,r1=profile[i+1]
        if z<=z1:return r0+(r1-r0)*(z-z0)/(z1-z0)
    return profile[-1][1]
for theta in[-math.pi*.75,-math.pi*.25]:
    rows=24;cols=6;v=[]
    for j in range(rows+1):
        t=j/rows;z=2.47+.48*t;half=.22*(1-max(0,(t-.55)/.45))**.66;r=bud_radius(z)+.003
        v.extend((r*math.cos(theta-half+2*half*i/cols),r*math.sin(theta-half+2*half*i/cols),z)for i in range(cols+1))
    f=[]
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;f.append((a,a+1,a+cols+2,a+cols+1))
    window=k.mesh('small blue crown lancet glazing',v,f,'teal',0)
    for p in window.data.polygons:p.use_smooth=True
k.cylinder('finial cream collar',(0,0,3.255),.034,.027,'white',32)
k.cylinder('coral tapered finial',(0,0,3.350),.027,.180,'plaster',24,r2=.004)

def fan(theta):
    first=len(k.PARTS);segments=64
    for outer,inner in[(.235,.190),(.173,.137),(.119,.082)]:
        v=[]
        for y in[-.048,.048]:
            for radius in[outer,inner]:
                v.extend((radius*math.cos(math.pi*i/segments),y,radius*1.05*math.sin(math.pi*i/segments))for i in range(segments+1))
        n=segments+1;f=[]
        for i in range(segments):f.extend([(i,i+1,n+i+1,n+i),(2*n+i,3*n+i,3*n+i+1,2*n+i+1),(i,2*n+i,2*n+i+1,i+1),(n+i+1,3*n+i+1,3*n+i,n+i)])
        f.extend([(0,n,3*n,2*n),(n-1,2*n-1,4*n-1,3*n-1)])
        k.mesh('nested cream fan arch buttress',v,f,'ivory',.005)
        strip('fan arch bright rounded lip',[(outer*math.cos(math.pi*i/64),-.052,outer*1.05*math.sin(math.pi*i/64))for i in range(65)],'white',.010)
    for o in k.PARTS[first:]:o.location=(.79*math.cos(theta),.79*math.sin(theta),.319);o.rotation_euler.z=theta+math.pi/2
for angle in[-math.pi*.75,-math.pi*.25,math.pi*.25,math.pi*.75]:fan(angle)
# Preserve the reference's broad sculptural proportions without stretching rendered images.
turn=Matrix.Rotation(math.pi/6,4,'Z')
for o in k.PARTS[sculpture_start:]:
    o.location=turn@o.location;o.rotation_euler.z+=math.pi/6
    o.location.z=.318+(o.location.z-.318)*.94;o.scale.z*=.94


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"nha-trang","Nha Trang","Tháp Trầm Hương",revision=2,status='visual-direction-accepted')
