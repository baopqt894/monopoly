"""Eight remaining Vietnam landmarks, authored against the existing concept sheet.
Blender -b --python remaining.py -- [city ...] [--qa-dir PATH]
No previews are emitted unless --qa-dir is supplied; no runtime/map changes.
"""
import bpy, math, sys, importlib.util
from pathlib import Path
from mathutils import Vector
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import kit as k
from pipeline import finish

def box(name,x,y,z,w,d,h,mat='white',bevel=.008):return k.box(name,(x,y,z),(w,d,h),mat,bevel)
def line(name,pts,mat='white',r=.008):
    o=k.line(name,pts,mat,r);o.data.bevel_resolution=1;o.data.use_fill_caps=True;return o
def base(w=1.75,d=1.18,water=False):
    box('cream plinth',0,0,.045,w,d,.09,'ivory',.012)
    box('plinth upper edge',0,0,.10,w-.035,d-.035,.025,'white',.005)
    if water:box('turquoise water tray',0,0,.12,w-.12,d-.12,.025,'water',.008)
def cornice(x,y,z,w,d):
    for dz,ww,dd,hh in [(0,w,d,.040),(-.029,w-.025,d-.025,.018),(.025,w+.018,d+.018,.016)]:box('stepped stone cornice',x,y,z+dz,ww,dd,hh,'white',.004)
def roof(x,y,z,w,d,h,mat='red',trim='white',ridge=None):
    # Four roof slopes, fine barrel tiles, course joints and raised hip/ridge caps.
    r=w*.27 if ridge is None else ridge
    def pt(face,u,t):
        if face in ['front','rear']:return(x+u*((1-t)*w/2+t*r),y+(-1 if face=='front'else 1)*d/2*(1-t),z+h*t+.024*(1-t)**5)
        return(x+(-1 if face=='left'else 1)*((1-t)*w/2+t*r),y+u*d/2*(1-t),z+h*t+.024*(1-t)**5)
    for face in ['front','rear','left','right']:
        v=[pt(face,u,t)for t in [0,1]for u in [-1,1]]
        obj=k.mesh('tiled roof slope '+face,v,[(0,1,3,2)],mat,0);obj.modifiers.new('clay thickness','SOLIDIFY').thickness=.018
        n=max(8,round((w if face in ['front','rear']else d)/.032))
        for i in range(n+1):line('fine barrel tile rib',[tuple(Vector(pt(face,-1+2*i/n,j/12))+Vector((0,0,.009)))for j in range(13)],mat,.004)
        for j in range(1,14):line('subtle tile course',[tuple(Vector(pt(face,-1+2*i/16,j/14))+Vector((0,0,.009)))for i in range(17)],mat,.0014)
        line('rounded eave cap',[pt(face,-1,0),pt(face,1,0)],trim,.012)
    for face in ['front','rear']:
        for u in [-1,1]:line('hip ridge cap',[pt(face,u,t)for t in [0,.25,.5,.75,1]],trim,.012)
    line('roof ridge',[pt('front',-1,1),pt('front',1,1)],trim,.015)
    for u in [-1,1]:
        a=pt('front',u,1);line('ridge tip curl',[a,(a[0]+u*.018,a[1],a[2]+.025),(a[0]+u*.012,a[1],a[2]+.055)],trim,.010)
def window(x,y,z,w,h,side=False,mat='teal',pointed=False):
    rotation=math.pi/2 if side else 0
    k.panel('inset arch glazing',x,y,z,w,h,mat,pointed,rotation)
    pts=k.arch_points(w,h,pointed)[1:]
    if side:
        line('side window arch moulding',[(x+.012,y+a,z+b)for a,b in pts],'white',.012)
        box('side window sill',x+.013,y,z,.035,w+.04,.028,'white',.003)
        k.beam('side window central muntin',(x+.018,y,z+.015),(x+.018,y,z+h-.025),.012,'wood')
    else:
        line('arched window frame',[(x+a,y-.018,z+b)for a,b in pts],'white',.012)
        box('window sill',x,y-.02,z,w+.04,.046,.026,'white',.004)
        k.beam('window central muntin',(x,y-.025,z+.012),(x,y-.025,z+h-.025),.012,'wood')
