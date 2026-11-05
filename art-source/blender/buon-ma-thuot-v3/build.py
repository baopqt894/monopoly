"""Reference correction: two continuous saddle roofs, four peaks, three visible gables."""
import bpy, math, json, sys, importlib.util
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('kit',ROOT/'art-source/blender/kit.py')
k=importlib.util.module_from_spec(spec);spec.loader.exec_module(k)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
k.PARTS=[];k.CURRENT='buon-ma-thuot-v3'
palette=dict(k.PALETTE,ivory='#eddfbd',white='#fff0ce',wood='#68321b',plaster='#b96a11',gold='#c17b16',brass='#b97527',dark='#352c27',stone='#4b3b31',red='#713b23')
k.M={name:k.material(name,value)for name,value in palette.items()}
for name in['dark','stone']:
    bs=k.M[name].node_tree.nodes.get('Principled BSDF');bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.78
def box(name,x,y,z,w,d,h,mat='wood',bevel=.006):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def strip(name,pts,mat='wood',r=.005):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=0;o.data.use_fill_caps=True;return o
def ribbon(name,points,depth_vectors,width=.042,depth=.028,mat='red'):
    # Rectangular timber fascia, not the round pipe edges used in the rejected model.
    points=[Vector(p)for p in points];v=[]
    for i,p in enumerate(points):
        tangent=(points[min(i+1,len(points)-1)]-points[max(i-1,0)]).normalized()
        normal=Vector(depth_vectors[i]).normalized();across=normal.cross(tangent).normalized()
        v.extend(tuple(p+a*across*width/2+b*normal*depth/2)for a,b in[(-1,-1),(1,-1),(1,1),(-1,1)])
    f=[(3,2,1,0)]
    for i in range(len(points)-1):
        a=4*i;b=a+4;f.extend((a+j,a+(j+1)%4,b+(j+1)%4,b+j)for j in range(4))
    a=4*(len(points)-1);f.append((a,a+1,a+2,a+3))
    return k.mesh(name,v,f,mat,.003)
box('thin cream display base',0,.10,.045,2.60,2.35,.090,'ivory',.014)
box('display top edge',0,.10,.096,2.57,2.32,.016,'white',.004)

