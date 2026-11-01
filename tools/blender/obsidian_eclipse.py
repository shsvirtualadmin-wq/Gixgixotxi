#!/usr/bin/env python3
"""
Procedural Blender 4.x Scene Generator for "Obsidian Eclipse" (id: obsidian-eclipse)
Boardly Store Mythic Animated Banner (16:9, 1920x1080 -> 1200x675, 180 frames @ 30fps = 6.0s loop)

Usage:
  blender -b -P tools/blender/obsidian_eclipse.py -- --frames 0-179 --out /tmp/obsidian_eclipse_frames
"""

import sys
import os
import math
import random

try:
    import bpy
    import mathutils
except ImportError:
    print("This script must be executed inside Blender: blender -b -P obsidian_eclipse.py -- --frames 0-179")
    sys.exit(1)


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    frame_start = 0
    frame_end = 179
    out_dir = "/tmp/obsidian_eclipse_frames"
    save_blend = os.path.join(os.path.dirname(os.path.abspath(__file__)), "obsidian_eclipse.blend")

    i = 0
    while i < len(argv):
        if argv[i] == "--frames" and i + 1 < len(argv):
            parts = argv[i + 1].split("-")
            frame_start = int(parts[0])
            frame_end = int(parts[1]) if len(parts) > 1 else frame_start
            i += 2
        elif argv[i] == "--out" and i + 1 < len(argv):
            out_dir = argv[i + 1]
            i += 2
        elif argv[i] == "--save-blend" and i + 1 < len(argv):
            save_blend = argv[i + 1]
            i += 2
        else:
            i += 1
    return frame_start, frame_end, out_dir, save_blend


