import bpy
import os
import sys


args = sys.argv[sys.argv.index("--") + 1 :]
base_path = os.path.abspath(args[0])
screen_path = os.path.abspath(args[1])
output_path = os.path.abspath(args[2])
os.makedirs(os.path.dirname(output_path), exist_ok=True)

base = bpy.data.images.load(base_path, check_existing=True)
screen = bpy.data.images.load(screen_path, check_existing=True)
width, height = int(base.size[0]), int(base.size[1])

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = width
scene.render.resolution_y = height
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.filepath = output_path
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "Medium High Contrast"

# A camera is required to trigger a render, although the compositor replaces it.
bpy.ops.object.camera_add(location=(0.0, 0.0, 10.0))
camera = bpy.context.object
camera.data.type = "ORTHO"
camera.data.ortho_scale = 2.0
scene.camera = camera

scene.use_nodes = True
tree = bpy.data.node_groups.new("Exact Homepage Composite", "CompositorNodeTree")
scene.compositing_node_group = tree
tree.nodes.clear()

base_node = tree.nodes.new("CompositorNodeImage")
base_node.name = "Photoreal Embera mockup"
base_node.image = base

screen_node = tree.nodes.new("CompositorNodeImage")
screen_node.name = "Exact homepage pixels"
screen_node.image = screen

corner_pin = tree.nodes.new("CompositorNodeCornerPin")
corner_pin.name = "MacBook display perspective"

# Inner LCD corners measured on the 1536 × 1024 photoreal GLB-based mockup.
# Compositor corner coordinates are normalized from the lower-left.
def normalized(x, y):
    return (x / width, 1.0 - y / height)


corner_pin.inputs["Upper Left"].default_value = normalized(766, 149)
corner_pin.inputs["Upper Right"].default_value = normalized(1292, 157)
corner_pin.inputs["Lower Left"].default_value = normalized(731, 462)
corner_pin.inputs["Lower Right"].default_value = normalized(1261, 487)

alpha_over = tree.nodes.new("CompositorNodeAlphaOver")
alpha_over.inputs["Factor"].default_value = 1.0
composite = tree.nodes.new("CompositorNodeComposite")

tree.links.new(screen_node.outputs["Image"], corner_pin.inputs["Image"])
tree.links.new(base_node.outputs["Image"], alpha_over.inputs["Background"])
tree.links.new(corner_pin.outputs["Image"], alpha_over.inputs["Foreground"])
tree.links.new(alpha_over.outputs["Image"], composite.inputs["Image"])

bpy.ops.render.render(write_still=True)
print("Saved exact homepage composite:", output_path)