def hall(name,p0,p1,p2,width,heights,sag,eave=.66,floor=.45,waist=0):
    p0,p1,p2=Vector((*p0,0)),Vector((*p1,0)),Vector((*p2,0))
    def frame(t):
        center=(1-t)**2*p0+2*t*(1-t)*p1+t*t*p2
        tangent=(2*(1-t)*(p1-p0)+2*t*(p2-p1)).normalized()
        normal=Vector((-tangent.y,tangent.x,0))
        return center,tangent,normal
    def ridge(t):return heights[0]*(1-t)+heights[1]*t-sag*4*t*(1-t)
    def span(t):return width*(1-waist*math.sin(math.pi*t)**2)
    def point(t,u):
        c,tangent,n=frame(t);p=c+n*u*span(t)/2
        p.z=eave+(ridge(t)-eave)*(1-abs(u))**1.40+.010*abs(u)**8
        return p
    def wood_wall(t,face):
        c,d,n=frame(t);count=17;half=.43*width
        for i in range(count):
            x0=-half+2*half*i/count+.001;x1=-half+2*half*(i+1)/count-.001
            top0=point(t,x0/(width/2)).z-.034;top1=point(t,x1/(width/2)).z-.034
            v=[]
            for offset in[-.010,.010]:
                v.extend(tuple(c+n*x+d*offset+Vector((0,0,z)))for x,z in[(x0,floor),(x1,floor),(x1,top1),(x0,top0)])
            k.mesh('ochre vertical gable board',v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'gold'if i%5==0 else'plaster',.0015)
        # End frames stay behind the fascia and follow the same gable silhouette.
        front=c+d*face*.024
        for h in[floor+.02,.76,1.08,1.39]:
            if h>=ridge(t)-.13:continue
            halfspan=min(half,width/2*(1-max(0,(h-eave)/(ridge(t)-eave))**(1/1.40)))
            a=front-n*halfspan+Vector((0,0,h));b=front+n*halfspan+Vector((0,0,h))
            ribbon('gable horizontal dark timber',[a,b],[d,d],.030,.028,'wood')
        for x in[-width*.24,0,width*.24]:
            top=point(t,x/(width/2)).z-.055
            a=front+n*x+Vector((0,0,floor));b=front+n*x+Vector((0,0,top))
            ribbon('gable vertical timber',[a,b],[d,d],.030,.028,'wood')
    wood_wall(0,-1);wood_wall(1,1)
    deck=[]
    for i in range(65):
        c,d,n=frame(i/64)
        deck.extend(tuple(c+n*sign*span(i/64)*.40+Vector((0,0,floor-.015)))for sign in[-1,1])
    o=k.mesh('continuous raised timber floor',deck,[(2*i,2*i+1,2*i+3,2*i+2)for i in range(64)],'wood',0)
    o.modifiers.new('Floor board thickness','SOLIDIFY').thickness=.035
    length=96;across=40
    for sign in[-1,1]:
        v=[tuple(point(i/length,sign*j/across))for i in range(length+1)for j in range(across+1)]
        f=[]
        for i in range(length):
            for j in range(across):
                a=i*(across+1)+j;face=(a,a+1,a+across+2,a+across+1)
                q0,q1,q2=[Vector(v[b])for b in face[:3]]
                if(q1-q0).cross(q2-q0).z<0:face=tuple(reversed(face))
                f.append(face)
        o=k.mesh(name+' continuous swept roof',v,f,'dark',0);o.modifiers.new('Roof thickness','SOLIDIFY').thickness=.017
        for poly in o.data.polygons:poly.use_smooth=True
        for i in range(111):
            t=i/110
            strip('fine wood roof rib',[tuple(point(t,sign*j/32)+Vector((0,0,.003)))for j in range(33)],'stone',.0014)
        for j in range(1,12):strip('subtle roofing course',[tuple(point(i/96,sign*j/12)+Vector((0,0,.002)))for i in range(97)],'dark',.0008)
        # Low continuous wall and floor rail close the black veranda gap in the old model.
        v=[]
        for i in range(65):
            c,d,n=frame(i/64);p=c+n*sign*span(i/64)*.40
            v.extend([(p.x,p.y,floor),(p.x,p.y,eave-.035)])
        f=[(2*i,2*i+2,2*i+3,2*i+1)for i in range(64)]
        wall=k.mesh('continuous ochre low side wall',v,f,'plaster',0);wall.modifiers.new('Wall thickness','SOLIDIFY').thickness=.018
        rail=[tuple(frame(i/64)[0]+frame(i/64)[2]*sign*span(i/64)*.42+Vector((0,0,floor)))for i in range(65)]
        ribbon('continuous curved floor beam',rail,[(0,0,1)]*65,.055,.045,'wood')
        eave_pts=[point(i/96,sign)for i in range(97)]
        ribbon('thin timber eave edge',eave_pts,[(0,0,1)]*97,.028,.024,'red')
        # Rounded columns are thinner and more numerous, as in the concept.
        for i in range(5):
            c,d,n=frame(i/4);p=c+n*sign*span(i/4)*.37
            k.cylinder('slender round timber stilt',(p.x,p.y,(floor+.104)/2),.032,floor-.104,'wood',20)
    for t in[0,1]:
        c,d,n=frame(t);pts=[point(t,-1+2*i/80)+Vector((0,0,.004))for i in range(81)]
        ribbon('flat wood gable fascia',pts,[d]*81,.048,.032,'red')
        strip('rake amber inner edge',[tuple(p+Vector((0,0,.012))-d*.018)for p in pts],'brass',.004)
    pts=[point(i/128,0)+Vector((0,0,.010))for i in range(129)]
    ribbon('single continuous bowed ridge',pts,[(0,0,1)]*129,.026,.027,'red')
    strip('ridge amber edge',[tuple(p+Vector((0,0,.015)))for p in pts],'brass',.004)

# One continuous bent front roof joins the left and right gables. No hidden cut-off ridges.
hall('joined front hall',(-.54,-.72),(-.34,.10),(.80,-.35),1.30,(2.18,1.90),.50,.66,.45,.20)
# Taller rear saddle, moved back/right to match the high rear peak and third gable.
hall('rear hall',(-.42,.70),(.365,.70),(1.15,.70),1.04,(2.08,1.82),.43,.72,.47)


# Export the authored geometry only. No preview pages or renders are produced.
sys.path.insert(0,str(ROOT/'art-source/blender'))
from pipeline import finish
finish(k,"buon-ma-thuot","Buôn Ma Thuột","Bảo tàng Thế giới Cà phê",revision=3,status='visual-direction-accepted')