def masonry(w,d,z,h,x=0,y=0,mat='stone',pitch=.08):
    for j in range(1,round(h/pitch)):
        zz=z+j*pitch
        for sy in [-1,1]:box('horizontal masonry course',x,y+sy*(d/2+.001),zz,w,.002,.0015,mat,0)
        for sx in [-1,1]:box('side masonry course',x+sx*(w/2+.001),y,zz,.002,d,.0015,mat,0)
def balustrade(x,y,z,w,height=.14,mat='wood'):
    for dz in [0,height]:box('balustrade horizontal rail',x,y,z+dz,w,.026,.024,mat,.003)
    n=max(4,int(w/.075))
    for i in range(n+1):box('balustrade narrow spindle',x-w/2+w*i/n,y,z+height/2,.015,.02,height,mat,.002)

def hoi_an():
    base(2.05,1.18,True)
    # Three genuinely open stone arches carry the stepped bridge.
    k.arch_wall('three river arches',0,0,.14,1.81,.43,.69,[(-.59,.43,.33,False),(0,.45,.38,False),(.59,.43,.33,False)],'stone')
    # Clip masonry joints against the three openings; no lines span the river passages.
    for j in range(1,7):
        zz=j*.063;cuts=[]
        for xx,ww,hh in [(-.59,.43,.33),(0,.45,.38),(.59,.43,.33)]:
            r=ww/2;spring=hh-r
            if zz<hh:half=r if zz<=spring else math.sqrt(max(0,r*r-(zz-spring)**2));cuts.append((xx-half-.015,xx+half+.015))
        cursor=-.905
        for a,b in cuts+[(.905,.905)]:
            if a>cursor:
                for yy in [-.347,.347]:box('clipped stone masonry joint',(cursor+a)/2,yy,.14+zz,a-cursor,.002,.0017,'shadow',0)
            cursor=max(cursor,b)
    for sy in [-1,1]:
        for xx,ww,hh in [(-.59,.43,.33),(0,.45,.38),(.59,.43,.33)]:
            line('stone arch voussoir surround',[(xx+a,sy*.357,.14+b)for a,b in k.arch_points(ww,hh)[1:]],'white',.022)
    box('timber bridge floor',0,0,.585,1.86,.74,.056,'wood',.006)
    for i in range(36):box('deck plank seams',-.89+i*.05,0,.616,.003,.68,.002,'dark',0)
    for x in [-.86,-.57,-.29,0,.29,.57,.86]:
        for y in [-.32,.32]:
            box('square structural timber column',x,y,.86,.047,.047,.50,'wood',.004)
            box('column foot stone',x,y,.635,.075,.075,.042,'white',.004)
    for y in [-.33,.33]:
        for x in [-.6,0,.6]:balustrade(x,y,.65,.53,.15)
        box('long upper wooden lintel',0,y,1.095,1.81,.057,.057,'wood',.005)
    for x,z,w,h in [(-.61,1.105,.68,.21),(0,1.20,.87,.24),(.61,1.105,.68,.21)]:roof(x,0,z,w,.91,h,'red','stone',w*.24)
    # The raised central bay and low wings create the three-step silhouette of the concept.
    for y in [-.315,.315]:box('raised central clerestory',0,y,1.15,.65,.045,.105,'wood',.004)
    box('small yellow shrine at bridge end',.96,.06,.84,.24,.65,.46,'plaster',.008)
    window(1.088,.06,.73,.16,.23,True,mat='wood')
    roof(.96,.06,1.085,.32,.76,.17,'red','gold',.065)

