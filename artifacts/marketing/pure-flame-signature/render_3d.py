import bpy, math, os
from mathutils import Vector
ROOT=r'F:\Projects\Pureflame\Website\PF Copy - Git - Editorial Integration'
OUT=os.path.join(ROOT,'artifacts','marketing','pure-flame-signature')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT,'assets/products/aether/3d/aether-v2.glb'))
bpy.data.objects['Aether_cover'].hide_render=True
# Preserve all original product geometry and its material colours.
glass=bpy.data.materials.get('6 mm clear glass | IOR 1.45')
p=next(n for n in glass.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Alpha'].default_value=1
p.inputs['Transmission Weight'].default_value=1
p.inputs['IOR'].default_value=1.45
def material(name,color,rough=0.7):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 n=m.node_tree.nodes.new('ShaderNodeTexNoise');n.inputs['Scale'].default_value=160
 b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.18;b.inputs['Distance'].default_value=.002
 m.node_tree.links.new(n.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],p.inputs['Normal'])
 return m
stone=material('Warm ivory limestone',(.66,.61,.51))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.002));bpy.context.object.data.materials.append(stone)
wall=material('Fine ivory limewash',(.78,.73,.64))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,-1.5,0),rotation=(math.pi/2,0,0));bpy.context.object.data.materials.append(wall)
def point_at(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def light(name,loc,power,color,size,target=(0,0,.2)):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;point_at(o,target)
light('Large warm window',(-2,-3,4),220,(1,.86,.67),2.4)
light('Soft cool fill',(2,-1,2),65,(.82,.9,1),2)
light('Glass edge reflection',(1,1,2.3),100,(1,.93,.83),1.5)
# The model contains no flame mesh. Render a physically shaded volumetric flame,
# separate from the untouched product geometry.
for j in range(0):
 angle=j*2.39996; rad=.035 if j else 0; height=.17+.065*math.sin(j*1.8)**2
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,location=(rad*math.cos(angle),rad*math.sin(angle),.35+height*.5))
 o=bpy.context.object;o.name='Atmosphere_flame_'+str(j)
 for v in o.data.vertices:
  z=(v.co.z+1)/2
  v.co.x*=.023*(1-.55*z);v.co.y*=.023*(1-.55*z);v.co.z*=height*.5
  v.co.x+=.017*math.sin(z*6+j)*z
 m=bpy.data.materials.new(o.name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links
 out=n.new('ShaderNodeOutputMaterial');vol=n.new('ShaderNodeVolumePrincipled');vol.inputs['Color'].default_value=(1,.35,.04,1);vol.inputs['Density'].default_value=.5
 vol.inputs['Emission Color'].default_value=(1,.24,.012,1)
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=8;tex.inputs['Detail'].default_value=3
 mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=24
 l.new(tex.outputs['Fac'],mul.inputs[0]);l.new(mul.outputs[0],vol.inputs['Emission Strength']);l.new(vol.outputs['Volume'],out.inputs['Volume']);o.data.materials.append(m)
d=bpy.data.lights.new('Fire glow','POINT');d.energy=0;d.color=(1,.24,.045);d.shadow_soft_size=.13
o=bpy.data.objects.new('Fire glow',d);bpy.context.collection.objects.link(o);o.location=(0,0,.48)
bpy.ops.object.camera_add(location=(1.2,1.8,1.08));cam=bpy.context.object;point_at(cam,(0,0,.49));cam.data.type='ORTHO';cam.data.ortho_scale=1.43;cam.data.shift_y=-.07;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1080;scene.render.resolution_y=1350;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Soft ambient');scene.world.color=(.12,.12,.12);scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'photography-3d.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'aether-editorial.blend'))
bpy.ops.render.render(write_still=True)
