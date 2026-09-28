import bpy, json
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=r'F:\Projects\Pureflame\Website\PF Copy - Git - Editorial Integration\assets\products\aether\3d\aether-v2.glb')
for o in bpy.context.scene.objects:
 if o.type=='MESH': print('MESH',o.name, list(o.dimensions),list(o.location),[m.name for m in o.data.materials])
for m in bpy.data.materials:
 print('MAT',m.name,[(n.name,[(i.name, str(i.default_value)) for i in n.inputs if i.name in ['Base Color','Roughness','Metallic','Transmission Weight','Alpha']]) for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'])
