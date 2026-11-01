#!/usr/bin/env python3
"""
Boardly Store — "Sovereign of the Black Sun" (id: sovereign-of-the-black-sun)
Procedural Blender 4.2 LTS Scene & 180-Frame Seamless Loop Generator
File: /tools/blender/sovereign_black_sun.py

Usage:
  blender -b -P /tools/blender/sovereign_black_sun.py -- --frames 0-179 --output /tmp/sovereign_black_sun_frames/frame_
"""

import bpy
import bmesh
import math
import random
import sys
import os
from mathutils import Vector, Euler, Matrix


def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    frame_start = 0
    frame_end = 179
    output_prefix = "/tmp/sovereign_black_sun_frames/frame_"
    samples = 1
    res_x = 1920
    res_y = 1080
    save_blend = "/app/applet/tools/blender/sovereign_black_sun.blend"

    i = 0
    while i < len(argv):
        if argv[i] == "--frames" and i + 1 < len(argv):
            parts = argv[i + 1].split("-")
            frame_start = int(parts[0])
            frame_end = int(parts[1]) if len(parts) > 1 else frame_start
            i += 2
        elif argv[i] == "--output" and i + 1 < len(argv):
            output_prefix = argv[i + 1]
            i += 2
        elif argv[i] == "--samples" and i + 1 < len(argv):
            samples = int(argv[i + 1])
            i += 2
        elif argv[i] == "--save-blend" and i + 1 < len(argv):
            save_blend = argv[i + 1]
            i += 2
        else:
            i += 1

    return frame_start, frame_end, output_prefix, samples, res_x, res_y, save_blend


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_render_engine(scene, samples=2, res_x=1920, res_y=1080):
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences
    cycles_prefs = prefs.addons["cycles"].preferences

    gpu_enabled = False
    for dev_type in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
        try:
            cycles_prefs.compute_device_type = dev_type
            cycles_prefs.get_devices()
            for d in cycles_prefs.devices:
                if d.type != "CPU":
                    d.use = True
                    gpu_enabled = True
            if gpu_enabled:
                scene.cycles.device = "GPU"
                break
        except Exception:
            pass

    if not gpu_enabled:
        scene.cycles.device = "CPU"

    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = False
    scene.cycles.max_bounces = 0
    scene.cycles.diffuse_bounces = 0
    scene.cycles.glossy_bounces = 0
    scene.cycles.transmission_bounces = 0
    scene.cycles.volume_bounces = 0
    scene.cycles.transparent_max_bounces = 0
    scene.cycles.seed = 42
    if hasattr(scene.cycles, "use_animated_seed"):
        scene.cycles.use_animated_seed = False
    if hasattr(scene.cycles, "use_light_tree"):
        scene.cycles.use_light_tree = False
    scene.cycles.use_denoising = False

    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.frame_start = 0
    scene.frame_end = 179
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 1
    scene.render.use_persistent_data = True

    for view_candidate in ("AgX", "Filmic", "Standard"):
        try:
            scene.view_settings.view_transform = view_candidate
            break
        except Exception:
            continue
    for look_candidate in ("AgX - High Contrast", "High Contrast", "Medium High Contrast", "None"):
        try:
            scene.view_settings.look = look_candidate
            break
        except Exception:
            continue
    scene.view_settings.exposure = 0.05
    scene.view_settings.gamma = 1.0


def set_color_ramp_stops(color_ramp, stops):
    elems = color_ramp.elements
    while len(elems) > 2:
        elems.remove(elems[-1])
    elems[0].position = stops[0][0]
    elems[0].color = stops[0][1]
    elems[1].position = stops[1][0]
    elems[1].color = stops[1][1]
    for pos, col in stops[2:]:
        e = elems.new(pos)
        e.color = col


def build_pbr_lit_surface_nodes(
    nt,
    base_rgb,
    gold_rim_rgb,
    lava_up_rgb,
    bump_height_socket=None,
    bump_strength=0.35,
    extra_emit_socket=None,
    rim_blend=0.22,
    spec_power=0.85,
):
    """
    Constructs a dark, high-contrast film-lit obsidian/scale shader graph in Blender:
      - Keeps core facing surfaces deep obsidian black/crimson (never washed-out beige)
      - Concentrates bright solar gold on true silhouette Fresnel rims (unbumped normal, Blend ~ 0.22)
      - Concentrates glossy specular glints on bumped scale/obsidian facets aligned with the corona
      - Concentrates molten crimson-orange on downward-facing lava under-lit surfaces
    """
    geom = nt.nodes.new("ShaderNodeNewGeometry")
    smooth_normal = geom.outputs["Normal"]
    normal_out = smooth_normal

    if bump_height_socket is not None:
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.025
        nt.links.new(bump_height_socket, bump.inputs["Height"])
        normal_out = bump.outputs["Normal"]

    # 1. Tight Glossy Specular Glint from Upper-Right Solar Corona: H = normalize((0.36, -0.52, 0.77))
    dot_spec = nt.nodes.new("ShaderNodeVectorMath")
    dot_spec.operation = "DOT_PRODUCT"
    dot_spec.inputs[1].default_value = (0.36, -0.52, 0.77)
    nt.links.new(normal_out, dot_spec.inputs[0])

    clamp_spec = nt.nodes.new("ShaderNodeMapRange")
    clamp_spec.interpolation_type = "SMOOTHSTEP"
    clamp_spec.inputs["From Min"].default_value = 0.82
    clamp_spec.inputs["From Max"].default_value = 0.99
    clamp_spec.inputs["To Min"].default_value = 0.0
    clamp_spec.inputs["To Max"].default_value = spec_power
    nt.links.new(dot_spec.outputs["Value"], clamp_spec.inputs["Value"])

    # 2. Lower Volcanic Lava Up-Light (only downward-facing undersides)
    dot_lava = nt.nodes.new("ShaderNodeVectorMath")
    dot_lava.operation = "DOT_PRODUCT"
    dot_lava.inputs[1].default_value = (0.15, -0.45, -0.88)
    nt.links.new(normal_out, dot_lava.inputs[0])

    clamp_lava = nt.nodes.new("ShaderNodeMapRange")
    clamp_lava.interpolation_type = "SMOOTHSTEP"
    clamp_lava.inputs["From Min"].default_value = 0.58
    clamp_lava.inputs["From Max"].default_value = 0.98
    clamp_lava.inputs["To Min"].default_value = 0.0
    clamp_lava.inputs["To Max"].default_value = 0.65
    nt.links.new(dot_lava.outputs["Value"], clamp_lava.inputs["Value"])

    # 3. True Silhouette Rim (uses unbumped smooth_normal with low Blend ~ 0.22 so only true edges glow gold!)
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.22
    nt.links.new(smooth_normal, lw.inputs["Normal"])

    rim_curve = nt.nodes.new("ShaderNodeMapRange")
    rim_curve.interpolation_type = "SMOOTHSTEP"
    rim_curve.inputs["From Min"].default_value = 0.56
    rim_curve.inputs["From Max"].default_value = 0.95
    rim_curve.inputs["To Min"].default_value = 0.0
    rim_curve.inputs["To Max"].default_value = 1.45
    nt.links.new(lw.outputs["Facing"], rim_curve.inputs["Value"])

    mix_spec = nt.nodes.new("ShaderNodeMixRGB")
    mix_spec.blend_type = "ADD"
    mix_spec.inputs["Color1"].default_value = (*base_rgb, 1.0)
    mix_spec.inputs["Color2"].default_value = (*gold_rim_rgb, 1.0)
    nt.links.new(clamp_spec.outputs["Result"], mix_spec.inputs["Fac"])

    mix_lava = nt.nodes.new("ShaderNodeMixRGB")
    mix_lava.blend_type = "ADD"
    mix_lava.inputs["Color2"].default_value = (*lava_up_rgb, 1.0)
    nt.links.new(mix_spec.outputs["Color"], mix_lava.inputs["Color1"])
    nt.links.new(clamp_lava.outputs["Result"], mix_lava.inputs["Fac"])

    mix_rim = nt.nodes.new("ShaderNodeMixRGB")
    mix_rim.blend_type = "ADD"
    mix_rim.inputs["Color2"].default_value = (*gold_rim_rgb, 1.0)
    nt.links.new(mix_lava.outputs["Color"], mix_rim.inputs["Color1"])
    nt.links.new(rim_curve.outputs["Result"], mix_rim.inputs["Fac"])

    final_color_socket = mix_rim.outputs["Color"]

    if extra_emit_socket is not None:
        mix_extra = nt.nodes.new("ShaderNodeMixRGB")
        mix_extra.blend_type = "ADD"
        mix_extra.inputs["Fac"].default_value = 1.0
        nt.links.new(final_color_socket, mix_extra.inputs["Color1"])
        nt.links.new(extra_emit_socket, mix_extra.inputs["Color2"])
        final_color_socket = mix_extra.outputs["Color"]

    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.0
    nt.links.new(final_color_socket, emit.inputs["Color"])
    return emit