def vinh():
    base(1.80,1.32)
    k.arch_wall('true gate passage',0,0,.12,.70,.85,.82,[(0,.34,.63,False)],'stone')
    for sy in [-1,1]:
        line('gate cut stone arch',[(a,sy*.421,.12+b)for a,b in k.arch_points(.34,.63)[1:]],'white',.019)
    for x in [-.59,.59]:
        v=[(x+sx*.41,sy*.54,.12)for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]]+[(x+sx*.30,sy*.41,.96)for sx,sy in [(-1,-1),(1,-1),(1,1),(-1,1)]]
        k.mesh('battered stone gate bastion',v,[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],'stone',.006)
        for j in range(1,12):
            zz=.12+j*.07;t=(zz-.12)/.84;w=.82-.22*t;d=1.08-.26*t
            for sy in [-1,1]:box('bastion horizontal stone joint',x,sy*(d/2+.001),zz,w,.002,.0015,'shadow',0)
        cornice(x,0,.98,.65,.86)
    cornice(0,0,1.00,1.76,.91)
    for x in [-.80,-.58,-.35,.35,.58,.80]:
        for y in [-.39,.39]:box('parapet square merlon',x,y,1.085,.13,.13,.13,'white',.005)
    box('upper gate pavilion',0,.02,1.23,.80,.57,.38,'plaster',.008)
    for xx in [-.31,0,.31]:
        for yy in [-.28,.32]:box('gate pavilion wooden column',xx,yy,1.25,.037,.037,.39,'wood',.003)
    for xx in [-.22,.22]:window(xx,-.274,1.105,.17,.25,mat='wood')
    roof(0,.02,1.435,1.04,.83,.28,'red','white',.27)

def dong_hoi():
    base(1.30,1.05)
    # Open tower stages: the large upper belfry remains an actual hole from front to rear.
    k.arch_wall('gothic base portal',0,0,.12,.69,.70,.52,[(0,.27,.56,True)],'brick')
    box('lower tower string course',0,0,.83,.82,.64,.08,'brick',.007)
    k.arch_wall('open pointed belfry',0,0,.87,.66,1.06,.49,[(0,.37,.90,True)],'brick')
    for sy in [-1,1]:
        for z,w,h in [(.12,.27,.56),(.87,.37,.90)]:
            for d in [0,.035,.069]:line('layered gothic archivolt',[(a,sy*(.278+d*.1),z+b)for a,b in k.arch_points(w+d,h+d*.8,True)[1:]],'brick',.022)
        for x in [-.38,.38]:
            for z,h,w in [(.48,.72,.14),(1.20,.66,.11),(1.71,.40,.085)]:box('stepped facade buttress',x,sy*.27,z,w,.14,h,'brick',.006)
    for x in [-.45,.45]:
        for y in [-.29,.29]:
            box('buttress broad foot',x,y,.20,.25,.27,.17,'brick',.006)
            box('free corner pier',x,y,.46,.16,.18,.55,'brick',.006)
            box('pier cap',x,y,.75,.21,.23,.06,'brick',.005)
    for i in range(7):
        z=1.91+i*.065;w=.75-i*.092
        box('stepped gothic crown',0,0,z,w,.55-i*.045,.075,'brick',.005)
    for x in [-.34,.34]:box('tall upper corner pinnacle',x,0,1.94,.10,.57,.22,'brick',.005)
    for j in range(24):
        z=.16+j*.076
        # The brickwork lives on the structural jambs, never across the open arches.
        for x in [-.29,.29]:box('jamb brick mortar bed',x,-.275,z,.085,.002,.0018,'red',0)
    for y in [-.18,0,.18]:box('side stonework joint',.392,y,1.27,.002,.002,.90,'red',0)

