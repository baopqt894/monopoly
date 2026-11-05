"""Validate all 20 delivered GLBs and editable Blender scenes; emits no preview files."""
import bpy,json,math,ast,hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
ASSETS=ROOT/'assets/models/vietnam';SOURCE=ROOT/'art-source/models/vietnam'
ORDER=['chau-doc','can-tho','soc-trang','bac-lieu','ca-mau','buon-ma-thuot','kon-tum','quy-nhon','nha-trang','phan-thiet','hue','da-nang','hoi-an','vinh','dong-hoi','ninh-binh','ha-long','hai-phong','ha-noi','ho-chi-minh']
assert sorted(p.stem for p in ASSETS.glob('*.glb'))==sorted(ORDER)
assert sorted(p.stem for p in SOURCE.glob('*.blend'))==sorted(ORDER)
for path in (ROOT/'art-source/blender').rglob('*.py'):ast.parse(path.read_text(encoding='utf-8-sig'),filename=str(path))
reports=[];models=[]
for slug in ORDER:
    metadata=json.loads((SOURCE/f'{slug}.json').read_text(encoding='utf-8-sig'))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS/f'{slug}.glb'))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert meshes,slug
    points=[];triangles=0
    for obj in meshes:
        mesh=obj.data;mesh.calc_loop_triangles();triangles+=len(mesh.loop_triangles)
        assert len(mesh.uv_layers)>0,(slug,'missing UV')
        for v in mesh.vertices:assert all(math.isfinite(x)for x in (*v.co,*v.normal)),(slug,'nonfinite vertex/normal')
        for item in mesh.uv_layers.active.data:assert all(math.isfinite(x)for x in item.uv),(slug,'nonfinite UV')
        points.extend(obj.matrix_world@Vector(v)for v in obj.bound_box)
    low=[min(p[i]for p in points)for i in range(3)];high=[max(p[i]for p in points)for i in range(3)]
    dims=[high[i]-low[i]for i in range(3)]
    assert 0<dims[0]<1.43 and 0<dims[1]<1.13 and 0<dims[2]<4,(slug,dims)
    assert abs(low[2])<.001,(slug,'ground',low[2])
    assert triangles==metadata['triangles'],(slug,'triangle metadata mismatch')
    sha=hashlib.sha256((ASSETS/f'{slug}.glb').read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{slug}.blend'))
    assert not any(o.type in ['CAMERA','LIGHT']for o in bpy.context.scene.objects),(slug,'preview camera/light left in source')
    assert not any(o.name.startswith('REVIEW_')for o in bpy.context.scene.objects),(slug,'preview objects left in source')
    assert any(o.type in ['MESH','CURVE']for o in bpy.context.scene.objects),(slug,'empty source')
    reports.append(dict(id=slug,passed=True,triangles=triangles,importedMeshes=len(meshes),dimensions=dims,ground=low[2],editableSource=True,sourceHasPreviewObjects=False))
    metadata.update(sha256=sha,bytes=(ASSETS/f'{slug}.glb').stat().st_size,verified=True)
    models.append(metadata)
    print('VERIFIED',slug,triangles,flush=True)
manifest=dict(version=2,date='2026-10-28',modelCount=20,integratedIntoMap=False,reference='docs/art/concepts/vietnam/v2/landmarks-simple-revised.png',models=models)
(ASSETS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ASSETS/'validation.json').write_text(json.dumps(dict(passed=True,modelCount=len(reports),checks=['Blender GLB import','finite vertex/normal/UV','footprint','ground','triangle counts','editable Blender sources without preview cameras/lights','Python syntax'],limitations='No LOD/collision or map performance certification. Eight batch-completed models have not been individually approved.',models=reports),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PACK_VERIFIED',len(reports),flush=True)
