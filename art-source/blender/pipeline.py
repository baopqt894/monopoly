"""Model-only Blender export. Optional QA renders go outside the deliverable asset folders."""
import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
GLB=ROOT/'assets/models/vietnam'
SOURCE=ROOT/'art-source/models/vietnam'

def finish(k,slug,city,landmark,revision=2,status='completed-batch',qa_dir=None):
    GLB.mkdir(parents=True,exist_ok=True);SOURCE.mkdir(parents=True,exist_ok=True)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';bpy.context.preferences.filepaths.save_version=0
    bpy.context.view_layer.update()
    pts=[o.matrix_world@Vector(v)for o in k.PARTS for v in o.bound_box]
    lo=Vector(tuple(min(p[i]for p in pts)for i in range(3)));hi=Vector(tuple(max(p[i]for p in pts)for i in range(3)))
    scale=min(1.42/(hi.x-lo.x),1.12/(hi.y-lo.y));center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
    for o in k.PARTS:o.location=(o.location-center)*scale;o.scale*=scale
    root=bpy.data.objects.new('LANDMARK_'+slug,None);scene.collection.objects.link(root)
    for o in k.PARTS:o.parent=root
    root['city']=city;root['landmark']=landmark;root['integrated']=False;root['status']=status
    root['reference']='docs/art/concepts/vietnam/v2/landmarks-simple-revised.png'
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{slug}.blend'))
    bpy.ops.object.select_all(action='DESELECT')
    for o in k.PARTS:o.select_set(True)
    bpy.context.view_layer.objects.active=k.PARTS[0];bpy.ops.object.convert(target='MESH')
    for o in list(bpy.context.selected_objects):
        bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.join();obj=bpy.context.object;obj.name='LANDMARK_'+slug
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=.000001);bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.01);bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.export_scene.gltf(filepath=str(GLB/f'{slug}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
    obj.data.calc_loop_triangles()
    audit=dict(id=slug,city=city,landmark=landmark,revision=revision,status=status,integrated=False,blender=bpy.app.version_string,vertices=len(obj.data.vertices),triangles=len(obj.data.loop_triangles),materials=len(obj.data.materials),dimensions=list(obj.dimensions),reference=root['reference'],glb=f'{slug}.glb',blend=f'art-source/models/vietnam/{slug}.blend')
    (SOURCE/f'{slug}.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf8')
    if qa_dir:render_qa(k,obj,Path(qa_dir),slug)
    print('MODEL_COMPLETE',json.dumps(audit,ensure_ascii=False),flush=True)

def render_qa(k,obj,folder,slug):
    folder=folder.resolve()
    if str(folder).startswith(str(GLB)) or str(folder).startswith(str(SOURCE)):raise ValueError('QA renders must be outside source/model deliverables')
    folder.mkdir(parents=True,exist_ok=True);scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=20;scene.cycles.use_denoising=True;scene.cycles.adaptive_threshold=.05
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.world=bpy.data.worlds.new('Temporary QA studio');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(1,.94,.82,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
    scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
    for loc,power,size in [((-3,-4,6),450,4),((4,-1,4),140,4),((0,4,5),240,3)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));bpy.context.object.data.materials.append(k.material('temporary ivory floor','#fffdf5'))
    z=obj.dimensions.z/2;target=Vector((0,0,z));bpy.ops.object.camera_add(location=target+Vector((3,-5,3.2)))
    cam=bpy.context.object;cam.data.type='ORTHO';cam.data.ortho_scale=max(1.90,obj.dimensions.z*1.35+.42);cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();scene.camera=cam
    scene.render.filepath=str(folder/f'{slug}.png');bpy.ops.render.render(write_still=True)