def ninh_binh():
    base(1.35,1.11)
    for i in range(4):box('pagoda broad entrance steps',0,-.48-i*.055,.13+(3-i)*.024,.53,.08,.04,'white',.004)
    for j in range(8):
        w=.70-j*.052;d=.62-j*.045;z=.18+j*.245;h=.185
        box('pagoda red tier walls',0,0,z+h/2,w,d,h,'red',.006)
        for y in [-d/2-.005,d/2+.005]:
            for x in [-w*.40,0,w*.40]:box('tier golden square pillar',x,y,z+h/2,.022,.025,h,'gold',.003)
            box('tier golden lintel',0,y,z+h-.015,w+.035,.025,.026,'gold',.003)
            if j<6:balustrade(0,y,z+.018,w-.03,.046,'gold')
        box('tier inset dark rectangular door',0,-d/2-.006,z+h*.43,w*.20,.010,h*.72,'dark',.002)
        for xx in [-w*.12,w*.12]:box('door gold jamb',xx,-d/2-.014,z+h*.43,.012,.015,h*.75,'gold',.001)
        box('door gold lintel',0,-d/2-.014,z+h*.82,w*.26,.015,.015,'gold',.002)
        roof(0,0,z+h+.025,w+.19,d+.18,.105 if j<6 else .085,'red','gold',(w+.19)*.25)
    k.finial(0,0,2.14,'gold')
    for side in [-1,1]:box('stair cream balustrade cheek',side*.32,-.56,.20,.10,.31,.13,'white',.006)

def ha_long():
    base(1.90,1.26)
    for x,y,w,d,h in [(-.53,.10,.62,.83,.92),(0,.20,.67,.91,1.17),(.59,.08,.64,.89,.69)]:
        box('dark museum volume',x,y,.14+h/2,w,d,h,'glass',.004)
        # Large flush glass panes with fine dark metal grid and low-contrast blue/gold reflections.
        for yy in [y-d/2-.003,y+d/2+.003]:
            n=3
            for i in range(n+1):box('vertical curtain wall mullion',x-w/2+i*w/n,yy,.14+h/2,.008,.011,h,'frame',.001)
            for j in range(1,4):box('horizontal curtain wall transom',x,yy,.14+h*j/4,w,.008,.006,'frame',.001)
            for i in range(3):
                for j in range(3):
                    if (i+j)%3==0:box('muted warm glass reflection',x-w/2+(i+.5)*w/3,yy+.001,.14+(j+.5)*h/4,w/3-.025,.003,h/4-.02,'glasswarm',.001)
        for xx in [x-w/2-.003,x+w/2+.003]:
            for i in range(4):box('side glass vertical mullion',xx,y-d/2+i*d/3,.14+h/2,.010,.008,h,'frame',.001)
            for j in range(1,4):box('side glass horizontal transom',xx,y,.14+h*j/4,.009,d,.006,'frame',.001)
        box('flat roof metal capping',x,y,.15+h,w+.02,d+.02,.021,'frame',.003)
    for j in range(5):box('broad pale museum stair',0,-.72+j*.047,.115+j*.021,.51,.26-j*.039,.031,'white',.004)
    box('recessed entrance dark portal',0,-.265,.33,.26,.017,.37,'dark',.001)
    for x in [-.13,0,.13]:box('entrance bronze glazing mullion',x,-.28,.33,.009,.01,.36,'brass',.001)