def build_world_sky(scene):
    world = bpy.data.worlds.new("sovereign_black_sun_world")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.002, 0.001, 0.004, 1.0)
    bg.inputs["Strength"].default_value = 1.0
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def create_sky_backdrop_plane(animated_nodes):
    """
    Full-frame 16:9 distant backdrop plane with:
      - Deep black starry sky + faint crimson & gold nebula in right-center
      - Volumetric crimson/gold god rays bursting radially from behind the eclipse
      - Layered dark storm clouds lit from within
      - Calm, dark left third for UI / player name readability
    """
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 22.0, 0.0), rotation=(math.pi / 2, 0.0, 0.0))
    plane = bpy.context.active_object
    plane.name = "sovereign_black_sun_sky_backdrop"
    plane.scale = (31.5, 17.72, 1.0)

    mat = bpy.data.materials.new("sovereign_black_sun_sky_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.0

    tex_coord = nt.nodes.new("ShaderNodeTexCoord")
    sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tex_coord.outputs["Generated"], sep_xyz.inputs["Vector"])

    # Eclipse center in UV space: (0.635, 0.60)
    sub_x = nt.nodes.new("ShaderNodeMath")
    sub_x.operation = "SUBTRACT"
    sub_x.inputs[1].default_value = 0.635
    nt.links.new(sep_xyz.outputs["X"], sub_x.inputs[0])

    mul_aspect = nt.nodes.new("ShaderNodeMath")
    mul_aspect.operation = "MULTIPLY"
    mul_aspect.inputs[1].default_value = 1.7778
    nt.links.new(sub_x.outputs["Value"], mul_aspect.inputs[0])

    sub_y = nt.nodes.new("ShaderNodeMath")
    sub_y.operation = "SUBTRACT"
    sub_y.inputs[1].default_value = 0.60
    nt.links.new(sep_xyz.outputs["Y"], sub_y.inputs[0])

    comb_delta = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(mul_aspect.outputs["Value"], comb_delta.inputs["X"])
    nt.links.new(sub_y.outputs["Value"], comb_delta.inputs["Y"])

    vec_len = nt.nodes.new("ShaderNodeVectorMath")
    vec_len.operation = "LENGTH"
    nt.links.new(comb_delta.outputs["Vector"], vec_len.inputs[0])

    vec_norm = nt.nodes.new("ShaderNodeVectorMath")
    vec_norm.operation = "NORMALIZE"
    nt.links.new(comb_delta.outputs["Vector"], vec_norm.inputs[0])

    # Radial volumetric god-ray streaks (4D periodic)
    noise_rays = nt.nodes.new("ShaderNodeTexNoise")
    noise_rays.noise_dimensions = "4D"
    noise_rays.inputs["Scale"].default_value = 8.2
    noise_rays.inputs["Detail"].default_value = 2.5
    noise_rays.inputs["Roughness"].default_value = 0.58
    noise_rays.inputs["W"].default_value = 0.0
    nt.links.new(vec_norm.outputs["Vector"], noise_rays.inputs["Vector"])
    animated_nodes["ray_noise_w"] = noise_rays.inputs["W"]

    # Layered storm clouds & crimson nebula (4D periodic)
    noise_clouds = nt.nodes.new("ShaderNodeTexNoise")
    noise_clouds.noise_dimensions = "4D"
    noise_clouds.inputs["Scale"].default_value = 3.6
    noise_clouds.inputs["Detail"].default_value = 3.0
    noise_clouds.inputs["Roughness"].default_value = 0.68
    noise_clouds.inputs["W"].default_value = 0.0
    nt.links.new(comb_delta.outputs["Vector"], noise_clouds.inputs["Vector"])
    animated_nodes["sky_noise_w"] = noise_clouds.inputs["W"]

    # Radial falloff from eclipse center: exp(-dist * 2.15)
    mul_dist = nt.nodes.new("ShaderNodeMath")
    mul_dist.operation = "MULTIPLY"
    mul_dist.inputs[1].default_value = -2.15
    nt.links.new(vec_len.outputs["Value"], mul_dist.inputs[0])

    exp_falloff = nt.nodes.new("ShaderNodeMath")
    exp_falloff.operation = "EXPONENT"
    nt.links.new(mul_dist.outputs["Value"], exp_falloff.inputs[0])

    mix_ray_cloud = nt.nodes.new("ShaderNodeMath")
    mix_ray_cloud.operation = "MULTIPLY"
    nt.links.new(noise_rays.outputs["Fac"], mix_ray_cloud.inputs[0])
    nt.links.new(noise_clouds.outputs["Fac"], mix_ray_cloud.inputs[1])

    mul_radial = nt.nodes.new("ShaderNodeMath")
    mul_radial.operation = "MULTIPLY"
    nt.links.new(mix_ray_cloud.outputs["Value"], mul_radial.inputs[0])
    nt.links.new(exp_falloff.outputs["Value"], mul_radial.inputs[1])

    # Left-third calm negative-space mask
    map_left = nt.nodes.new("ShaderNodeMapRange")
    map_left.interpolation_type = "SMOOTHSTEP"
    map_left.inputs["From Min"].default_value = 0.10
    map_left.inputs["From Max"].default_value = 0.45
    map_left.inputs["To Min"].default_value = 0.08
    map_left.inputs["To Max"].default_value = 1.0
    nt.links.new(sep_xyz.outputs["X"], map_left.inputs["Value"])

    mul_masked = nt.nodes.new("ShaderNodeMath")
    mul_masked.operation = "MULTIPLY"
    nt.links.new(mul_radial.outputs["Value"], mul_masked.inputs[0])
    nt.links.new(map_left.outputs["Result"], mul_masked.inputs[1])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp.color_ramp,
        [
            (0.0, (0.002, 0.001, 0.005, 1.0)),
            (0.15, (0.09, 0.008, 0.016, 1.0)),
            (0.32, (0.58, 0.045, 0.06, 1.0)),
            (0.52, (0.95, 0.24, 0.07, 1.0)),
            (0.76, (1.0, 0.78, 0.26, 1.0)),
        ],
    )
    nt.links.new(mul_masked.outputs["Value"], ramp.inputs["Fac"])

    # Pinpoint starfield in deep space
    vor_stars = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_stars.inputs["Scale"].default_value = 155.0
    nt.links.new(tex_coord.outputs["Generated"], vor_stars.inputs["Vector"])

    star_thresh = nt.nodes.new("ShaderNodeMapRange")
    star_thresh.inputs["From Min"].default_value = 0.018
    star_thresh.inputs["From Max"].default_value = 0.0
    star_thresh.inputs["To Min"].default_value = 0.0
    star_thresh.inputs["To Max"].default_value = 0.48
    nt.links.new(vor_stars.outputs["Distance"], star_thresh.inputs["Value"])

    mix_stars = nt.nodes.new("ShaderNodeMixRGB")
    mix_stars.blend_type = "ADD"
    mix_stars.inputs["Color2"].default_value = (1.0, 0.88, 0.68, 1.0)
    nt.links.new(star_thresh.outputs["Result"], mix_stars.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix_stars.inputs["Color1"])

    nt.links.new(mix_stars.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    plane.data.materials.append(mat)
    return plane


def create_distant_mountains_and_clouds(animated_nodes):
    """
    Distant silhouetted mountain range grounded well below the bottom frame edge,
    with subtle organic molten lava cracks in the right-center valleys.
    """
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=110, y_subdivisions=28, size=1.0, location=(2.2, 13.8, -3.4))
    mtn = bpy.context.active_object
    mtn.name = "sovereign_black_sun_mountains"
    mtn.scale = (20.0, 4.2, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bm = bmesh.new()
    bm.from_mesh(mtn.data)
    rng = random.Random(40912)
    for v in bm.verts:
        nx = v.co.x * 0.42
        ny = v.co.y * 0.75
        ridge = max(0.0, 1.0 - abs(v.co.y) * 0.52)
        h = (
            abs(math.sin(nx * 1.8) * math.cos(ny * 1.3)) * 2.15
            + abs(math.cos(nx * 3.9 + 0.6)) * 0.78
            + rng.uniform(-0.04, 0.08)
        ) * ridge
        left_mask = max(0.0, min(1.0, (v.co.x + 2.5) / 6.5))
        if v.co.y < -1.55 or v.co.y > 1.55:
            v.co.z -= 3.2
        else:
            v.co.z += h * left_mask * 1.65 - (1.0 - left_mask) * 2.6
    bm.to_mesh(mtn.data)
    bm.free()
    for poly in mtn.data.polygons:
        poly.use_smooth = True

    mat_mtn = bpy.data.materials.new("sovereign_black_sun_mountain_mat")
    mat_mtn.use_nodes = True
    nt = mat_mtn.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    tc = nt.nodes.new("ShaderNodeTexCoord")
    # Warp Voronoi coordinates with 3D Noise so lava cracks look organic, never cellular
    noise_warp = nt.nodes.new("ShaderNodeTexNoise")
    noise_warp.inputs["Scale"].default_value = 2.2
    noise_warp.inputs["Detail"].default_value = 4.0
    nt.links.new(tc.outputs["Object"], noise_warp.inputs["Vector"])

    mix_vec = nt.nodes.new("ShaderNodeMixRGB")
    mix_vec.inputs["Fac"].default_value = 0.35
    nt.links.new(tc.outputs["Object"], mix_vec.inputs["Color1"])
    nt.links.new(noise_warp.outputs["Color"], mix_vec.inputs["Color2"])

    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.voronoi_dimensions = "4D"
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 1.85
    vor.inputs["W"].default_value = 0.0
    nt.links.new(mix_vec.outputs["Color"], vor.inputs["Vector"])
    animated_nodes["mountain_lava_w"] = vor.inputs["W"]

    # Hairline lava fissures only (0.0 -> 0.010)
    ramp_lava = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_lava.color_ramp,
        [
            (0.0, (0.95, 0.32, 0.04, 1.0)),
            (0.008, (0.45, 0.04, 0.01, 1.0)),
            (0.016, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nt.links.new(vor.outputs["Distance"], ramp_lava.inputs["Fac"])

    emit_node = build_pbr_lit_surface_nodes(
        nt,
        base_rgb=(0.004, 0.002, 0.006),
        gold_rim_rgb=(0.28, 0.12, 0.04),
        lava_up_rgb=(0.14, 0.02, 0.01),
        bump_height_socket=noise_warp.outputs["Fac"],
        bump_strength=0.45,
        extra_emit_socket=ramp_lava.outputs["Color"],
        rim_blend=0.86,
        spec_power=0.35,
    )
    nt.links.new(emit_node.outputs["Emission"], out.inputs["Surface"])
    mtn.data.materials.append(mat_mtn)


def create_eclipsed_black_sun_and_ring(animated_nodes):
    """
    THE SUN: Giant black sun in total eclipse in the upper right-center,
    with a thin glowing gold corona, bright diamond-ring flare on the upper-left limb,
    and a massive floating glossy bevelled obsidian ring with glowing gold veins and orbiting slabs.
    """
    sun_center = Vector((1.95, 8.2, 0.92))

    # 1. Outer Solar Corona Glow Ring BEHIND the Black Sun Sphere
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.54,
        minor_radius=0.18,
        major_segments=96,
        minor_segments=24,
        location=sun_center + Vector((0.0, 0.12, 0.0)),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    corona_torus = bpy.context.active_object
    corona_torus.name = "sovereign_black_sun_corona_torus"
    corona_torus.scale = (1.0, 1.0, 0.22)
    for p in corona_torus.data.polygons:
        p.use_smooth = True

    mat_corona = bpy.data.materials.new("sovereign_black_sun_corona_mat")
    mat_corona.use_nodes = True
    ntc = mat_corona.node_tree
    ntc.nodes.clear()
    outc = ntc.nodes.new("ShaderNodeOutputMaterial")
    emitc = ntc.nodes.new("ShaderNodeEmission")
    lwc = ntc.nodes.new("ShaderNodeLayerWeight")
    lwc.inputs["Blend"].default_value = 0.38
    rampc = ntc.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampc.color_ramp,
        [
            (0.0, (1.0, 0.84, 0.34, 1.0)),
            (0.42, (0.98, 0.45, 0.08, 1.0)),
            (0.75, (0.68, 0.06, 0.04, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntc.links.new(lwc.outputs["Facing"], rampc.inputs["Fac"])
    ntc.links.new(rampc.outputs["Color"], emitc.inputs["Color"])
    emitc.inputs["Strength"].default_value = 2.6
    animated_nodes["corona_strength"] = emitc.inputs["Strength"]
    ntc.links.new(emitc.outputs["Emission"], outc.inputs["Surface"])
    corona_torus.data.materials.append(mat_corona)

    # 2. Pitch-Black Total Eclipse Sun Sphere with Razor-Thin Gold Rim
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.48, location=sun_center)
    sun = bpy.context.active_object
    sun.name = "sovereign_black_sun_sphere"
    for p in sun.data.polygons:
        p.use_smooth = True

    mat_sun = bpy.data.materials.new("sovereign_black_sun_core_mat")
    mat_sun.use_nodes = True
    nt = mat_sun.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.86

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp.color_ramp,
        [
            (0.0, (0.001, 0.0005, 0.002, 1.0)),
            (0.86, (0.002, 0.001, 0.004, 1.0)),
            (0.94, (0.85, 0.14, 0.06, 1.0)),
            (0.988, (1.0, 0.88, 0.36, 1.0)),
        ],
    )
    nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 2.2
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    sun.data.materials.append(mat_sun)

    # 3. Bright Diamond-Ring Flare on Upper-Left Limb of the Eclipse
    flare_pos = sun_center + Vector((-1.06, -0.18, 1.04))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.15, location=flare_pos)
    flare = bpy.context.active_object
    flare.name = "sovereign_black_sun_diamond_flare"
    flare.scale = (1.3, 0.5, 1.3)
    mat_flare = bpy.data.materials.new("sovereign_black_sun_flare_mat")
    mat_flare.use_nodes = True
    ntf = mat_flare.node_tree
    ntf.nodes.clear()
    outf = ntf.nodes.new("ShaderNodeOutputMaterial")
    emitf = ntf.nodes.new("ShaderNodeEmission")
    lwf = ntf.nodes.new("ShaderNodeLayerWeight")
    lwf.inputs["Blend"].default_value = 0.45
    rampf = ntf.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampf.color_ramp,
        [
            (0.0, (1.0, 0.97, 0.86, 1.0)),
            (0.55, (1.0, 0.78, 0.28, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntf.links.new(lwf.outputs["Facing"], rampf.inputs["Fac"])
    ntf.links.new(rampf.outputs["Color"], emitf.inputs["Color"])
    emitf.inputs["Strength"].default_value = 5.5
    animated_nodes["diamond_flare_strength"] = emitf.inputs["Strength"]
    ntf.links.new(emitf.outputs["Emission"], outf.inputs["Surface"])
    flare.data.materials.append(mat_flare)

    # 4. Massive Floating Obsidian Ring (Deep Glossy Black Obsidian + Razor-Sharp Glowing Gold Veins)
    mat_obs = bpy.data.materials.new("sovereign_black_sun_obsidian_mat")
    mat_obs.use_nodes = True
    nto = mat_obs.node_tree
    nto.nodes.clear()
    outo = nto.nodes.new("ShaderNodeOutputMaterial")

    tco = nto.nodes.new("ShaderNodeTexCoord")
    noise_obs = nto.nodes.new("ShaderNodeTexNoise")
    noise_obs.inputs["Scale"].default_value = 3.5
    nto.links.new(tco.outputs["Object"], noise_obs.inputs["Vector"])

    mix_obs_vec = nto.nodes.new("ShaderNodeMixRGB")
    mix_obs_vec.inputs["Fac"].default_value = 0.28
    nto.links.new(tco.outputs["Object"], mix_obs_vec.inputs["Color1"])
    nto.links.new(noise_obs.outputs["Color"], mix_obs_vec.inputs["Color2"])

    voro = nto.nodes.new("ShaderNodeTexVoronoi")
    voro.voronoi_dimensions = "4D"
    voro.feature = "DISTANCE_TO_EDGE"
    voro.inputs["Scale"].default_value = 2.8
    voro.inputs["W"].default_value = 0.0
    nto.links.new(mix_obs_vec.outputs["Color"], voro.inputs["Vector"])
    animated_nodes["obsidian_vein_w"] = voro.inputs["W"]

    # Crisp kintsugi gold veins (0.0 -> 0.018), pure dark obsidian elsewhere (0.025 -> 1.0)
    rampo = nto.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampo.color_ramp,
        [
            (0.0, (1.0, 0.85, 0.25, 1.0)),
            (0.012, (0.88, 0.18, 0.04, 1.0)),
            (0.022, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nto.links.new(voro.outputs["Distance"], rampo.inputs["Fac"])

    emit_obs = build_pbr_lit_surface_nodes(
        nto,
        base_rgb=(0.005, 0.003, 0.008),
        gold_rim_rgb=(0.75, 0.48, 0.12),
        lava_up_rgb=(0.32, 0.04, 0.02),
        bump_height_socket=voro.outputs["Distance"],
        bump_strength=0.65,
        extra_emit_socket=rampo.outputs["Color"],
        rim_blend=0.82,
        spec_power=1.15,
    )
    animated_nodes["obsidian_vein_strength"] = emit_obs.inputs["Strength"]
    nto.links.new(emit_obs.outputs["Emission"], outo.inputs["Surface"])

    ring_rig = bpy.data.objects.new("sovereign_black_sun_ring_rig", None)
    bpy.context.collection.objects.link(ring_rig)
    ring_rig.location = sun_center
    ring_rig.rotation_euler = Euler((math.radians(64.0), math.radians(-18.0), math.radians(14.0)), "XYZ")

    ring_spin_pivot = bpy.data.objects.new("sovereign_black_sun_ring_spin_pivot", None)
    bpy.context.collection.objects.link(ring_spin_pivot)
    ring_spin_pivot.parent = ring_rig

    bpy.ops.mesh.primitive_torus_add(
        major_radius=2.48,
        minor_radius=0.23,
        major_segments=96,
        minor_segments=12,
        location=(0, 0, 0),
    )
    ring_mesh = bpy.context.active_object
    ring_mesh.name = "sovereign_black_sun_obsidian_ring"
    ring_mesh.scale = (1.0, 1.0, 0.65)
    ring_mesh.parent = ring_spin_pivot
    bev = ring_mesh.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.025
    bev.segments = 2
    for p in ring_mesh.data.polygons:
        p.use_smooth = True
    ring_mesh.data.materials.append(mat_obs)

    # 8 Architectural Clasps around the ring
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2.0
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(math.cos(ang) * 2.48, math.sin(ang) * 2.48, 0.0),
            rotation=(0.0, 0.0, ang),
        )
        clasp = bpy.context.active_object
        clasp.name = f"sovereign_black_sun_clasp_{i:02d}"
        clasp.scale = (0.22, 0.38, 0.30)
        clasp.parent = ring_spin_pivot
        bvc = clasp.modifiers.new("Bevel", "BEVEL")
        bvc.width = 0.025
        bvc.segments = 2
        clasp.data.materials.append(mat_obs)

    # 14 Orbiting Monolith Slabs
    slab_rig = bpy.data.objects.new("sovereign_black_sun_slab_rig", None)
    bpy.context.collection.objects.link(slab_rig)
    slab_rig.location = sun_center
    slab_rig.rotation_euler = Euler((math.radians(64.0), math.radians(-18.0), math.radians(14.0)), "XYZ")

    rng = random.Random(77123)
    slabs = []
    for i in range(14):
        ang = (i / 14.0) * math.pi * 2.0
        rad = 3.05 + (i % 3) * 0.25
        z_off = ((i % 5) - 2) * 0.14
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(math.cos(ang) * rad, math.sin(ang) * rad, z_off),
            rotation=(rng.uniform(-0.4, 0.4), rng.uniform(-0.4, 0.4), ang),
        )
        slab = bpy.context.active_object
        slab.name = f"sovereign_black_sun_slab_{i:02d}"
        slab.scale = (0.30 + (i % 3) * 0.10, 0.14 + (i % 2) * 0.07, 0.055)
        slab.parent = slab_rig
        bvs = slab.modifiers.new("Bevel", "BEVEL")
        bvs.width = 0.016
        bvs.segments = 2
        slab.data.materials.append(mat_obs)
        slabs.append((slab, ang, rad, z_off, i * 0.6))

    return ring_rig, ring_spin_pivot, slab_rig, slabs


def build_sovereign_wyrm_materials(animated_nodes):
    """
    Builds high-contrast dark obsidian & molten-gold materials for the Sovereign dragon:
      1. Armored dark obsidian scales with Voronoi relief, gold corona rim & lava under-light
      2. Volcanic basalt crag rock with organic glowing lava fissures
      3. Dark crimson-obsidian wing membrane with organic glowing red vein network backlit by the eclipse
      4. Horns & dorsal spines (dark metallic obsidian bone with gold-lit ridges)
      5. Molten glowing eyes & roaring throat embers
      6. Organic billowing fire breath plume pouring upward and to the right toward the eclipse
    """
    # 1. Armored Dragon Scales Material (Deep dark obsidian scales + gold rim + crimson crevices)
    mat_scales = bpy.data.materials.new("sovereign_black_sun_scales_mat")
    mat_scales.use_nodes = True
    nt = mat_scales.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor_scale = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_scale.inputs["Scale"].default_value = 22.0
    nt.links.new(tc.outputs["Object"], vor_scale.inputs["Vector"])

    ramp_crevice = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_crevice.color_ramp,
        [
            (0.0, (0.28, 0.03, 0.01, 1.0)),
            (0.12, (0.015, 0.003, 0.005, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nt.links.new(vor_scale.outputs["Distance"], ramp_crevice.inputs["Fac"])

    emit_scales = build_pbr_lit_surface_nodes(
        nt,
        base_rgb=(0.007, 0.003, 0.006),
        gold_rim_rgb=(0.95, 0.64, 0.16),
        lava_up_rgb=(0.48, 0.06, 0.02),
        bump_height_socket=vor_scale.outputs["Distance"],
        bump_strength=0.85,
        extra_emit_socket=ramp_crevice.outputs["Color"],
        rim_blend=0.80,
        spec_power=1.25,
    )
    nt.links.new(emit_scales.outputs["Emission"], out.inputs["Surface"])

    # 2. Volcanic Crag Peak Material (Dark wet basalt + organic glowing lava fissures)
    mat_peak = bpy.data.materials.new("sovereign_black_sun_peak_mat")
    mat_peak.use_nodes = True
    ntp = mat_peak.node_tree
    ntp.nodes.clear()
    outp = ntp.nodes.new("ShaderNodeOutputMaterial")

    tcp = ntp.nodes.new("ShaderNodeTexCoord")
    noise_p = ntp.nodes.new("ShaderNodeTexNoise")
    noise_p.inputs["Scale"].default_value = 2.8
    noise_p.inputs["Detail"].default_value = 5.0
    ntp.links.new(tcp.outputs["Object"], noise_p.inputs["Vector"])

    mix_p = ntp.nodes.new("ShaderNodeMixRGB")
    mix_p.inputs["Fac"].default_value = 0.35
    ntp.links.new(tcp.outputs["Object"], mix_p.inputs["Color1"])
    ntp.links.new(noise_p.outputs["Color"], mix_p.inputs["Color2"])

    vorp = ntp.nodes.new("ShaderNodeTexVoronoi")
    vorp.feature = "DISTANCE_TO_EDGE"
    vorp.inputs["Scale"].default_value = 2.6
    ntp.links.new(mix_p.outputs["Color"], vorp.inputs["Vector"])

    rampp = ntp.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampp.color_ramp,
        [
            (0.0, (1.0, 0.38, 0.05, 1.0)),
            (0.012, (0.55, 0.05, 0.01, 1.0)),
            (0.022, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntp.links.new(vorp.outputs["Distance"], rampp.inputs["Fac"])

    emit_peak = build_pbr_lit_surface_nodes(
        ntp,
        base_rgb=(0.005, 0.003, 0.006),
        gold_rim_rgb=(0.42, 0.24, 0.08),
        lava_up_rgb=(0.42, 0.05, 0.02),
        bump_height_socket=noise_p.outputs["Fac"],
        bump_strength=0.75,
        extra_emit_socket=rampp.outputs["Color"],
        rim_blend=0.84,
        spec_power=0.65,
    )
    ntp.links.new(emit_peak.outputs["Emission"], outp.inputs["Surface"])

    # 3. Translucent Red-Veined Wing Membrane Material (Organic noise-warped glowing veins)
    mat_wing = bpy.data.materials.new("sovereign_black_sun_wing_membrane_mat")
    mat_wing.use_nodes = True
    ntw = mat_wing.node_tree
    ntw.nodes.clear()
    outw = ntw.nodes.new("ShaderNodeOutputMaterial")

    tcw = ntw.nodes.new("ShaderNodeTexCoord")
    noise_w = ntw.nodes.new("ShaderNodeTexNoise")
    noise_w.inputs["Scale"].default_value = 4.5
    noise_w.inputs["Detail"].default_value = 4.0
    ntw.links.new(tcw.outputs["Object"], noise_w.inputs["Vector"])

    mix_w = ntw.nodes.new("ShaderNodeMixRGB")
    mix_w.inputs["Fac"].default_value = 0.32
    ntw.links.new(tcw.outputs["Object"], mix_w.inputs["Color1"])
    ntw.links.new(noise_w.outputs["Color"], mix_w.inputs["Color2"])

    vorw = ntw.nodes.new("ShaderNodeTexVoronoi")
    vorw.feature = "DISTANCE_TO_EDGE"
    vorw.inputs["Scale"].default_value = 8.5
    ntw.links.new(mix_w.outputs["Color"], vorw.inputs["Vector"])

    rampw = ntw.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampw.color_ramp,
        [
            (0.0, (0.95, 0.28, 0.05, 1.0)),
            (0.015, (0.58, 0.04, 0.03, 1.0)),
            (0.035, (0.08, 0.006, 0.010, 1.0)),
            (1.0, (0.015, 0.002, 0.004, 1.0)),
        ],
    )
    ntw.links.new(vorw.outputs["Distance"], rampw.inputs["Fac"])

    emit_wing = build_pbr_lit_surface_nodes(
        ntw,
        base_rgb=(0.012, 0.002, 0.004),
        gold_rim_rgb=(0.72, 0.36, 0.09),
        lava_up_rgb=(0.35, 0.04, 0.02),
        bump_height_socket=vorw.outputs["Distance"],
        bump_strength=0.45,
        extra_emit_socket=rampw.outputs["Color"],
        rim_blend=0.78,
        spec_power=0.65,
    )
    animated_nodes["wing_vein_strength"] = emit_wing.inputs["Strength"]
    ntw.links.new(emit_wing.outputs["Emission"], outw.inputs["Surface"])

    # 4. Horns & Dorsal Spines Material
    mat_horn = bpy.data.materials.new("sovereign_black_sun_horn_mat")
    mat_horn.use_nodes = True
    nth = mat_horn.node_tree
    nth.nodes.clear()
    outh = nth.nodes.new("ShaderNodeOutputMaterial")
    emit_horn = build_pbr_lit_surface_nodes(
        nth,
        base_rgb=(0.010, 0.006, 0.005),
        gold_rim_rgb=(1.0, 0.78, 0.24),
        lava_up_rgb=(0.38, 0.08, 0.02),
        bump_height_socket=None,
        rim_blend=0.72,
        spec_power=1.35,
    )
    nth.links.new(emit_horn.outputs["Emission"], outh.inputs["Surface"])

    # 5. Molten Glowing Eyes & Roaring Throat Embers Material
    mat_maw = bpy.data.materials.new("sovereign_black_sun_molten_maw_mat")
    mat_maw.use_nodes = True
    ntm = mat_maw.node_tree
    ntm.nodes.clear()
    outm = ntm.nodes.new("ShaderNodeOutputMaterial")
    emitm = ntm.nodes.new("ShaderNodeEmission")
    emitm.inputs["Color"].default_value = (1.0, 0.76, 0.20, 1.0)
    emitm.inputs["Strength"].default_value = 3.5
    ntm.links.new(emitm.outputs["Emission"], outm.inputs["Surface"])

    # 6. Organic Billowing Fire Breath Material (Smooth deterministic Fresnel edge-fade + 4D noise turbulence)
    mat_fire = bpy.data.materials.new("sovereign_black_sun_fire_breath_mat")
    mat_fire.use_nodes = True
    ntf = mat_fire.node_tree
    ntf.nodes.clear()
    outf = ntf.nodes.new("ShaderNodeOutputMaterial")
    emitf = ntf.nodes.new("ShaderNodeEmission")
    emitf.inputs["Strength"].default_value = 2.8
    animated_nodes["fire_breath_strength"] = emitf.inputs["Strength"]

    tcf = ntf.nodes.new("ShaderNodeTexCoord")
    mapf = ntf.nodes.new("ShaderNodeMapping")
    ntf.links.new(tcf.outputs["Generated"], mapf.inputs["Vector"])
    animated_nodes["fire_mapping_loc"] = mapf.inputs["Location"]

    noisef = ntf.nodes.new("ShaderNodeTexNoise")
    noisef.noise_dimensions = "4D"
    noisef.inputs["Scale"].default_value = 4.2
    noisef.inputs["Detail"].default_value = 3.5
    noisef.inputs["Roughness"].default_value = 0.65
    noisef.inputs["W"].default_value = 0.0
    ntf.links.new(mapf.outputs["Vector"], noisef.inputs["Vector"])
    animated_nodes["fire_noise_w"] = noisef.inputs["W"]

    # Smooth Fresnel edge-fade so fire puffs have soft organic edges with zero stochastic noise
    lw_fire = ntf.nodes.new("ShaderNodeLayerWeight")
    lw_fire.inputs["Blend"].default_value = 0.48
    inv_fresnel = ntf.nodes.new("ShaderNodeMapRange")
    inv_fresnel.interpolation_type = "SMOOTHSTEP"
    inv_fresnel.inputs["From Min"].default_value = 0.0
    inv_fresnel.inputs["From Max"].default_value = 0.88
    inv_fresnel.inputs["To Min"].default_value = 1.0
    inv_fresnel.inputs["To Max"].default_value = 0.02
    ntf.links.new(lw_fire.outputs["Facing"], inv_fresnel.inputs["Value"])

    mul_fire_density = ntf.nodes.new("ShaderNodeMath")
    mul_fire_density.operation = "MULTIPLY"
    ntf.links.new(noisef.outputs["Fac"], mul_fire_density.inputs[0])
    ntf.links.new(inv_fresnel.outputs["Result"], mul_fire_density.inputs[1])

    rampf = ntf.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampf.color_ramp,
        [
            (0.0, (0.004, 0.001, 0.004, 1.0)),
            (0.18, (0.48, 0.03, 0.015, 1.0)),
            (0.36, (0.95, 0.28, 0.04, 1.0)),
            (0.55, (1.0, 0.68, 0.14, 1.0)),
            (0.75, (1.0, 0.94, 0.62, 1.0)),
        ],
    )
    ntf.links.new(mul_fire_density.outputs["Value"], rampf.inputs["Fac"])
    ntf.links.new(rampf.outputs["Color"], emitf.inputs["Color"])
    ntf.links.new(emitf.outputs["Emission"], outf.inputs["Surface"])

    return mat_scales, mat_peak, mat_wing, mat_horn, mat_maw, mat_fire


def create_volcanic_peak_and_sovereign_wyrm(animated_nodes):
    """
    Builds the jagged volcanic peak in the lower right-center foreground and the
    colossal winged Sovereign dragon perched atop it, roaring up-right toward the black sun.
    """
    mat_scales, mat_peak, mat_wing, mat_horn, mat_maw, mat_fire = build_sovereign_wyrm_materials(animated_nodes)

    # ─── 1. JAGGED VOLCANIC PEAK WITH LAVA FISSURES (Lower Right-Center) ────────
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=1.55, radius2=0.34, depth=2.15, location=(0.68, 2.75, -1.85))
    peak = bpy.context.active_object
    peak.name = "sovereign_black_sun_volcanic_peak"
    peak.scale = (1.28, 0.95, 1.08)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bm = bmesh.new()
    bm.from_mesh(peak.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2, use_grid_fill=True)
    rng = random.Random(90125)
    for v in bm.verts:
        ang = math.atan2(v.co.y, v.co.x)
        r = math.hypot(v.co.x, v.co.y)
        crag = math.sin(ang * 5.0) * 0.22 + math.cos(ang * 9.0 + v.co.z * 2.5) * 0.14
        v.co.x += math.cos(ang) * crag * r
        v.co.y += math.sin(ang) * crag * r
        v.co.z += rng.uniform(-0.05, 0.08)
    bm.to_mesh(peak.data)
    bm.free()
    for p in peak.data.polygons:
        p.use_smooth = True
    peak.data.materials.append(mat_peak)

    # ─── 2. SOVEREIGN WYRM RIG HIERARCHY ────────────────────────────────────────
    wyrm_root = bpy.data.objects.new("sovereign_black_sun_wyrm_root", None)
    bpy.context.collection.objects.link(wyrm_root)
    wyrm_root.location = Vector((0.62, 2.55, -0.78))

    chest_pivot = bpy.data.objects.new("sovereign_black_sun_chest_pivot", None)
    bpy.context.collection.objects.link(chest_pivot)
    chest_pivot.parent = wyrm_root
    chest_pivot.location = Vector((0.0, 0.0, 0.0))

    spine_pts = [
        (Vector((-0.22, 0.14, -0.32)), 0.34),
        (Vector((-0.12, 0.08, -0.04)), 0.39),
        (Vector((-0.02, 0.02, 0.24)), 0.35),
        (Vector((0.10, -0.02, 0.50)), 0.27),
        (Vector((0.22, -0.05, 0.74)), 0.22),
        (Vector((0.36, -0.07, 0.95)), 0.18),
    ]
    for idx, (pt, rad) in enumerate(spine_pts):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=rad, location=pt)
        seg = bpy.context.active_object
        seg.name = f"sovereign_black_sun_torso_seg_{idx:02d}"
        seg.scale = (1.12, 0.90, 1.25)
        seg.rotation_euler = (0.10, 0.36, 0.0)
        seg.parent = chest_pivot
        for p in seg.data.polygons:
            p.use_smooth = True
        seg.data.materials.append(mat_scales)

        bpy.ops.mesh.primitive_cone_add(
            vertices=8,
            radius1=rad * 0.24,
            radius2=0.008,
            depth=rad * 1.18,
            location=pt + Vector((-0.20 * rad, 0.12 * rad, 0.18 * rad)),
            rotation=(0.15, -0.82, 0.1),
        )
        sp = bpy.context.active_object
        sp.name = f"sovereign_black_sun_dorsal_spine_{idx:02d}"
        sp.parent = chest_pivot
        sp.data.materials.append(mat_horn)

    # ─── 3. ROARING DRAGON HEAD AIMED UPWARD-RIGHT TOWARD THE BLACK SUN ─────────
    head_pivot = bpy.data.objects.new("sovereign_black_sun_head_pivot", None)
    bpy.context.collection.objects.link(head_pivot)
    head_pivot.parent = chest_pivot
    head_pivot.location = Vector((0.44, -0.08, 1.06))
    head_pivot.rotation_euler = Euler((math.radians(-10.0), math.radians(-26.0), math.radians(-16.0)), "XYZ")

    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=0.21,
        radius2=0.075,
        depth=0.54,
        location=(0.18, 0.0, 0.11),
        rotation=(0.0, math.radians(60.0), 0.0),
    )
    skull = bpy.context.active_object
    skull.name = "sovereign_black_sun_upper_skull"
    skull.scale = (1.0, 0.80, 0.70)
    skull.parent = head_pivot
    for p in skull.data.polygons:
        p.use_smooth = True
    skull.data.materials.append(mat_scales)

    bpy.ops.mesh.primitive_cone_add(
        vertices=14,
        radius1=0.16,
        radius2=0.058,
        depth=0.46,
        location=(0.15, 0.0, -0.08),
        rotation=(0.0, math.radians(104.0), 0.0),
    )
    jaw = bpy.context.active_object
    jaw.name = "sovereign_black_sun_lower_jaw"
    jaw.scale = (1.0, 0.70, 0.54)
    jaw.parent = head_pivot
    for p in jaw.data.polygons:
        p.use_smooth = True
    jaw.data.materials.append(mat_scales)

    for side in (-1.0, 1.0):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12,
            ring_count=8,
            radius=0.034,
            location=(0.10, side * 0.105, 0.15),
        )
        eye = bpy.context.active_object
        eye.name = f"sovereign_black_sun_eye_{'L' if side < 0 else 'R'}"
        eye.scale = (1.4, 0.6, 0.8)
        eye.parent = head_pivot
        eye.data.materials.append(mat_maw)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.095, location=(0.15, 0.0, 0.015))
    throat = bpy.context.active_object
    throat.name = "sovereign_black_sun_throat_core"
    throat.scale = (1.35, 0.72, 0.82)
    throat.parent = head_pivot
    throat.data.materials.append(mat_maw)

    for side in (-1.0, 1.0):
        for tier, (len_h, rad_h, pitch_h, yaw_h) in enumerate(((0.66, 0.052, -118.0, 22.0), (0.44, 0.036, -105.0, 36.0))):
            bpy.ops.mesh.primitive_cone_add(
                vertices=10,
                radius1=rad_h,
                radius2=0.005,
                depth=len_h,
                location=(-0.08, side * (0.10 + tier * 0.05), 0.21 - tier * 0.05),
                rotation=(math.radians(side * yaw_h), math.radians(pitch_h), 0.0),
            )
            horn = bpy.context.active_object
            horn.name = f"sovereign_black_sun_crown_horn_{'L' if side < 0 else 'R'}_{tier}"
            horn.parent = head_pivot
            horn.data.materials.append(mat_horn)

    # ─── 4. ORGANIC BILLOWING FIRE BREATH STREAM POURING UPWARD & TO THE RIGHT ──
    fire_piv = bpy.data.objects.new("sovereign_black_sun_fire_pivot", None)
    bpy.context.collection.objects.link(fire_piv)
    fire_piv.parent = head_pivot
    fire_piv.location = Vector((0.32, 0.0, 0.03))
    fire_piv.rotation_euler = Euler((math.radians(-10.0), math.radians(52.0), math.radians(-12.0)), "XYZ")

    # Chain of 9 overlapping organic flame puffs expanding upward-right toward the eclipse
    rng_f = random.Random(88421)
    for p_idx in range(9):
        t_f = p_idx / 8.0
        z_f = 0.14 + t_f * 1.48
        rad_f = 0.065 + (t_f ** 1.15) * 0.32
        off_x = math.sin(t_f * 4.5) * 0.045
        off_y = math.cos(t_f * 3.8) * 0.035
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=14,
            radius=rad_f,
            location=(off_x, off_y, z_f),
        )
        puff = bpy.context.active_object
        puff.name = f"sovereign_black_sun_fire_puff_{p_idx:02d}"
        puff.scale = (1.05, 0.88, 1.45)
        puff.rotation_euler = (rng_f.uniform(-0.3, 0.3), rng_f.uniform(-0.3, 0.3), p_idx * 0.7)
        puff.parent = fire_piv
        for p in puff.data.polygons:
            p.use_smooth = True
        puff.data.materials.append(mat_fire)

    # ─── 5. ARTICULATED HALF-SPREAD WINGS FRAMING THE ECLIPSE ───────────────────
    wings_data = []
    for side_idx, side in enumerate((-1.0, 1.0)):
        wing_shoulder = bpy.data.objects.new(f"sovereign_black_sun_wing_shoulder_{side_idx}", None)
        bpy.context.collection.objects.link(wing_shoulder)
        wing_shoulder.parent = chest_pivot
        wing_shoulder.location = Vector((0.08 if side < 0 else 0.28, side * 0.22, 0.62))
        # Spread both left and right wings in camera view so they frame the roaring dragon & eclipse
        if side < 0:
            base_rot = Euler((math.radians(-12.0), math.radians(-16.0), math.radians(-28.0)), "XYZ")
        else:
            base_rot = Euler((math.radians(8.0), math.radians(18.0), math.radians(-15.0)), "XYZ")
        wing_shoulder.rotation_euler = base_rot

        arm_end = Vector((-0.42 if side < 0 else 0.58, side * 0.62, 0.64))
        arm_mid = arm_end * 0.5
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=12,
            radius=0.048,
            depth=arm_end.length,
            location=arm_mid,
        )
        arm_mesh = bpy.context.active_object
        arm_mesh.name = f"sovereign_black_sun_wing_arm_{side_idx}"
        arm_mesh.rotation_mode = "QUATERNION"
        arm_mesh.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(arm_end.normalized())
        arm_mesh.parent = wing_shoulder
        arm_mesh.data.materials.append(mat_scales)

        wing_wrist = bpy.data.objects.new(f"sovereign_black_sun_wing_wrist_{side_idx}", None)
        bpy.context.collection.objects.link(wing_wrist)
        wing_wrist.parent = wing_shoulder
        wing_wrist.location = arm_end

        bpy.ops.mesh.primitive_cone_add(
            vertices=8,
            radius1=0.04,
            radius2=0.005,
            depth=0.24,
            location=(0.0, 0.0, 0.12),
        )
        claw = bpy.context.active_object
        claw.name = f"sovereign_black_sun_wing_claw_{side_idx}"
        claw.parent = wing_wrist
        claw.data.materials.append(mat_horn)

        finger_tips = [
            Vector((-0.92 if side < 0 else 1.12, side * 0.65, 0.72)),
            Vector((-1.14 if side < 0 else 1.34, side * 0.52, 0.24)),
            Vector((-1.02 if side < 0 else 1.22, side * 0.38, -0.24)),
            Vector((-0.74 if side < 0 else 0.88, side * 0.26, -0.62)),
            Vector((-0.36 if side < 0 else 0.45, side * 0.14, -0.84)),
        ]
        for f_i, tip in enumerate(finger_tips):
            bpy.ops.mesh.primitive_cone_add(
                vertices=8,
                radius1=0.028,
                radius2=0.005,
                depth=tip.length,
                location=tip * 0.5,
            )
            f_bone = bpy.context.active_object
            f_bone.name = f"sovereign_black_sun_wing_finger_{side_idx}_{f_i}"
            f_bone.rotation_mode = "QUATERNION"
            f_bone.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(tip.normalized())
            f_bone.parent = wing_wrist
            f_bone.data.materials.append(mat_horn)

        mem_mesh_data = bpy.data.meshes.new(f"sovereign_black_sun_wing_mem_data_{side_idx}")
        bm_w = bmesh.new()
        v_origin = bm_w.verts.new((0.0, 0.0, 0.0))
        v_root_body = bm_w.verts.new((-arm_end.x, -arm_end.y * 0.7, -arm_end.z - 0.48))
        v_tips = [bm_w.verts.new(t) for t in finger_tips]
        for k in range(len(v_tips) - 1):
            bm_w.faces.new((v_origin, v_tips[k], v_tips[k + 1]))
        bm_w.faces.new((v_origin, v_tips[-1], v_root_body))
        bmesh.ops.subdivide_edges(bm_w, edges=bm_w.edges[:], cuts=4, use_grid_fill=True)
        bm_w.to_mesh(mem_mesh_data)
        bm_w.free()

        mem_obj = bpy.data.objects.new(f"sovereign_black_sun_wing_membrane_{side_idx}", mem_mesh_data)
        bpy.context.collection.objects.link(mem_obj)
        mem_obj.parent = wing_wrist
        sol = mem_obj.modifiers.new("Solidify", "SOLIDIFY")
        sol.thickness = 0.012
        for p in mem_obj.data.polygons:
            p.use_smooth = True
        mem_obj.data.materials.append(mat_wing)

        wings_data.append((wing_shoulder, wing_wrist, base_rot, side))

    # ─── 6. CURLING ARMORED TAIL WITH TRAVELING SINE-WAVE SWAY ──────────────────
    tail_segments = []
    num_tail = 14
    for t_i in range(num_tail):
        frac = t_i / float(num_tail - 1)
        ang_t = frac * math.pi * 1.35 + 0.4
        rad_t = 0.50 + frac * 0.50
        loc_t = Vector((
            math.cos(ang_t) * rad_t - 0.14,
            math.sin(ang_t) * rad_t * 0.65,
            -0.38 - frac * 0.95,
        ))
        seg_rad = 0.22 * (1.0 - frac * 0.78)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=seg_rad, location=loc_t)
        t_seg = bpy.context.active_object
        t_seg.name = f"sovereign_black_sun_tail_seg_{t_i:02d}"
        t_seg.scale = (1.2, 0.95, 1.35)
        t_seg.parent = wyrm_root
        for p in t_seg.data.polygons:
            p.use_smooth = True
        t_seg.data.materials.append(mat_scales)
        tail_segments.append((t_seg, loc_t, frac))

    return wyrm_root, chest_pivot, head_pivot, fire_piv, wings_data, tail_segments


def create_forked_lightning_bolts():
    """
    Creates two distant forked crimson-gold lightning bolts that flash twice per loop
    at fixed frames (frames 46 and 126) and remain completely off at frames 0 and 179.
    """
    bolts = []
    rng = random.Random(55109)
    for b_idx, base_x in enumerate((3.35, 0.55)):
        curve_data = bpy.data.curves.new(f"sovereign_black_sun_lightning_curve_{b_idx}", type="CURVE")
        curve_data.dimensions = "3D"
        curve_data.bevel_depth = 0.022

        for f_idx in range(3):
            spline = curve_data.splines.new("POLY")
            pts = 9 if f_idx == 0 else 5
            spline.points.add(pts - 1)
            cur = Vector((base_x + f_idx * 0.20, 11.5, 2.5 - f_idx * 0.55))
            for p_i in range(pts):
                spline.points[p_i].co = (cur.x, cur.y, cur.z, 1.0)
                spline.points[p_i].radius = max(0.2, 1.0 - p_i / float(pts))
                cur += Vector((rng.uniform(-0.28, 0.28), rng.uniform(-0.08, 0.08), -0.36))

        bolt_obj = bpy.data.objects.new(f"sovereign_black_sun_lightning_{b_idx}", curve_data)
        bpy.context.collection.objects.link(bolt_obj)

        mat_b = bpy.data.materials.new(f"sovereign_black_sun_lightning_mat_{b_idx}")
        mat_b.use_nodes = True
        nt = mat_b.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = (1.0, 0.78, 0.36, 1.0) if b_idx == 0 else (1.0, 0.32, 0.18, 1.0)
        emit.inputs["Strength"].default_value = 0.0
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        bolt_obj.data.materials.append(mat_b)
        bolts.append((bolt_obj, emit.inputs["Strength"]))

    return bolts


def create_depth_of_field_embers():
    """
    Creates 3D embers, ash flakes and molten debris organized into 3 depth-of-field
    cloud groups with soft Fresnel bokeh edges, avoiding the Black Sun interior disk.
    """
    def make_bokeh_ember_mat(name, col_rgba, strength):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Strength"].default_value = strength

        lw = nt.nodes.new("ShaderNodeLayerWeight")
        lw.inputs["Blend"].default_value = 0.45
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        set_color_ramp_stops(
            ramp.color_ramp,
            [
                (0.0, (1.0, 0.96, 0.82, 1.0)),
                (0.45, col_rgba),
                (0.88, (0.01, 0.002, 0.004, 1.0)),
                (1.0, (0.002, 0.001, 0.004, 1.0)),
            ],
        )
        nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        return mat

    mat_ember_gold = make_bokeh_ember_mat("sovereign_black_sun_ember_gold", (1.0, 0.72, 0.22, 1.0), 2.4)
    mat_ember_crimson = make_bokeh_ember_mat("sovereign_black_sun_ember_crimson", (0.95, 0.20, 0.08, 1.0), 1.8)

    rng = random.Random(314159)
    ember_groups = []

    for g_idx, (num_pts, y_min, y_max, base_rad, mat_use) in enumerate(
        (
            (85, -2.2, 1.2, 0.026, mat_ember_crimson),   # Foreground bokeh embers
            (180, 1.5, 6.5, 0.015, mat_ember_gold),      # Mid-plane sharp embers
            (150, 6.8, 12.0, 0.020, mat_ember_gold),     # Background embers
        )
    ):
        bm = bmesh.new()
        placed = 0
        while placed < num_pts:
            in_right = rng.random() > 0.10
            x0 = rng.uniform(-0.3, 4.4) if in_right else rng.uniform(-3.8, -0.5)
            y0 = rng.uniform(y_min, y_max)
            z0 = rng.uniform(-2.1, 2.5)
            # Keep the pitch-black Eclipse disk clear of foreground ember clutter
            if math.hypot(x0 - 1.55, z0 - 0.65) < 1.05:
                continue
            r_scale = base_rad * rng.uniform(0.55, 1.35)
            bmesh.ops.create_icosphere(
                bm,
                subdivisions=2,
                radius=r_scale,
                matrix=Matrix.Translation(Vector((x0, y0, z0))),
            )
            placed += 1
        mesh_data = bpy.data.meshes.new(f"sovereign_black_sun_ember_cloud_mesh_{g_idx}")
        bm.to_mesh(mesh_data)
        bm.free()
        for p in mesh_data.polygons:
            p.use_smooth = True

        cloud_obj = bpy.data.objects.new(f"sovereign_black_sun_ember_cloud_{g_idx}", mesh_data)
        bpy.context.collection.objects.link(cloud_obj)
        cloud_obj.data.materials.append(mat_use)
        ember_groups.append((cloud_obj, g_idx))

    return ember_groups


def setup_camera(scene):
    cam_data = bpy.data.cameras.new("sovereign_black_sun_camera")
    cam_data.lens = 36.0
    cam_data.sensor_width = 36.0
    cam_data.dof.use_dof = False

    cam_obj = bpy.data.objects.new("sovereign_black_sun_camera_obj", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj


def setup_compositor(scene):
    scene.use_nodes = True
    nt = scene.node_tree
    nt.nodes.clear()

    rl = nt.nodes.new("CompositorNodeRLayers")
    comp = nt.nodes.new("CompositorNodeComposite")

    glare_glow = nt.nodes.new("CompositorNodeGlare")
    glare_glow.glare_type = "FOG_GLOW"
    glare_glow.quality = "LOW"
    glare_glow.threshold = 1.05
    glare_glow.size = 6
    glare_glow.mix = -0.32
    nt.links.new(rl.outputs["Image"], glare_glow.inputs["Image"])

    cb = nt.nodes.new("CompositorNodeColorBalance")
    cb.correction_method = "LIFT_GAMMA_GAIN"
    cb.lift = (0.98, 0.95, 0.97)
    cb.gamma = (1.02, 0.99, 0.96)
    cb.gain = (1.06, 1.01, 0.94)
    nt.links.new(glare_glow.outputs["Image"], cb.inputs["Image"])

    nt.links.new(cb.outputs["Image"], comp.inputs["Image"])


def apply_frame_state(
    frame,
    total_frames,
    animated_nodes,
    ring_rig,
    ring_spin_pivot,
    slab_rig,
    slabs,
    wyrm_root,
    chest_pivot,
    head_pivot,
    fire_piv,
    wings_data,
    tail_segments,
    bolts,
    ember_groups,
    cam_obj,
):
    phase = float(frame) / float(total_frames)
    theta = phase * math.pi * 2.0
    theta_cyclic = theta - math.sin(theta)
    u_raw = (1.0 - math.cos(theta)) * 0.5
    u_smooth = u_raw * u_raw * (3.0 - 2.0 * u_raw)
    p_cos = 1.0 - 2.0 * u_smooth
    p_sin = math.sin(theta) * u_raw

    # 1. 4D Periodic Shader Noise Coordinates (mapped onto a closed circle so Frame 0 == Frame 180)
    animated_nodes["sky_noise_w"].default_value = (1.0 - p_cos) * 0.42
    animated_nodes["ray_noise_w"].default_value = p_sin * 0.55
    animated_nodes["obsidian_vein_w"].default_value = (1.0 - p_cos) * 0.35
    animated_nodes["obsidian_vein_strength"].default_value = 1.0 + 0.28 * (1.0 - p_cos) + 0.14 * p_sin
    animated_nodes["corona_strength"].default_value = 2.6 + 0.55 * (1.0 - p_cos) + 0.30 * p_sin
    animated_nodes["diamond_flare_strength"].default_value = 5.4 + 1.6 * (1.0 - p_cos)
    animated_nodes["mountain_lava_w"].default_value = (1.0 - p_cos) * 0.25
    animated_nodes["wing_vein_strength"].default_value = 1.0 + 0.25 * (1.0 - p_cos)

    # Fire breath periodic upward-right flow + 4D noise flicker (closed loop in Y/Z/W)
    animated_nodes["fire_noise_w"].default_value = (1.0 - p_cos) * 0.65
    animated_nodes["fire_breath_strength"].default_value = 2.6 + 0.85 * (1.0 - p_cos) + 0.45 * p_sin
    animated_nodes["fire_mapping_loc"].default_value = (
        0.0,
        0.38 * p_sin,
        -0.42 * (1.0 - p_cos),
    )

    # 2. Obsidian Ring & Orbiting Slabs (smooth rotation in tilted plane, exact return at frame 180)
    ring_rig.rotation_euler = Euler(
        (
            math.radians(64.0) + 0.055 * p_sin,
            math.radians(-18.0) + 0.045 * (1.0 - p_cos) * 0.5,
            math.radians(14.0),
        ),
        "XYZ",
    )
    ring_spin_pivot.rotation_euler = Euler((0.0, 0.0, theta_cyclic), "XYZ")

    slab_rig.rotation_euler = Euler(
        (
            math.radians(64.0) - 0.04 * p_sin,
            math.radians(-18.0) + 0.04 * (1.0 - p_cos) * 0.5,
            math.radians(14.0),
        ),
        "XYZ",
    )
    for slab, base_ang, rad, z_off, ph_off in slabs:
        ang = base_ang - theta_cyclic
        slab.location = Vector((
            math.cos(ang) * rad,
            math.sin(ang) * rad,
            z_off + math.sin(theta_cyclic + ph_off) * 0.09,
        ))
        slab.rotation_euler = Euler((theta_cyclic + ph_off, -theta_cyclic + ph_off * 0.5, ang), "XYZ")

    # 3. Colossal Sovereign Dragon Motion:
    flap_primary = (1.0 - p_cos) * 0.5
    flap_secondary = math.sin(theta - 0.55) * math.sin(theta * 0.5)

    breath = (1.0 - p_cos) * 0.045
    chest_pivot.scale = (1.0 + breath, 1.0 + breath * 0.8, 1.0 + breath * 0.5)
    chest_pivot.rotation_euler = Euler((0.04 * p_sin, 0.03 * (1.0 - p_cos) * 0.5, 0.035 * p_sin), "XYZ")

    head_pivot.rotation_euler = Euler(
        (
            math.radians(-10.0) - 0.06 * flap_primary,
            math.radians(-26.0) + 0.05 * p_sin,
            math.radians(-16.0) + 0.04 * p_sin,
        ),
        "XYZ",
    )

    for wing_shoulder, wing_wrist, base_rot, side in wings_data:
        wing_shoulder.rotation_euler = Euler(
            (
                base_rot.x + side * 0.28 * flap_primary,
                base_rot.y - 0.22 * flap_primary,
                base_rot.z + side * 0.34 * flap_primary,
            ),
            "XYZ",
        )
        wing_wrist.rotation_euler = Euler(
            (
                side * 0.24 * flap_secondary,
                -0.18 * flap_secondary,
                side * 0.26 * flap_secondary,
            ),
            "XYZ",
        )

    for t_seg, loc0, frac in tail_segments:
        wave = math.sin(theta_cyclic - frac * 3.2) * math.sin(theta * 0.5) * 0.18 * frac
        t_seg.location = loc0 + Vector((wave, wave * 0.6, math.sin(theta_cyclic - frac * 2.4) * math.sin(theta * 0.5) * 0.08 * frac))

    # 4. Forked Crimson-Gold Lightning (flashes twice per loop around frames 46 and 126, 0 at boundaries)
    flash_a = math.exp(-((frame - 46.0) ** 2) / 9.0) + 0.55 * math.exp(-((frame - 51.0) ** 2) / 5.0)
    flash_b = math.exp(-((frame - 126.0) ** 2) / 9.0) + 0.65 * math.exp(-((frame - 131.0) ** 2) / 5.0)
    bolts[0][1].default_value = 14.0 * flash_a if flash_a > 0.01 else 0.0
    bolts[1][1].default_value = 12.0 * flash_b if flash_b > 0.01 else 0.0

    # 5. Multi-depth Ember Clouds
    for cloud_obj, g_idx in ember_groups:
        mul = 1.0 + g_idx * 0.35
        cloud_obj.location = Vector((
            0.14 * p_sin * mul,
            0.08 * (1.0 - p_cos) * 0.5 * mul,
            0.22 * (1.0 - p_cos) * 0.5 * mul,
        ))
        cloud_obj.rotation_euler = Euler((0.03 * p_sin, 0.04 * (1.0 - p_cos) * 0.5, 0.06 * p_sin), "XYZ")

    # 6. Camera: slow ~3% push-in and slight drift that returns to exact start
    push_in = (1.0 - p_cos) * 0.5
    cam_pos = Vector((
        0.055 * p_sin,
        -5.85 * (1.0 - 0.03 * push_in),
        0.10 + 0.035 * (1.0 - p_cos) * 0.5,
    ))
    cam_target = Vector((0.38, 3.5, 0.18))
    cam_obj.location = cam_pos
    direction = (cam_target - cam_pos).normalized()
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def main():
    frame_start, frame_end, output_prefix, samples, res_x, res_y, save_blend = parse_args()
    out_dir = os.path.dirname(output_prefix)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    clear_scene()
    scene = bpy.context.scene
    setup_render_engine(scene, samples=samples, res_x=res_x, res_y=res_y)

    animated_nodes = {}
    build_world_sky(scene)
    create_sky_backdrop_plane(animated_nodes)
    create_distant_mountains_and_clouds(animated_nodes)
    ring_rig, ring_spin_pivot, slab_rig, slabs = create_eclipsed_black_sun_and_ring(animated_nodes)
    wyrm_root, chest_pivot, head_pivot, fire_piv, wings_data, tail_segments = (
        create_volcanic_peak_and_sovereign_wyrm(animated_nodes)
    )
    bolts = create_forked_lightning_bolts()
    ember_groups = create_depth_of_field_embers()
    cam_obj = setup_camera(scene)
    setup_compositor(scene)

    total_frames = 180
    scene.frame_set(0)

    apply_frame_state(
        0,
        total_frames,
        animated_nodes,
        ring_rig,
        ring_spin_pivot,
        slab_rig,
        slabs,
        wyrm_root,
        chest_pivot,
        head_pivot,
        fire_piv,
        wings_data,
        tail_segments,
        bolts,
        ember_groups,
        cam_obj,
    )
    if save_blend:
        os.makedirs(os.path.dirname(save_blend), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=save_blend)
        print(f"[sovereign_black_sun] Saved .blend source to {save_blend}")

    for f in range(frame_start, frame_end + 1):
        apply_frame_state(
            f,
            total_frames,
            animated_nodes,
            ring_rig,
            ring_spin_pivot,
            slab_rig,
            slabs,
            wyrm_root,
            chest_pivot,
            head_pivot,
            fire_piv,
            wings_data,
            tail_segments,
            bolts,
            ember_groups,
            cam_obj,
        )
        frame_path = f"{output_prefix}{f:04d}.png"
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"[sovereign_black_sun] Rendered frame {f}/{frame_end} -> {frame_path}", flush=True)


if __name__ == "__main__":
    main()