def build_scene():
    random.seed(42)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 0
    scene.frame_end = 179
    scene.render.fps = 30
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"

    # Filmic / AgX color management
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Filmic"
        scene.view_settings.look = "High Contrast"

    # World shader: deep cosmic black + subtle crimson nebula in right-center third
    world = bpy.data.worlds.new("ObsidianEclipseWorld")
    scene.world = world
    world.use_nodes = True
    wnodes = world.node_tree.nodes
    wlinks = world.node_tree.links
    wnodes.clear()

    bg = wnodes.new(type="ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.008, 0.003, 0.012, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    wout = wnodes.new(type="ShaderNodeOutputWorld")
    wlinks.new(bg.outputs["Background"], wout.inputs["Surface"])

    # Camera: placed so the eclipse & ring sit in the right-center third, leaving the left third dark & calm
    cam_data = bpy.data.cameras.new("EclipseCamera")
    cam_data.lens = 38.0
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 8.2
    cam_data.dof.aperture_fstop = 2.8
    cam_obj = bpy.data.objects.new("EclipseCamera", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Centerpiece root in right-center third (x = +1.35)
    rig = bpy.data.objects.new("EclipseCenterpiece", None)
    rig.location = (1.35, 0.0, 0.18)
    scene.collection.objects.link(rig)

    # 1. Black Eclipse Sun Sphere
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, radius=1.55, location=(1.35, 0.8, 0.28))
    sun_obj = bpy.context.active_object
    sun_obj.name = "BlackEclipseSun"
    bpy.ops.object.shade_smooth()

    mat_sun = bpy.data.materials.new("BlackSunMat")
    mat_sun.use_nodes = True
    bsdf = mat_sun.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.002, 0.002, 0.003, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.15
    sun_obj.data.materials.append(mat_sun)

    # 2. Massive Floating Obsidian Ring with Bevel & Gold Veins
    bpy.ops.mesh.primitive_torus_add(
        major_radius=2.35,
        minor_radius=0.26,
        major_segments=128,
        minor_segments=32,
        location=(1.35, 0.0, 0.15),
        rotation=(math.radians(64), math.radians(-18), math.radians(12)),
    )
    ring_obj = bpy.context.active_object
    ring_obj.name = "ObsidianRing"
    bpy.ops.object.shade_smooth()

    mat_obsidian = bpy.data.materials.new("ObsidianGoldVeinMat")
    mat_obsidian.use_nodes = True
    ob_bsdf = mat_obsidian.node_tree.nodes.get("Principled BSDF")
    if ob_bsdf:
        ob_bsdf.inputs["Base Color"].default_value = (0.02, 0.015, 0.028, 1.0)
        ob_bsdf.inputs["Metallic"].default_value = 0.85
        ob_bsdf.inputs["Roughness"].default_value = 0.14
        if "Emission Color" in ob_bsdf.inputs:
            ob_bsdf.inputs["Emission Color"].default_value = (1.0, 0.68, 0.12, 1.0)
            ob_bsdf.inputs["Emission Strength"].default_value = 2.4
    ring_obj.data.materials.append(mat_obsidian)

    # 3. Orbiting Broken Monolith Slabs
    slab_group = bpy.data.objects.new("OrbitingSlabs", None)
    slab_group.location = (1.35, 0.0, 0.15)
    slab_group.rotation_euler = (math.radians(64), math.radians(-18), math.radians(12))
    scene.collection.objects.link(slab_group)

    for idx in range(16):
        ang = (idx / 16.0) * math.tau
        rad = 2.95 + (idx % 3) * 0.22
        sx = math.cos(ang) * rad
        sy = math.sin(ang) * rad
        sz = math.sin(ang * 2.0) * 0.18
        bpy.ops.mesh.primitive_cube_add(size=0.22, location=(sx, sy, sz))
        slab = bpy.context.active_object
        slab.scale = (1.6, 0.45, 0.28)
        bevel = slab.modifiers.new("Bevel", "BEVEL")
        bevel.width = 0.025
        bevel.segments = 2
        slab.data.materials.append(mat_obsidian)
        slab.parent = slab_group

    # 4. Rim & Key Lights (Gold Diamond Flare + Crimson Rim)
    key_data = bpy.data.lights.new("DiamondFlareLight", type="POINT")
    key_data.energy = 1800.0
    key_data.color = (1.0, 0.82, 0.38)
    key_obj = bpy.data.objects.new("DiamondFlareLight", key_data)
    key_obj.location = (0.45, -1.2, 1.15)
    scene.collection.objects.link(key_obj)

    rim_data = bpy.data.lights.new("CrimsonRimLight", type="POINT")
    rim_data.energy = 1200.0
    rim_data.color = (0.88, 0.12, 0.18)
    rim_obj = bpy.data.objects.new("CrimsonRimLight", rim_data)
    rim_obj.location = (2.8, -1.5, -1.1)
    scene.collection.objects.link(rim_obj)

    # Periodic 180-frame animation (seamless loop)
    for f in range(0, 181):
        theta = (f / 180.0) * math.tau
        scene.frame_set(f)

        # Camera slow 3% push-in and subtle sinusoidal drift returning to start
        push = (1.0 - math.cos(theta)) * 0.5
        cam_obj.location = (
            0.05 * math.sin(theta),
            -8.2 + 0.24 * push,
            0.04 * math.sin(theta * 2.0),
        )
        cam_obj.rotation_euler = (math.radians(90.0), 0.0, 0.0)
        cam_obj.keyframe_insert(data_path="location", frame=f)

        # Whole-number rotation of slabs and ring oscillation
        slab_group.rotation_euler[2] = math.radians(12) + theta
        slab_group.keyframe_insert(data_path="rotation_euler", frame=f)

        ring_obj.rotation_euler[2] = math.radians(12) - theta
        ring_obj.keyframe_insert(data_path="rotation_euler", frame=f)

    return scene


if __name__ == "__main__":
    f_start, f_end, out_dir, save_blend = parse_args()
    os.makedirs(out_dir, exist_ok=True)
    scn = build_scene()
    if save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=save_blend)
    for frame in range(f_start, f_end + 1):
        scn.frame_set(frame)
        scn.render.filepath = os.path.join(out_dir, f"frame_{frame:04d}.png")
        bpy.ops.render.render(write_still=True)