def hai_phong():
    base(2.00,1.39)
    box('grand theatre main hall',0,.07,.72,1.62,.94,1.14,'plaster',.009)
    for z,w,d in [(.18,1.74,1.04),(.70,1.73,1.02),(1.28,1.79,1.08)]:cornice(0,.07,z,w,d)
    for x in [-.68,-.34,0,.34,.68]:
        window(x,-.412,.25,.20,.36,mat='teal')
        window(x,-.412,.84,.20,.34,mat='teal')
    for y in [-.21,.10,.39]:
        for z in [.25,.84]:window(.819,y,z,.18,.34,True,mat='teal')
    for x in [-.81,-.51,-.17,.17,.51,.81]:
        for z,h in [(.43,.46),(.995,.43)]:
            k.cylinder('classical round facade column',(x,-.47,z),.028,h,'white',20)
            for dz in [-h/2,h/2]:box('column moulded capital',x,-.47,z+dz,.087,.10,.037,'white',.004)
    box('central projecting balcony slab',0,-.52,.761,1.16,.27,.06,'white',.006)
    balustrade(0,-.66,.80,1.16,.13,'white')
    for x in [-.56,.56]:balustrade(x,-.55,.80,.22,.13,'white')
    for i in range(6):box('theatre broad front stairs',0,-.86+i*.05,.12+(i+.5)*.017,1.28,.065,.017,'white',.004)
    roof(0,.07,1.36,1.85,1.18,.39,'slate','white',.48)
    # Triangular front pediment with recessed gold tympanum and cream perimeter.
    pts=[(-.49,-.518,1.28),(.49,-.518,1.28),(0,-.518,1.63)]
    k.mesh('classical central pediment',pts,[(0,1,2)],'plaster',0)
    line('pediment moulded triangular frame',[pts[0],pts[2],pts[1]],'white',.025)
    line('pediment lower frame',[pts[0],pts[1]],'white',.023)
    k.ball('pediment oval medallion',(0,-.539,1.41),.068,'gold',(1,.24,.85))
    for x in [-.85,-.48,0,.48,.85]:
        k.cylinder('parapet decorative urn stem',(x,-.48,1.39),.021,.09,'white',16)
        k.ball('parapet urn finial',(x,-.48,1.455),.032,'white',(1,1,1.25))
    for x in [-.40,.40]:
        for y in [-.14,.28]:
            box('roof small dormer',x,y,1.59,.14,.12,.14,'white',.004)
            roof(x,y,1.66,.18,.16,.07,'slate','white',.02)

def arc_level(name,w,d,z,h,cols):
    holes=[(x,.19,h*.78,False)for x in cols]
    for sy in [-1,1]:
        k.arch_wall(name+' front rear wall',0,sy*(d/2-.035),z,w-.06,h,.07,holes,'stone')
        for x,ww,hh,_ in holes:line('tower arch surround',[(x+a,sy*(d/2+.006),z+b)for a,b in k.arch_points(ww,hh)[1:]],'white',.011)
    for sx in [-1,1]:
        side=k.arch_wall(name+' transverse side wall',0,0,z,d-.06,h,.07,[(0,.20,h*.78,False)],'stone');side.rotation_euler.z=math.pi/2;side.location.x=sx*(w/2-.035)
    for x in [-w/2,w/2]:
        for y in [-d/2,d/2]:box('tower corner pilaster',x,y,z+h/2,.11,.11,h,'white',.003)
    cornice(0,0,z+h+.015,w+.10,d+.10)

def ha_noi():
    base(1.63,1.36,True)
    box('island stone foundation',0,0,.185,.98,.85,.11,'stone',.006)
    arc_level('lower triple arcade',.85,.68,.24,.46,[-.27,0,.27])
    arc_level('middle double arcade',.69,.55,.76,.40,[-.16,.16])
    for x in [-.35,.35]:
        for y in [-.27,.27]:box('upper terrace stone merlon',x,y,1.23,.10,.10,.14,'white',.005)
    arc_level('top pavilion',.40,.37,1.22,.31,[0])
    roof(0,0,1.56,.57,.54,.19,'red','white',.075)
    k.finial(0,0,1.765,'white')
    for i in range(3):box('island small stair',0,-.43-i*.05,.145+(3-i)*.025,.40,.07,.04,'white',.003)

def clock_face(x,y,z,side=False):
    o=k.cylinder('porcelain clock dial',(x,y,z),.139,.015,'white',48)
    o.rotation_euler=(0,math.pi/2,0)if side else(math.pi/2,0,0)
    def p(u,v):return(x+.012,y+u,z+v)if side else(x+u,y-.012,z+v)
    for i in range(12):
        a=math.tau*i/12;k.beam('clock hour marker',p(.108*math.sin(a),.108*math.cos(a)),p(.123*math.sin(a),.123*math.cos(a)),.008,'teal')
    k.beam('clock minute hand',p(0,0),p(-.065,.075),.009,'teal');k.beam('clock hour hand',p(0,0),p(.054,.025),.012,'teal')
    k.ball('clock central pin',p(0,0),.012,'teal')

