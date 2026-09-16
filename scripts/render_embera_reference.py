import bpy
import math
import os
import sys
from mathutils import Vector


def look_at(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_area(name, location, energy, size, color):
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, scene_center)
    return obj


args = sys.argv[sys.argv.index("--") + 1 :]
model_path = os.path.abspath(args[0])
output_dir = os.path.abspath(args[1])
os.makedirs(output_dir, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=model_path)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
if not meshes:
    raise RuntimeError("The GLB did not contain renderable meshes")


def product_part(obj):
    current = obj
    while current is not None:
        part = current.get("pf_part")
        if part:
            return part
        current = current.parent
    return None


def tune_material(obj, part):
    if part == "cover":
        obj.hide_render = True
        obj.hide_viewport = True
        return
    # The GLB reuses materials across several tagged parts. Give each mesh its
    # own copies so tuning glass or hardware cannot recolour the table body.
    for index, material in enumerate(list(obj.data.materials)):
        if material:
            obj.data.materials[index] = material.copy()
    palette = {
        "body": ((0.022, 0.026, 0.028, 1.0), 0.58, 0.18),
        "base": ((0.012, 0.014, 0.016, 1.0), 0.62, 0.12),
        "stones": ((0.045, 0.026, 0.016, 1.0), 0.88, 0.02),
        "bowl": ((0.11, 0.12, 0.13, 1.0), 0.28, 0.82),
        "burner": ((0.16, 0.13, 0.095, 1.0), 0.25, 0.86),
        "ignition": ((0.12, 0.11, 0.09, 1.0), 0.3, 0.72),
        "hardware": ((0.34, 0.29, 0.22, 1.0), 0.24, 0.88),
        "controls": ((0.035, 0.038, 0.042, 1.0), 0.32, 0.68),
        "handles": ((0.025, 0.028, 0.03, 1.0), 0.5, 0.25),
        "badge": ((0.42, 0.29, 0.12, 1.0), 0.3, 0.72),
    }
    if part == "glass":
        for material in obj.data.materials:
            material.use_nodes = True
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.74, 0.86, 0.9, 1.0)
                bsdf.inputs["Roughness"].default_value = 0.08
                bsdf.inputs["Transmission Weight"].default_value = 0.12
                bsdf.inputs["Alpha"].default_value = 0.16
            material.surface_render_method = "DITHERED"
        return
    values = palette.get(part)
    if not values:
        return
    color, roughness, metallic = values
    for material in obj.data.materials:
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = color
            bsdf.inputs["Roughness"].default_value = roughness
            bsdf.inputs["Metallic"].default_value = metallic


for mesh in meshes:
    part = product_part(mesh)
    print("Mesh part:", mesh.name, part)
    tune_material(mesh, part)

meshes = [obj for obj in meshes if not obj.hide_render]

points = []
for obj in meshes:
    points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)

minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
dimensions = maximum - minimum
scene_center = (minimum + maximum) * 0.5
target = Vector((scene_center.x, scene_center.y, minimum.z + dimensions.z * 0.46))
span = max(dimensions.x, dimensions.y)

# Neutral studio floor, kept separate from the product geometry.
bpy.ops.mesh.primitive_plane_add(size=span * 5.0, location=(scene_center.x, scene_center.y, minimum.z - 0.004))
floor = bpy.context.object
floor.name = "Reference studio floor"
floor_material = bpy.data.materials.new("Warm charcoal floor")
floor_material.diffuse_color = (0.035, 0.028, 0.022, 1.0)
floor_material.use_nodes = True
floor_bsdf = floor_material.node_tree.nodes.get("Principled BSDF")
floor_bsdf.inputs["Base Color"].default_value = (0.035, 0.028, 0.022, 1.0)
floor_bsdf.inputs["Roughness"].default_value = 0.72
floor.data.materials.append(floor_material)

camera_data = bpy.data.cameras.new("Reference Camera")
camera = bpy.data.objects.new("Reference Camera", camera_data)
bpy.context.collection.objects.link(camera)
bpy.context.scene.camera = camera
camera_data.lens = 58

add_area(
    "Warm key",
    scene_center + Vector((-span * 0.75, -span * 0.85, span * 1.25)),
    1250,
    span * 0.9,
    (1.0, 0.66, 0.38),
)
add_area(
    "Soft fill",
    scene_center + Vector((span * 1.0, -span * 0.25, span * 0.75)),
    850,
    span * 1.2,
    (0.58, 0.67, 1.0),
)
add_area(
    "Top rim",
    scene_center + Vector((0.0, span * 0.5, span * 1.65)),
    1050,
    span * 0.75,
    (1.0, 0.82, 0.62),
)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1536
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.render.image_settings.color_depth = "8"
scene.render.resolution_percentage = 100
scene.render.use_file_extension = True
scene.view_settings.look = "AgX - Medium High Contrast"
scene.world.color = (0.012, 0.009, 0.007)

views = [
    (
        "embera-model-reference-front.png",
        scene_center + Vector((span * 1.15, -span * 1.42, span * 0.72)),
    ),
    (
        "embera-model-reference-top.png",
        scene_center + Vector((span * 0.72, -span * 1.08, span * 1.32)),
    ),
]

for filename, position in views:
    camera.location = position
    look_at(camera, target)
    scene.render.filepath = os.path.join(output_dir, filename)
    bpy.ops.render.render(write_still=True)
    print(f"Rendered {scene.render.filepath}")

print(
    "Model bounds:",
    tuple(round(v, 4) for v in minimum),
    tuple(round(v, 4) for v in maximum),
    "dimensions:",
    tuple(round(v, 4) for v in dimensions),
)
