import bpy,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out=os.path.join(root,'design-review','collection-circle')
bpy.ops.wm.open_mainfile(filepath=os.path.join(out,'PureFlame-Collection-Circle.blend'))
s=bpy.context.scene
s.view_settings.exposure=-1.2
for o in bpy.data.objects:
 if o.type=='LIGHT':
  if 'key' in o.name:o.data.energy=900
  elif 'sky' in o.name:o.data.energy=500
  else:o.data.energy=250
s.world.node_tree.nodes['Background'].inputs[1].default_value=.12
s.cycles.samples=96
s.render.filepath=os.path.join(out,'PureFlame-Collection-Circle-Top.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'PureFlame-Collection-Circle.blend'))
bpy.ops.render.render(write_still=True)
