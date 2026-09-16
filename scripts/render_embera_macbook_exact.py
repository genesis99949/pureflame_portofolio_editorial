import bpy
import math
import os
import sys
from mathutils import Matrix, Vector


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def make_principled(name, color, roughness=0.45, metallic=0.0, emission=None):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = 2.5
    return material


def make_glass():
    material = make_principled("Embera glass", (0.5, 0.68, 0.72, 1.0), 0.08, 0.0)
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Transmission Weight"].default_value = 0.18
    bsdf.inputs["Alpha"].default_value = 0.17
    material.surface_render_method = "DITHERED"
    return material


def add_cube(name, location, dimensions, material, bevel=0.0, rotation=None):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    if rotation is not None:
        obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new("Soft machined edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    return obj


def add_area(name, location, energy, size, color, target):
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light_data.color = color
    light = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    look_at(light, target)
    return light


def object_part(obj):
    current = obj
    while current:
        part = current.get("pf_part")
        if part:
            return part
        current = current.parent
    return None


def part_center(meshes, part):
    points = []
    for obj in meshes:
        if object_part(obj) == part:
            points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not points:
        return Vector((0.0, 0.0, 0.46))
    minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return (minimum + maximum) * 0.5


def add_screen_plane(name, image_path, location, rotation, width, height):
    mesh = bpy.data.meshes.new(name + " Mesh")
    mesh.from_pydata(
        [
            (-width / 2, 0.0, -height / 2),
            (width / 2, 0.0, -height / 2),
            (width / 2, 0.0, height / 2),
            (-width / 2, 0.0, height / 2),
        ],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Homepage UV")
    for loop, uv in zip(uv_layer.data, ((0, 0), (1, 0), (1, 1), (0, 1))):
        loop.uv = uv

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation

    material = bpy.data.materials.new("Exact PureFlame homepage")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(image_path, check_existing=True)
    texture.interpolation = "Linear"
    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(texture.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 0.035
    bsdf.inputs["Roughness"].default_value = 0.18
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    obj.data.materials.append(material)
    return obj


args = sys.argv[sys.argv.index("--") + 1 :]
model_path = os.path.abspath(args[0])
homepage_path = os.path.abspath(args[1])
output_path = os.path.abspath(args[2])
os.makedirs(os.path.dirname(output_path), exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=model_path)
product_meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]

product_materials = {
    "body": make_principled("Embera graphite body", (0.018, 0.021, 0.023, 1.0), 0.58, 0.28),
    "base": make_principled("Embera inset plinth", (0.006, 0.007, 0.008, 1.0), 0.62, 0.22),
    "stones": make_principled("Dark lava stones", (0.035, 0.016, 0.008, 1.0), 0.92, 0.0),
    "bowl": make_principled("Recessed bowl", (0.08, 0.085, 0.09, 1.0), 0.25, 0.88),
    "burner": make_principled("Circular burner", (0.16, 0.12, 0.07, 1.0), 0.22, 0.9),
    "ignition": make_principled("Ignition", (0.13, 0.1, 0.06, 1.0), 0.26, 0.82),
    "hardware": make_principled("Glass fittings", (0.31, 0.24, 0.15, 1.0), 0.22, 0.9),
    "controls": make_principled("Controls", (0.025, 0.028, 0.032, 1.0), 0.3, 0.7),
    "handles": make_principled("Handles", (0.016, 0.018, 0.02, 1.0), 0.5, 0.4),
    "badge": make_principled("Badge", (0.38, 0.22, 0.08, 1.0), 0.26, 0.78),
    "glass": make_glass(),
}

for obj in product_meshes:
    part = object_part(obj)
    if part == "cover":
        obj.hide_render = True
        continue
    material = product_materials.get(part)
    if material:
        obj.data.materials.clear()
        obj.data.materials.append(material)

visible_meshes = [obj for obj in product_meshes if not obj.hide_render]
points = [obj.matrix_world @ Vector(corner) for obj in visible_meshes for corner in obj.bound_box]
minimum = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
maximum = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
table_top = 0.44

# A dimensionally plausible 14-inch MacBook-style laptop on the clear right side.
laptop_x = 0.43
laptop_y = 0.06
aluminum = make_principled("Space black anodized aluminum", (0.055, 0.058, 0.064, 1.0), 0.24, 0.82)
black = make_principled("Laptop black details", (0.006, 0.007, 0.009, 1.0), 0.32, 0.3)
trackpad = make_principled("Trackpad", (0.105, 0.11, 0.12, 1.0), 0.2, 0.76)

base_width, base_depth, base_height = 0.315, 0.221, 0.014
base = add_cube(
    "MacBook base",
    (laptop_x, laptop_y, table_top + base_height / 2 + 0.002),
    (base_width, base_depth, base_height),
    aluminum,
    bevel=0.007,
)
add_cube(
    "Keyboard bed",
    (laptop_x, laptop_y + 0.036, table_top + base_height + 0.0032),
    (0.282, 0.105, 0.003),
    black,
    bevel=0.003,
)
add_cube(
    "Trackpad",
    (laptop_x, laptop_y - 0.063, table_top + base_height + 0.0033),
    (0.128, 0.075, 0.002),
    trackpad,
    bevel=0.004,
)

key_material = make_principled("Keyboard keys", (0.012, 0.013, 0.015, 1.0), 0.36, 0.2)
for row in range(5):
    for column in range(13):
        key_x = laptop_x - 0.126 + column * 0.021
        key_y = laptop_y + 0.076 - row * 0.018
        add_cube(
            f"Key {row:02d}-{column:02d}",
            (key_x, key_y, table_top + base_height + 0.0051),
            (0.017, 0.014, 0.0018),
            key_material,
            bevel=0.0014,
        )

screen_outer_width, screen_outer_height, screen_thickness = 0.323, 0.218, 0.008
screen_rotation_x = math.radians(-8.0)
screen_rotation = (screen_rotation_x, 0.0, 0.0)
rotation_matrix = Matrix.Rotation(screen_rotation_x, 4, "X")
hinge = Vector((laptop_x, laptop_y + base_depth / 2 - 0.012, table_top + base_height + 0.006))
screen_center = hinge + rotation_matrix @ Vector((0.0, 0.0, screen_outer_height / 2))
add_cube(
    "MacBook display housing",
    screen_center,
    (screen_outer_width, screen_thickness, screen_outer_height),
    black,
    bevel=0.007,
    rotation=screen_rotation,
)

screen_width, screen_height = 0.296, 0.1973333333
screen_front = screen_center + rotation_matrix @ Vector((0.0, -screen_thickness / 2 - 0.0008, 0.0))
add_screen_plane(
    "Pixel-exact homepage display",
    homepage_path,
    screen_front,
    screen_rotation,
    screen_width,
    screen_height,
)

# A controlled cluster of emissive flame shapes at the exact burner location.
burner_center = part_center(visible_meshes, "burner")
flame_outer = make_principled("Flame orange", (1.0, 0.11, 0.008, 1.0), 0.18, 0.0, (1.0, 0.055, 0.002, 1.0))
flame_inner = make_principled("Flame gold", (1.0, 0.58, 0.06, 1.0), 0.12, 0.0, (1.0, 0.28, 0.01, 1.0))
for index, (dx, dy, height) in enumerate(((-0.07, 0.0, 0.14), (-0.035, 0.025, 0.19), (0.0, -0.02, 0.23), (0.04, 0.018, 0.17), (0.075, -0.01, 0.13))):
    bpy.ops.mesh.primitive_cone_add(
        vertices=24,
        radius1=0.025,
        radius2=0.002,
        depth=height,
        location=(burner_center.x + dx, burner_center.y + dy, table_top + 0.035 + height / 2),
    )
    flame = bpy.context.object
    flame.name = f"Flame {index}"
    flame.data.materials.append(flame_outer)
    flame.rotation_euler.y = math.radians((-5 + index * 3))
    bpy.ops.mesh.primitive_cone_add(
        vertices=20,
        radius1=0.012,
        radius2=0.001,
        depth=height * 0.62,
        location=(burner_center.x + dx, burner_center.y + dy - 0.003, table_top + 0.032 + height * 0.31),
    )
    bpy.context.object.data.materials.append(flame_inner)

fire_light_data = bpy.data.lights.new(name="Fire glow", type="POINT")
fire_light_data.energy = 42
fire_light_data.color = (1.0, 0.22, 0.035)
fire_light_data.shadow_soft_size = 0.42
fire_light = bpy.data.objects.new("Fire glow", fire_light_data)
bpy.context.collection.objects.link(fire_light)
fire_light.location = burner_center + Vector((0.0, 0.0, 0.21))

# Warm studio floor and restrained architectural backdrop.
floor_material = make_principled("Warm travertine floor", (0.16, 0.105, 0.065, 1.0), 0.68, 0.02)
add_cube("Studio floor", (0.0, 0.0, -0.035), (5.0, 5.0, 0.06), floor_material, bevel=0.0)
wall_material = make_principled("Warm stone wall", (0.12, 0.075, 0.046, 1.0), 0.82, 0.0)
add_cube("Backdrop wall", (0.0, 1.8, 1.15), (5.0, 0.08, 2.4), wall_material, bevel=0.02)

scene_target = Vector((0.16, 0.02, 0.46))
add_area("Warm key", (-1.25, -1.1, 1.65), 245, 1.05, (1.0, 0.57, 0.3), scene_target)
add_area("Screen-side fill", (1.15, -0.75, 1.25), 115, 0.95, (0.58, 0.68, 1.0), scene_target)
add_area("Top rim", (0.1, 0.4, 1.85), 195, 0.85, (1.0, 0.79, 0.58), scene_target)

camera_data = bpy.data.cameras.new("Close-up camera")
camera = bpy.data.objects.new("Close-up camera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (0.43, -1.48, 0.9)
camera_data.lens = 58
look_at(camera, scene_target)

scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1920
scene.render.resolution_y = 1280
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.filepath = output_path
scene.render.film_transparent = False
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -0.65
scene.world.color = (0.006, 0.004, 0.003)
scene.render.use_file_extension = True

bpy.ops.render.render(write_still=True)
print("Rendered exact homepage mockup:", output_path)