def ho_chi_minh():
    base(1.95,1.36)
    for x in [-.58,.58]:
        box('market ochre wing',x,.04,.44,.64,1.01,.61,'plaster',.007)
        for dx in [-.20,0,.20]:window(x+dx,-.471,.19,.14,.36,mat='teal')
        for yy in [-.26,.06,.37]:window(x+(.326 if x>0 else-.326),yy,.19,.15,.36,True,mat='teal')
        cornice(x,.04,.76,.68,1.05);roof(x,.04,.81,.76,1.14,.24,'red','white',.20)
    # Structural front and back walls form the true entrance passage under the clock.
    k.arch_wall('clock tower entrance',0,-.25,.12,.53,1.38,.53,[(0,.29,.49,False)],'plaster')
    line('market central portal surround',[(a,-.529,.12+b)for a,b in k.arch_points(.29,.49)[1:]],'white',.021)
    k.panel('recessed green market entrance door',0,-.46,.13,.275,.47,'teal')
    for x in [-.065,0,.065]:box('entrance door narrow muntin',x,-.479,.34,.009,.01,.40,'wood',.001)
    for x in [-.255,.255]:box('clock tower tall cream pilaster',x,-.533,.81,.035,.04,1.36,'white',.004)
    for z in [.81,1.49]:cornice(0,-.25,z,.59,.61)
    clock_face(0,-.528,1.208);clock_face(.277,-.25,1.208,True)
    window(.275,-.25,.66,.15,.24,True,mat='teal')
    roof(0,-.25,1.55,.73,.72,.22,'red','white',.10)
    k.cylinder('market roof ridge finial',(0,-.25,1.80),.015,.11,'white',16,r2=.004)

MODELS=[('hoi-an','Hội An','Chùa Cầu',hoi_an),('vinh','Vinh','Cổng thành cổ Vinh',vinh),('dong-hoi','Đồng Hới','Tháp chuông Tam Tòa',dong_hoi),('ninh-binh','Ninh Bình','Bảo tháp Bái Đính',ninh_binh),('ha-long','Hạ Long','Bảo tàng Quảng Ninh',ha_long),('hai-phong','Hải Phòng','Nhà hát lớn Hải Phòng',hai_phong),('ha-noi','Hà Nội','Tháp Rùa',ha_noi),('ho-chi-minh','TP. Hồ Chí Minh','Chợ Bến Thành',ho_chi_minh)]
if __name__=='__main__':
    args=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[];qa=None
    if '--qa-dir'in args:i=args.index('--qa-dir');qa=args[i+1];args=args[:i]+args[i+2:]
    for slug,city,landmark,fn in MODELS:
        if args and slug not in args:continue
        bpy.ops.wm.read_factory_settings(use_empty=True);k.PARTS=[];k.CURRENT=slug
        palette=dict(k.PALETTE,white='#f7e8ca',ivory='#ecdec0',plaster='#e5b354',stone='#aaa18d',shadow='#8f8573',red='#af381a',brick='#ac4c2d',wood='#643b24',teal='#175651',slate='#394656',glass='#182633',frame='#445260',glasswarm='#2f3028',gold='#d58b05')
        k.M={n:k.material(n,v)for n,v in palette.items()}
        for n,m in k.M.items():
            p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=.08 if n in ['gold','brass']else .22 if n in ['glass','glasswarm','frame']else 0;p.inputs['Roughness'].default_value=.23 if n in ['glass','glasswarm','water']else .62
        fn();finish(k,slug,city,landmark,qa_dir=qa)
