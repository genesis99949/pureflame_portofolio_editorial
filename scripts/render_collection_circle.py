import bpy, math, os, random
from mathutils import Vector, Matrix
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'design-review','collection-circle')
os.makedirs(OUT,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
random.seed(41)
models=[('Embera','embera-3d/Embera.blend'),('Aether','aether-3d/Aether-v2.blend'),('Ignite','ignite-3d/Ignite.blend'),('Fera','fera-3d/Fera.blend'),('Flavo','flavo-3d/Flavo.blend')]
for i,(name,path) in enumerate(models):
    with bpy.data.libraries.load(os.path.join(ROOT,'design-review',path),link=False) as (src,dst):
        dst.collections=[n for n in src.collections if n[:2] in ['01','02','03','05']]
    objects=[]
    for coll in dst.collections:
        scene.collection.children.link(coll)
        objects.extend(list(coll.all_objects))
    bpy.context.view_layer.update()
    objects=list(set(objects))
    meshes=[o for o in objects if o.type=='MESH']
    corners=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    lo=Vector(tuple(min(c[j] for c in corners) for j in range(3)))
    hi=Vector(tuple(max(c[j] for c in corners) for j in range(3)))
    center=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
    angle=math.pi/2-i*2*math.pi/5
    # The long dimension follows the tangent of the imaginary circle.
    rotation=angle-math.pi/2
    transform=Matrix.Translation(Vector((2.0*math.cos(angle),2.0*math.sin(angle),.015))) @ Matrix.Rotation(rotation,4,'Z') @ Matrix.Translation(-center)
    originals={o:o.matrix_world.copy() for o in objects}
    for o in objects:
        o.matrix_world=transform@originals[o]
    print('MODEL',name,'dimensions',tuple(hi-lo),'objects',len(objects),flush=True)

def material(name,color,rough=.6):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
    return m
slate=material('Dark warm slate porcelain | reference floor',(.06,.05,.04),.48)
n=slate.node_tree.nodes;l=slate.node_tree.links;p=n.get('Principled BSDF')
coord=n.new('ShaderNodeTexCoord')
noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=7;noise.inputs['Detail'].default_value=5;noise.inputs['Roughness'].default_value=.75
l.new(coord.outputs['Object'],noise.inputs['Vector'])
ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.023,.019,.016,1);ramp.color_ramp.elements[1].color=(.095,.082,.066,1)
l.new(noise.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],p.inputs['Base Color'])
fine=n.new('ShaderNodeTexNoise');fine.inputs['Scale'].default_value=110;fine.inputs['Detail'].default_value=3
l.new(coord.outputs['Object'],fine.inputs['Vector'])
bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.38;bump.inputs['Distance'].default_value=.009
l.new(noise.outputs['Fac'],bump.inputs['Height'])
bump2=n.new('ShaderNodeBump');bump2.inputs['Strength'].default_value=.24;bump2.inputs['Distance'].default_value=.0015
l.new(fine.outputs['Fac'],bump2.inputs['Height']);l.new(bump.outputs['Normal'],bump2.inputs['Normal']);l.new(bump2.outputs['Normal'],p.inputs['Normal'])
grout=material('Recessed charcoal grout',(.017,.014,.012),.9)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.025));bpy.context.object.data.materials.append(grout)
for x in range(-5,5):
 for y in range(-5,5):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x*.8+.4,y*.8+.4,-.014))
    o=bpy.context.object;o.name='Slate porcelain tile';o.dimensions=(.796,.796,.025)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(slate);be=o.modifiers.new('Fine eased tile edge','BEVEL');be.width=.0015;be.segments=2

def area(name,loc,power,color,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
area('Warm architectural key',(-3,-1,5),1700,(1,.72,.46),4)
area('Evening sky fill',(3,3,6),2200,(.62,.75,1),5)
area('Soft overhead',(0,0,7),900,(1,.91,.78),5)
world=bpy.data.worlds.new('Blue hour');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.11,.14,.2,1);world.node_tree.nodes['Background'].inputs[1].default_value=.3;scene.world=world
camdata=bpy.data.cameras.new('True 90 degree orthographic');cam=bpy.data.objects.new('True 90 degree orthographic',camdata);scene.collection.objects.link(cam);cam.location=(0,0,10);cam.rotation_euler=(0,0,0);camdata.type='ORTHO';camdata.ortho_scale=6.3;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type!='CPU'
 if any(d.use for d in prefs.devices):scene.cycles.device='GPU'
except Exception as e:print(e)
scene.render.resolution_x=1800;scene.render.resolution_y=1800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.exposure=.6
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'PureFlame-Collection-Circle-Top.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'PureFlame-Collection-Circle.blend'))
bpy.ops.render.render(write_still=True)
