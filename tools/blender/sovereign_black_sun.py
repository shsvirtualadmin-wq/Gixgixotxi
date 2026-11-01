#!/usr/bin/env python3
"""
Boardly Store — "Sovereign of the Black Sun" (id: sovereign-of-the-black-sun)
Procedural Blender 4.2 LTS Scene & 180-Frame Seamless Loop Generator
File: /tools/blender/sovereign_black_sun.py

Features:
- Real Cycles path-traced direct & indirect lighting with raytraced shadows (3 max bounces)
- 32 samples with adaptive sampling + OpenImageDenoise (OIDN) for noise-free glossy obsidian, scales & rim light
- Real Camera Depth of Field (f/2.0) for foreground/background ember bokeh
- Giant Black Sun in total eclipse (upper right-center) with thin gold corona & diamond-ring flare
- Floating bevelled glossy obsidian ring with kintsugi gold veins & 14 orbiting monolith slabs
- Colossal sculpted dragon on a lava-cracked volcanic peak (right-center foreground), wings half-spread
  framing the eclipse, head raised roaring up-right, billowing fire pouring UP and to the RIGHT
- Crimson & gold god rays, layered storm clouds, 2 forked lightning bolts (flashing twice per loop),
  starry sky with faint crimson nebula, calm dark left third for UI readability
- 180 frames at 30 fps (6.0s), 100% periodic 4D noise & cyclic transforms so frame 0 -> 179 loops seamlessly
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
    samples = 32
    res_x = 1200
    res_y = 675
    save_blend = "/app/applet/tools/blender/sovereign_black_sun.blend"
    skip_existing = True

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
        elif argv[i] == "--res" and i + 1 < len(argv):
            rparts = argv[i + 1].lower().split("x")
            res_x = int(rparts[0])
            res_y = int(rparts[1])
            i += 2
        elif argv[i] == "--save-blend" and i + 1 < len(argv):
            save_blend = argv[i + 1]
            i += 2
        elif argv[i] == "--force":
            skip_existing = False
            i += 1
        else:
            i += 1

    return frame_start, frame_end, output_prefix, samples, res_x, res_y, save_blend, skip_existing


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_render_engine(scene, samples=32, res_x=1200, res_y=675):
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

    # Real path-traced lighting with 3 bounces + Adaptive Sampling + OpenImageDenoise
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.22
    scene.cycles.adaptive_min_samples = 3
    scene.cycles.max_bounces = 3
    scene.cycles.diffuse_bounces = 1
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 1
    scene.cycles.volume_bounces = 0
    scene.cycles.transparent_max_bounces = 2
    scene.cycles.sample_clamp_direct = 8.0
    scene.cycles.sample_clamp_indirect = 3.0
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.seed = 42
    if hasattr(scene.cycles, "use_animated_seed"):
        scene.cycles.use_animated_seed = False
    if hasattr(scene.cycles, "use_light_tree"):
        scene.cycles.use_light_tree = False

    scene.cycles.use_denoising = True
    for denoiser in ("OPENIMAGEDENOISE", "OPTIX"):
        try:
            scene.cycles.denoiser = denoiser
            break
        except Exception:
            pass
    if hasattr(scene.cycles, "denoising_input_passes"):
        try:
            scene.cycles.denoising_input_passes = "RGB"
        except Exception:
            pass
    if hasattr(scene.cycles, "denoising_prefilter"):
        try:
            scene.cycles.denoising_prefilter = "FAST"
        except Exception:
            pass

    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.frame_start = 0
    scene.frame_end = 179
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
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
    scene.view_settings.exposure = 0.12
    scene.view_settings.gamma = 1.0


def set_color_ramp_stops(color_ramp, stops):
    while len(color_ramp.elements) > 1:
        color_ramp.elements.remove(color_ramp.elements[-1])
    color_ramp.elements[0].position = stops[0][0]
    color_ramp.elements[0].color = stops[0][1]
    for pos, col in stops[1:]:
        el = color_ramp.elements.new(pos)
        el.color = col


def build_lit_pbr_plus_emission_shader(
    nt,
    base_rgb,
    metallic=0.35,
    roughness=0.22,
    spec_ior_level=0.75,
    gold_rim_rgb=(1.0, 0.72, 0.22),
    lava_up_rgb=(0.68, 0.10, 0.03),
    bump_height_socket=None,
    bump_strength=0.45,
    bump_distance=0.03,
    extra_emit_socket=None,
    extra_emit_strength=1.0,
    rim_power=1.15,
):
    """
    Combines a real Principled BSDF (receiving direct Cycles lighting, shadows, and glossy reflections)
    with analytical grazing rim & lava uplight + emissive veins/fissures.
    """
    bump_node = None
    if bump_height_socket is not None:
        bump_node = nt.nodes.new("ShaderNodeBump")
        bump_node.inputs["Strength"].default_value = bump_strength
        bump_node.inputs["Distance"].default_value = bump_distance
        nt.links.new(bump_height_socket, bump_node.inputs["Height"])

    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*base_rgb, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = spec_ior_level
    if bump_node is not None:
        nt.links.new(bump_node.outputs["Normal"], bsdf.inputs["Normal"])

    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.34

    rim_ramp = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rim_ramp.color_ramp,
        [
            (0.0, (0.0, 0.0, 0.0, 1.0)),
            (0.46, (0.04 * rim_power, 0.015 * rim_power, 0.008 * rim_power, 1.0)),
            (0.76, (gold_rim_rgb[0] * 0.45 * rim_power, gold_rim_rgb[1] * 0.36 * rim_power, gold_rim_rgb[2] * 0.22 * rim_power, 1.0)),
            (0.95, (gold_rim_rgb[0] * 1.15 * rim_power, gold_rim_rgb[1] * 0.95 * rim_power, gold_rim_rgb[2] * 0.72 * rim_power, 1.0)),
        ],
    )
    nt.links.new(lw.outputs["Fresnel"], rim_ramp.inputs["Fac"])

    geom = nt.nodes.new("ShaderNodeNewGeometry")
    sep_n = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geom.outputs["Normal"], sep_n.inputs["Vector"])

    lava_map = nt.nodes.new("ShaderNodeMapRange")
    lava_map.interpolation_type = "SMOOTHSTEP"
    lava_map.inputs["From Min"].default_value = -0.15
    lava_map.inputs["From Max"].default_value = -0.85
    lava_map.inputs["To Min"].default_value = 0.0
    lava_map.inputs["To Max"].default_value = 0.45
    nt.links.new(sep_n.outputs["Z"], lava_map.inputs["Value"])

    mix_lava = nt.nodes.new("ShaderNodeMixRGB")
    mix_lava.blend_type = "ADD"
    mix_lava.inputs["Color2"].default_value = (*lava_up_rgb, 1.0)
    nt.links.new(lava_map.outputs["Result"], mix_lava.inputs["Fac"])
    nt.links.new(rim_ramp.outputs["Color"], mix_lava.inputs["Color1"])

    final_emit_color = mix_lava.outputs["Color"]
    if extra_emit_socket is not None:
        add_extra = nt.nodes.new("ShaderNodeMixRGB")
        add_extra.blend_type = "ADD"
        add_extra.inputs["Fac"].default_value = 1.0
        nt.links.new(final_emit_color, add_extra.inputs["Color1"])
        nt.links.new(extra_emit_socket, add_extra.inputs["Color2"])
        final_emit_color = add_extra.outputs["Color"]

    emit_node = nt.nodes.new("ShaderNodeEmission")
    emit_node.inputs["Strength"].default_value = extra_emit_strength
    nt.links.new(final_emit_color, emit_node.inputs["Color"])

    add_shader = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(bsdf.outputs["BSDF"], add_shader.inputs[0])
    nt.links.new(emit_node.outputs["Emission"], add_shader.inputs[1])
    return add_shader, emit_node


def build_world_sky(scene):
    world = bpy.data.worlds.new("sovereign_black_sun_world")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.008, 0.002, 0.005, 1.0)
    bg.inputs["Strength"].default_value = 0.55
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_scene_lights(animated_nodes):
    """
    Creates real Cycles shadow-casting lights:
      1. Eclipse Corona Key Light (Sun light casting sharp eclipse shadows across the dragon & obsidian ring)
      2. Grazing Gold Rim Light (Sun light accentuating the left/upper silhouettes of the dragon & ring)
      3. Molten Lava Uplight (Crimson-orange uplight from the volcanic chasm below)
      4. Roaring Dragonfire Point Light (Warm dynamic point light inside the fire breath plume)
      5. Lightning Storm Flash Light (Pulses during frames 46 & 126)
    """
    lights = {}

    # 1. Eclipse Corona Key Light (casts real raytraced shadows)
    key_data = bpy.data.lights.new("sovereign_black_sun_eclipse_key", type="SUN")
    key_data.energy = 4.2
    key_data.color = (1.0, 0.76, 0.34)
    key_data.angle = math.radians(3.5)
    key_obj = bpy.data.objects.new("sovereign_black_sun_eclipse_key_obj", key_data)
    bpy.context.collection.objects.link(key_obj)
    key_obj.rotation_euler = Euler((math.radians(52.0), math.radians(-22.0), math.radians(150.0)), "XYZ")
    lights["eclipse_key"] = key_data

    # 2. Grazing Gold Rim Light
    rim_data = bpy.data.lights.new("sovereign_black_sun_grazing_rim", type="SUN")
    rim_data.energy = 2.6
    rim_data.color = (1.0, 0.68, 0.24)
    rim_data.angle = math.radians(6.0)
    rim_obj = bpy.data.objects.new("sovereign_black_sun_grazing_rim_obj", rim_data)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.rotation_euler = Euler((math.radians(74.0), math.radians(18.0), math.radians(-145.0)), "XYZ")
    lights["grazing_rim"] = rim_data

    # 3. Volcanic Chasm Uplight
    lava_data = bpy.data.lights.new("sovereign_black_sun_lava_uplight", type="SUN")
    lava_data.energy = 1.65
    lava_data.color = (0.96, 0.18, 0.05)
    lava_data.angle = math.radians(18.0)
    lava_obj = bpy.data.objects.new("sovereign_black_sun_lava_uplight_obj", lava_data)
    bpy.context.collection.objects.link(lava_obj)
    lava_obj.rotation_euler = Euler((math.radians(-58.0), math.radians(10.0), math.radians(18.0)), "XYZ")
    lights["lava_uplight"] = lava_data

    # 4. Roaring Dragonfire Point Light (casts real warm shadows & specular highlights on jaws, horns & ring)
    fire_light_data = bpy.data.lights.new("sovereign_black_sun_fire_light", type="POINT")
    fire_light_data.energy = 240.0
    fire_light_data.color = (1.0, 0.54, 0.12)
    fire_light_data.shadow_soft_size = 0.35
    fire_light_obj = bpy.data.objects.new("sovereign_black_sun_fire_light_obj", fire_light_data)
    bpy.context.collection.objects.link(fire_light_obj)
    fire_light_obj.location = Vector((1.42, 2.25, 0.45))
    lights["fire_light"] = fire_light_data

    # 5. Storm Lightning Flash Light
    storm_data = bpy.data.lights.new("sovereign_black_sun_storm_flash", type="SUN")
    storm_data.energy = 0.0
    storm_data.color = (1.0, 0.82, 0.48)
    storm_data.angle = math.radians(8.0)
    storm_obj = bpy.data.objects.new("sovereign_black_sun_storm_flash_obj", storm_data)
    bpy.context.collection.objects.link(storm_obj)
    storm_obj.rotation_euler = Euler((math.radians(48.0), math.radians(-30.0), math.radians(135.0)), "XYZ")
    lights["storm_flash"] = storm_data

    return lights


def create_sky_backdrop_plane(animated_nodes):
    """
    Creates the distant storm-cloud, crimson-nebula, starfield, and radial god-ray backdrop plane.
    """
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 22.0, 0.4), rotation=(math.pi / 2, 0.0, 0.0))
    plane = bpy.context.active_object
    plane.name = "sovereign_black_sun_sky_backdrop"
    plane.scale = (34.0, 19.5, 1.0)
    plane.visible_shadow = False
    plane.visible_diffuse = False
    plane.visible_glossy = False

    mat = bpy.data.materials.new("sovereign_black_sun_sky_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.30

    tex_coord = nt.nodes.new("ShaderNodeTexCoord")
    sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tex_coord.outputs["Generated"], sep_xyz.inputs["Vector"])

    # Eclipse center in UV space: X = 0.595, Y = 0.605
    sub_x = nt.nodes.new("ShaderNodeMath")
    sub_x.operation = "SUBTRACT"
    sub_x.inputs[1].default_value = 0.595
    nt.links.new(sep_xyz.outputs["X"], sub_x.inputs[0])

    sub_y = nt.nodes.new("ShaderNodeMath")
    sub_y.operation = "SUBTRACT"
    sub_y.inputs[1].default_value = 0.605
    nt.links.new(sep_xyz.outputs["Y"], sub_y.inputs[0])

    comb_delta = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(sub_x.outputs["Value"], comb_delta.inputs["X"])
    nt.links.new(sub_y.outputs["Value"], comb_delta.inputs["Y"])

    vec_len = nt.nodes.new("ShaderNodeVectorMath")
    vec_len.operation = "LENGTH"
    nt.links.new(comb_delta.outputs["Vector"], vec_len.inputs["Vector"])

    vec_norm = nt.nodes.new("ShaderNodeVectorMath")
    vec_norm.operation = "NORMALIZE"
    nt.links.new(comb_delta.outputs["Vector"], vec_norm.inputs["Vector"])

    # Radial god-ray streaks emanating from the Black Sun
    noise_rays = nt.nodes.new("ShaderNodeTexNoise")
    noise_rays.noise_dimensions = "4D"
    noise_rays.inputs["Scale"].default_value = 16.0
    noise_rays.inputs["Detail"].default_value = 2.5
    noise_rays.inputs["Roughness"].default_value = 0.55
    noise_rays.inputs["W"].default_value = 0.0
    nt.links.new(vec_norm.outputs["Vector"], noise_rays.inputs["Vector"])
    animated_nodes["ray_noise_w"] = noise_rays.inputs["W"]

    # Layered storm clouds & crimson nebula (4D periodic)
    noise_clouds = nt.nodes.new("ShaderNodeTexNoise")
    noise_clouds.noise_dimensions = "4D"
    noise_clouds.inputs["Scale"].default_value = 3.4
    noise_clouds.inputs["Detail"].default_value = 3.2
    noise_clouds.inputs["Roughness"].default_value = 0.65
    noise_clouds.inputs["Distortion"].default_value = 0.30
    noise_clouds.inputs["W"].default_value = 0.0
    nt.links.new(comb_delta.outputs["Vector"], noise_clouds.inputs["Vector"])
    animated_nodes["sky_noise_w"] = noise_clouds.inputs["W"]

    # Radial falloff from eclipse center: exp(-dist * 1.95)
    mul_dist = nt.nodes.new("ShaderNodeMath")
    mul_dist.operation = "MULTIPLY"
    mul_dist.inputs[1].default_value = -1.95
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
    map_left.inputs["From Min"].default_value = 0.12
    map_left.inputs["From Max"].default_value = 0.46
    map_left.inputs["To Min"].default_value = 0.05
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
            (0.0, (0.002, 0.001, 0.004, 1.0)),
            (0.13, (0.08, 0.006, 0.015, 1.0)),
            (0.28, (0.54, 0.04, 0.055, 1.0)),
            (0.48, (0.95, 0.25, 0.06, 1.0)),
            (0.72, (1.0, 0.78, 0.26, 1.0)),
        ],
    )
    nt.links.new(mul_masked.outputs["Value"], ramp.inputs["Fac"])

    # Pinpoint starfield in deep space
    vor_stars = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_stars.inputs["Scale"].default_value = 165.0
    nt.links.new(tex_coord.outputs["Generated"], vor_stars.inputs["Vector"])

    star_thresh = nt.nodes.new("ShaderNodeMapRange")
    star_thresh.inputs["From Min"].default_value = 0.015
    star_thresh.inputs["From Max"].default_value = 0.0
    star_thresh.inputs["To Min"].default_value = 0.0
    star_thresh.inputs["To Max"].default_value = 0.45
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
    Distant silhouetted mountain range grounded below the bottom frame edge,
    with natural, sparse molten lava rivers in deep valleys (masked by noise and elevation).
    """
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=120, y_subdivisions=36, size=1.0, location=(2.2, 13.8, -3.45))
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
    noise_warp = nt.nodes.new("ShaderNodeTexNoise")
    noise_warp.inputs["Scale"].default_value = 2.6
    noise_warp.inputs["Detail"].default_value = 2.5
    noise_warp.inputs["Distortion"].default_value = 0.65
    nt.links.new(tc.outputs["Object"], noise_warp.inputs["Vector"])

    # Mask lava fissures by a low-frequency noise patch so only ~30% of valleys glow with lava
    noise_patch = nt.nodes.new("ShaderNodeTexNoise")
    noise_patch.inputs["Scale"].default_value = 0.95
    noise_patch.inputs["Detail"].default_value = 2.0
    nt.links.new(tc.outputs["Object"], noise_patch.inputs["Vector"])

    patch_mask = nt.nodes.new("ShaderNodeMapRange")
    patch_mask.interpolation_type = "SMOOTHSTEP"
    patch_mask.inputs["From Min"].default_value = 0.50
    patch_mask.inputs["From Max"].default_value = 0.72
    patch_mask.inputs["To Min"].default_value = 0.0
    patch_mask.inputs["To Max"].default_value = 1.0
    nt.links.new(noise_patch.outputs["Fac"], patch_mask.inputs["Value"])

    mix_vec = nt.nodes.new("ShaderNodeMixRGB")
    mix_vec.inputs["Fac"].default_value = 0.42
    nt.links.new(tc.outputs["Object"], mix_vec.inputs["Color1"])
    nt.links.new(noise_warp.outputs["Color"], mix_vec.inputs["Color2"])

    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.voronoi_dimensions = "4D"
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 1.55
    vor.inputs["W"].default_value = 0.0
    nt.links.new(mix_vec.outputs["Color"], vor.inputs["Vector"])
    animated_nodes["mountain_lava_w"] = vor.inputs["W"]

    ramp_lava = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_lava.color_ramp,
        [
            (0.0, (1.0, 0.38, 0.05, 1.0)),
            (0.006, (0.50, 0.04, 0.01, 1.0)),
            (0.012, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nt.links.new(vor.outputs["Distance"], ramp_lava.inputs["Fac"])

    masked_lava = nt.nodes.new("ShaderNodeMixRGB")
    masked_lava.blend_type = "MULTIPLY"
    masked_lava.inputs["Fac"].default_value = 1.0
    nt.links.new(ramp_lava.outputs["Color"], masked_lava.inputs["Color1"])
    nt.links.new(patch_mask.outputs["Result"], masked_lava.inputs["Color2"])

    shader_node, _ = build_lit_pbr_plus_emission_shader(
        nt,
        base_rgb=(0.010, 0.005, 0.008),
        metallic=0.15,
        roughness=0.45,
        spec_ior_level=0.50,
        gold_rim_rgb=(0.38, 0.16, 0.05),
        lava_up_rgb=(0.14, 0.02, 0.01),
        bump_height_socket=noise_warp.outputs["Fac"],
        bump_strength=0.65,
        bump_distance=0.08,
        extra_emit_socket=masked_lava.outputs["Color"],
        extra_emit_strength=0.95,
        rim_power=0.65,
    )
    nt.links.new(shader_node.outputs["Shader"], out.inputs["Surface"])
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
    corona_torus.visible_shadow = False
    corona_torus.visible_diffuse = False
    corona_torus.visible_glossy = False
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
            (0.0, (1.0, 0.86, 0.36, 1.0)),
            (0.42, (0.98, 0.45, 0.08, 1.0)),
            (0.75, (0.68, 0.06, 0.04, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntc.links.new(lwc.outputs["Facing"], rampc.inputs["Fac"])
    ntc.links.new(rampc.outputs["Color"], emitc.inputs["Color"])
    emitc.inputs["Strength"].default_value = 3.2
    animated_nodes["corona_strength"] = emitc.inputs["Strength"]
    ntc.links.new(emitc.outputs["Emission"], outc.inputs["Surface"])
    corona_torus.data.materials.append(mat_corona)

    # 2. Pitch-Black Total Eclipse Sun Sphere with Razor-Thin Gold Rim
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.48, location=sun_center)
    sun = bpy.context.active_object
    sun.name = "sovereign_black_sun_sphere"
    sun.visible_shadow = False
    sun.visible_diffuse = False
    sun.visible_glossy = False
    for p in sun.data.polygons:
        p.use_smooth = True

    mat_sun = bpy.data.materials.new("sovereign_black_sun_core_mat")
    mat_sun.use_nodes = True
    nt = mat_sun.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.88

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp.color_ramp,
        [
            (0.0, (0.0005, 0.0002, 0.001, 1.0)),
            (0.87, (0.001, 0.0005, 0.002, 1.0)),
            (0.945, (0.85, 0.14, 0.06, 1.0)),
            (0.988, (1.0, 0.88, 0.36, 1.0)),
        ],
    )
    nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 2.6
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    sun.data.materials.append(mat_sun)

    # 3. Bright Diamond-Ring Flare on Upper-Left Limb of the Eclipse
    flare_pos = sun_center + Vector((-1.06, -0.18, 1.04))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.16, location=flare_pos)
    flare = bpy.context.active_object
    flare.name = "sovereign_black_sun_diamond_flare"
    flare.scale = (1.35, 0.5, 1.35)
    flare.visible_shadow = False
    flare.visible_diffuse = False
    flare.visible_glossy = False
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
            (0.0, (1.0, 0.98, 0.90, 1.0)),
            (0.55, (1.0, 0.78, 0.28, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntf.links.new(lwf.outputs["Facing"], rampf.inputs["Fac"])
    ntf.links.new(rampf.outputs["Color"], emitf.inputs["Color"])
    emitf.inputs["Strength"].default_value = 7.5
    animated_nodes["diamond_flare_strength"] = emitf.inputs["Strength"]
    ntf.links.new(emitf.outputs["Emission"], outf.inputs["Surface"])
    flare.data.materials.append(mat_flare)

    # 4. Massive Floating Obsidian Ring (Glossy Black Volcanic Glass + Kintsugi Gold Veins)
    mat_obs = bpy.data.materials.new("sovereign_black_sun_obsidian_mat")
    mat_obs.use_nodes = True
    nto = mat_obs.node_tree
    nto.nodes.clear()
    outo = nto.nodes.new("ShaderNodeOutputMaterial")

    tco = nto.nodes.new("ShaderNodeTexCoord")
    noise_obs = nto.nodes.new("ShaderNodeTexNoise")
    noise_obs.inputs["Scale"].default_value = 3.8
    noise_obs.inputs["Detail"].default_value = 2.5
    noise_obs.inputs["Distortion"].default_value = 0.55
    nto.links.new(tco.outputs["Object"], noise_obs.inputs["Vector"])

    vein_patch = nto.nodes.new("ShaderNodeTexNoise")
    vein_patch.inputs["Scale"].default_value = 1.6
    vein_patch.inputs["Detail"].default_value = 2.0
    nto.links.new(tco.outputs["Object"], vein_patch.inputs["Vector"])

    vein_mask = nto.nodes.new("ShaderNodeMapRange")
    vein_mask.interpolation_type = "SMOOTHSTEP"
    vein_mask.inputs["From Min"].default_value = 0.30
    vein_mask.inputs["From Max"].default_value = 0.65
    vein_mask.inputs["To Min"].default_value = 0.25
    vein_mask.inputs["To Max"].default_value = 1.0
    nto.links.new(vein_patch.outputs["Fac"], vein_mask.inputs["Value"])

    mix_obs_vec = nto.nodes.new("ShaderNodeMixRGB")
    mix_obs_vec.inputs["Fac"].default_value = 0.34
    nto.links.new(tco.outputs["Object"], mix_obs_vec.inputs["Color1"])
    nto.links.new(noise_obs.outputs["Color"], mix_obs_vec.inputs["Color2"])

    voro = nto.nodes.new("ShaderNodeTexVoronoi")
    voro.voronoi_dimensions = "4D"
    voro.feature = "DISTANCE_TO_EDGE"
    voro.inputs["Scale"].default_value = 2.5
    voro.inputs["W"].default_value = 0.0
    nto.links.new(mix_obs_vec.outputs["Color"], voro.inputs["Vector"])
    animated_nodes["obsidian_vein_w"] = voro.inputs["W"]

    # Crisp kintsugi gold veins
    rampo = nto.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampo.color_ramp,
        [
            (0.0, (1.0, 0.85, 0.25, 1.0)),
            (0.011, (0.92, 0.22, 0.04, 1.0)),
            (0.020, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nto.links.new(voro.outputs["Distance"], rampo.inputs["Fac"])

    masked_vein = nto.nodes.new("ShaderNodeMixRGB")
    masked_vein.blend_type = "MULTIPLY"
    masked_vein.inputs["Fac"].default_value = 1.0
    nto.links.new(rampo.outputs["Color"], masked_vein.inputs["Color1"])
    nto.links.new(vein_mask.outputs["Result"], masked_vein.inputs["Color2"])

    shader_obs, emit_obs = build_lit_pbr_plus_emission_shader(
        nto,
        base_rgb=(0.012, 0.008, 0.016),
        metallic=0.48,
        roughness=0.14,
        spec_ior_level=0.88,
        gold_rim_rgb=(0.95, 0.62, 0.16),
        lava_up_rgb=(0.35, 0.04, 0.015),
        bump_height_socket=voro.outputs["Distance"],
        bump_strength=0.55,
        bump_distance=0.02,
        extra_emit_socket=masked_vein.outputs["Color"],
        extra_emit_strength=1.45,
        rim_power=1.30,
    )
    animated_nodes["obsidian_vein_strength"] = emit_obs.inputs["Strength"]
    nto.links.new(shader_obs.outputs["Shader"], outo.inputs["Surface"])

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
        major_segments=112,
        minor_segments=16,
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
        for p in clasp.data.polygons:
            p.use_smooth = True
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
        for p in slab.data.polygons:
            p.use_smooth = True
        slab.data.materials.append(mat_obs)
        slabs.append((slab, ang, rad, z_off, i * 0.6))

    return ring_rig, ring_spin_pivot, slab_rig, slabs


def build_sovereign_wyrm_materials(animated_nodes):
    """
    Builds physically lit PBR + Emissive materials for the Sovereign dragon:
      1. Armored dark obsidian scales with Voronoi normal relief, crisp golden rim & subtle magma inner glow
      2. Volcanic basalt crag rock with natural localized lava rivers (no vertical cone streaks)
      3. Dark crimson-obsidian wing membrane with subsurface glow & organic branching veins
      4. Horns, claws & dorsal spines (metallic obsidian bone with gold-lit ridges)
      5. Molten glowing eyes & roaring throat embers
      6. Billowing fire breath plume pouring upward and to the right
    """
    # 1. Armored Dragon Scales Material
    mat_scales = bpy.data.materials.new("sovereign_black_sun_scales_mat")
    mat_scales.use_nodes = True
    nt = mat_scales.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor_scale = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_scale.inputs["Scale"].default_value = 26.0
    nt.links.new(tc.outputs["Object"], vor_scale.inputs["Vector"])

    # Subtle glowing ember heat only in deep chest/neck scale crevices
    ramp_crevice = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_crevice.color_ramp,
        [
            (0.0, (0.32, 0.035, 0.01, 1.0)),
            (0.09, (0.018, 0.002, 0.004, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nt.links.new(vor_scale.outputs["Distance"], ramp_crevice.inputs["Fac"])

    shader_scales, _ = build_lit_pbr_plus_emission_shader(
        nt,
        base_rgb=(0.015, 0.009, 0.014),
        metallic=0.45,
        roughness=0.22,
        spec_ior_level=0.82,
        gold_rim_rgb=(1.0, 0.68, 0.18),
        lava_up_rgb=(0.55, 0.07, 0.02),
        bump_height_socket=vor_scale.outputs["Distance"],
        bump_strength=0.72,
        bump_distance=0.025,
        extra_emit_socket=ramp_crevice.outputs["Color"],
        extra_emit_strength=1.0,
        rim_power=1.25,
    )
    nt.links.new(shader_scales.outputs["Shader"], out.inputs["Surface"])

    # 2. Volcanic Peak Crag Material (Organic Basalt + Sparse Lava Fissures)
    mat_peak = bpy.data.materials.new("sovereign_black_sun_peak_mat")
    mat_peak.use_nodes = True
    ntp = mat_peak.node_tree
    ntp.nodes.clear()
    outp = ntp.nodes.new("ShaderNodeOutputMaterial")

    tcp = ntp.nodes.new("ShaderNodeTexCoord")
    noise_rock = ntp.nodes.new("ShaderNodeTexNoise")
    noise_rock.inputs["Scale"].default_value = 3.2
    noise_rock.inputs["Detail"].default_value = 3.0
    noise_rock.inputs["Distortion"].default_value = 0.65
    ntp.links.new(tcp.outputs["Object"], noise_rock.inputs["Vector"])

    # Patch mask so lava fissures appear in natural rock cracks
    lava_patch = ntp.nodes.new("ShaderNodeTexNoise")
    lava_patch.inputs["Scale"].default_value = 1.4
    lava_patch.inputs["Detail"].default_value = 2.0
    ntp.links.new(tcp.outputs["Object"], lava_patch.inputs["Vector"])

    patch_range = ntp.nodes.new("ShaderNodeMapRange")
    patch_range.interpolation_type = "SMOOTHSTEP"
    patch_range.inputs["From Min"].default_value = 0.42
    patch_range.inputs["From Max"].default_value = 0.68
    patch_range.inputs["To Min"].default_value = 0.0
    patch_range.inputs["To Max"].default_value = 1.0
    ntp.links.new(lava_patch.outputs["Fac"], patch_range.inputs["Value"])

    mix_pvec = ntp.nodes.new("ShaderNodeMixRGB")
    mix_pvec.inputs["Fac"].default_value = 0.38
    ntp.links.new(tcp.outputs["Object"], mix_pvec.inputs["Color1"])
    ntp.links.new(noise_rock.outputs["Color"], mix_pvec.inputs["Color2"])

    vor_peak = ntp.nodes.new("ShaderNodeTexVoronoi")
    vor_peak.feature = "DISTANCE_TO_EDGE"
    vor_peak.inputs["Scale"].default_value = 2.4
    ntp.links.new(mix_pvec.outputs["Color"], vor_peak.inputs["Vector"])

    ramp_fissure = ntp.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_fissure.color_ramp,
        [
            (0.0, (1.0, 0.42, 0.06, 1.0)),
            (0.009, (0.62, 0.06, 0.015, 1.0)),
            (0.018, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntp.links.new(vor_peak.outputs["Distance"], ramp_fissure.inputs["Fac"])

    masked_fissure = ntp.nodes.new("ShaderNodeMixRGB")
    masked_fissure.blend_type = "MULTIPLY"
    masked_fissure.inputs["Fac"].default_value = 1.0
    ntp.links.new(ramp_fissure.outputs["Color"], masked_fissure.inputs["Color1"])
    ntp.links.new(patch_range.outputs["Result"], masked_fissure.inputs["Color2"])

    shader_peak, _ = build_lit_pbr_plus_emission_shader(
        ntp,
        base_rgb=(0.012, 0.007, 0.010),
        metallic=0.12,
        roughness=0.52,
        spec_ior_level=0.45,
        gold_rim_rgb=(0.65, 0.32, 0.10),
        lava_up_rgb=(0.35, 0.05, 0.015),
        bump_height_socket=noise_rock.outputs["Fac"],
        bump_strength=0.80,
        bump_distance=0.05,
        extra_emit_socket=masked_fissure.outputs["Color"],
        extra_emit_strength=1.1,
        rim_power=0.80,
    )
    ntp.links.new(shader_peak.outputs["Shader"], outp.inputs["Surface"])

    # 3. Wing Membrane Material (Dark Crimson-Obsidian Leather with Glowing Branching Blood/Magma Veins)
    mat_wing = bpy.data.materials.new("sovereign_black_sun_wing_mat")
    mat_wing.use_nodes = True
    ntw = mat_wing.node_tree
    ntw.nodes.clear()
    outw = ntw.nodes.new("ShaderNodeOutputMaterial")

    tcw = ntw.nodes.new("ShaderNodeTexCoord")
    noise_wing = ntw.nodes.new("ShaderNodeTexNoise")
    noise_wing.inputs["Scale"].default_value = 4.2
    noise_wing.inputs["Detail"].default_value = 2.5
    noise_wing.inputs["Distortion"].default_value = 0.50
    ntw.links.new(tcw.outputs["Object"], noise_wing.inputs["Vector"])

    mix_wvec = ntw.nodes.new("ShaderNodeMixRGB")
    mix_wvec.inputs["Fac"].default_value = 0.35
    ntw.links.new(tcw.outputs["Object"], mix_wvec.inputs["Color1"])
    ntw.links.new(noise_wing.outputs["Color"], mix_wvec.inputs["Color2"])

    vor_vein = ntw.nodes.new("ShaderNodeTexVoronoi")
    vor_vein.feature = "DISTANCE_TO_EDGE"
    vor_vein.inputs["Scale"].default_value = 4.8
    ntw.links.new(mix_wvec.outputs["Color"], vor_vein.inputs["Vector"])

    rampw = ntw.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampw.color_ramp,
        [
            (0.0, (1.0, 0.56, 0.14, 1.0)),
            (0.015, (0.85, 0.10, 0.04, 1.0)),
            (0.038, (0.14, 0.012, 0.018, 1.0)),
            (1.0, (0.025, 0.004, 0.006, 1.0)),
        ],
    )
    ntw.links.new(vor_vein.outputs["Distance"], rampw.inputs["Fac"])

    shader_wing, emit_wing = build_lit_pbr_plus_emission_shader(
        ntw,
        base_rgb=(0.045, 0.007, 0.010),
        metallic=0.18,
        roughness=0.32,
        spec_ior_level=0.65,
        gold_rim_rgb=(1.0, 0.58, 0.16),
        lava_up_rgb=(0.68, 0.09, 0.03),
        bump_height_socket=vor_vein.outputs["Distance"],
        bump_strength=0.45,
        bump_distance=0.015,
        extra_emit_socket=rampw.outputs["Color"],
        extra_emit_strength=1.15,
        rim_power=1.15,
    )
    animated_nodes["wing_vein_strength"] = emit_wing.inputs["Strength"]
    ntw.links.new(shader_wing.outputs["Shader"], outw.inputs["Surface"])

    # 4. Horns, Dorsal Spines & Wing Finger Bones Material
    mat_horn = bpy.data.materials.new("sovereign_black_sun_horn_mat")
    mat_horn.use_nodes = True
    nth = mat_horn.node_tree
    nth.nodes.clear()
    outh = nth.nodes.new("ShaderNodeOutputMaterial")

    tch = nth.nodes.new("ShaderNodeTexCoord")
    noise_horn = nth.nodes.new("ShaderNodeTexNoise")
    noise_horn.inputs["Scale"].default_value = 18.0
    noise_horn.inputs["Detail"].default_value = 2.5
    nth.links.new(tch.outputs["Object"], noise_horn.inputs["Vector"])

    shader_horn, _ = build_lit_pbr_plus_emission_shader(
        nth,
        base_rgb=(0.028, 0.018, 0.014),
        metallic=0.62,
        roughness=0.18,
        spec_ior_level=0.88,
        gold_rim_rgb=(1.0, 0.80, 0.28),
        lava_up_rgb=(0.48, 0.08, 0.02),
        bump_height_socket=noise_horn.outputs["Fac"],
        bump_strength=0.38,
        bump_distance=0.015,
        extra_emit_socket=None,
        extra_emit_strength=1.15,
        rim_power=1.35,
    )
    nth.links.new(shader_horn.outputs["Shader"], outh.inputs["Surface"])

    # 5. Molten Eyes & Roaring Inner Maw Material
    mat_maw = bpy.data.materials.new("sovereign_black_sun_maw_mat")
    mat_maw.use_nodes = True
    ntm = mat_maw.node_tree
    ntm.nodes.clear()
    outm = ntm.nodes.new("ShaderNodeOutputMaterial")
    emitm = ntm.nodes.new("ShaderNodeEmission")
    emitm.inputs["Color"].default_value = (1.0, 0.72, 0.16, 1.0)
    emitm.inputs["Strength"].default_value = 6.5
    ntm.links.new(emitm.outputs["Emission"], outm.inputs["Surface"])

    # 6. Billowing Turbulent Dragonfire Plume Material (4D Periodic Noise + Soft Edge Falloff)
    mat_fire = bpy.data.materials.new("sovereign_black_sun_fire_mat")
    mat_fire.use_nodes = True
    ntf = mat_fire.node_tree
    ntf.nodes.clear()
    outf = ntf.nodes.new("ShaderNodeOutputMaterial")

    tcf = ntf.nodes.new("ShaderNodeTexCoord")
    mapf = ntf.nodes.new("ShaderNodeMapping")
    ntf.links.new(tcf.outputs["Generated"], mapf.inputs["Vector"])
    animated_nodes["fire_mapping_loc"] = mapf.inputs["Location"]

    noisef = ntf.nodes.new("ShaderNodeTexNoise")
    noisef.noise_dimensions = "4D"
    noisef.inputs["Scale"].default_value = 5.2
    noisef.inputs["Detail"].default_value = 3.0
    noisef.inputs["Roughness"].default_value = 0.64
    noisef.inputs["Distortion"].default_value = 0.65
    noisef.inputs["W"].default_value = 0.0
    ntf.links.new(mapf.outputs["Vector"], noisef.inputs["Vector"])
    animated_nodes["fire_noise_w"] = noisef.inputs["W"]

    lw_fire = ntf.nodes.new("ShaderNodeLayerWeight")
    lw_fire.inputs["Blend"].default_value = 0.48
    inv_fresnel = ntf.nodes.new("ShaderNodeMapRange")
    inv_fresnel.interpolation_type = "SMOOTHSTEP"
    inv_fresnel.inputs["From Min"].default_value = 0.0
    inv_fresnel.inputs["From Max"].default_value = 0.85
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
            (0.0, (0.008, 0.001, 0.003, 1.0)),
            (0.18, (0.52, 0.03, 0.012, 1.0)),
            (0.36, (0.96, 0.28, 0.04, 1.0)),
            (0.56, (1.0, 0.68, 0.14, 1.0)),
            (0.78, (1.0, 0.95, 0.65, 1.0)),
        ],
    )
    ntf.links.new(mul_fire_density.outputs["Value"], rampf.inputs["Fac"])

    emitf = ntf.nodes.new("ShaderNodeEmission")
    emitf.inputs["Strength"].default_value = 2.8
    animated_nodes["fire_breath_strength"] = emitf.inputs["Strength"]
    ntf.links.new(rampf.outputs["Color"], emitf.inputs["Color"])
    ntf.links.new(emitf.outputs["Emission"], outf.inputs["Surface"])

    return mat_scales, mat_peak, mat_wing, mat_horn, mat_maw, mat_fire


def create_volcanic_peak_and_sovereign_wyrm(animated_nodes):
    """
    Builds the jagged volcanic peak in the lower right-center foreground and the
    colossal winged Sovereign dragon perched atop it, roaring up-right toward the black sun.
    """
    mat_scales, mat_peak, mat_wing, mat_horn, mat_maw, mat_fire = build_sovereign_wyrm_materials(animated_nodes)

    # ─── 1. SCULPTED VOLCANIC PEAK WITH CRAGGY ROCK FACETS (No Vertical Cone Artifacts) ───
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1.55, location=(0.68, 2.75, -2.05))
    peak = bpy.context.active_object
    peak.name = "sovereign_black_sun_volcanic_peak"
    peak.scale = (1.35, 0.98, 1.25)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bm = bmesh.new()
    bm.from_mesh(peak.data)
    for v in bm.verts:
        z_norm = max(0.0, min(1.0, (v.co.z + 1.5) / 3.0))
        taper = 1.35 * (1.0 - z_norm * 0.72)
        v.co.x *= taper
        v.co.y *= taper
        rock_n = (
            math.sin(v.co.x * 3.8 + v.co.z * 2.4) * math.cos(v.co.y * 3.5 - v.co.z * 1.9) * 0.16
            + math.cos(v.co.x * 8.2 - v.co.y * 7.1) * 0.06
        )
        v.co.x += rock_n
        v.co.y += rock_n * 0.8
        v.co.z += abs(rock_n) * 0.5
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

    # Muscular S-curve neck & torso with armored chest scutes & dorsal spines
    spine_pts = [
        (Vector((-0.24, 0.16, -0.35)), 0.36),
        (Vector((-0.14, 0.10, -0.08)), 0.41),
        (Vector((-0.03, 0.03, 0.20)), 0.37),
        (Vector((0.08, -0.02, 0.46)), 0.30),
        (Vector((0.20, -0.05, 0.70)), 0.24),
        (Vector((0.32, -0.07, 0.90)), 0.20),
        (Vector((0.41, -0.08, 1.04)), 0.17),
    ]
    for idx, (pt, rad) in enumerate(spine_pts):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=18, radius=rad, location=pt)
        seg = bpy.context.active_object
        seg.name = f"sovereign_black_sun_torso_seg_{idx:02d}"
        seg.scale = (1.15, 0.92, 1.28)
        seg.rotation_euler = (0.10, 0.36, 0.0)
        seg.parent = chest_pivot
        for p in seg.data.polygons:
            p.use_smooth = True
        seg.data.materials.append(mat_scales)

        # Overlapping ventral chest armor plate (scute)
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=pt + Vector((0.68 * rad, -0.45 * rad, -0.05 * rad)),
            rotation=(0.18, 0.42, -0.25),
        )
        scute = bpy.context.active_object
        scute.name = f"sovereign_black_sun_chest_scute_{idx:02d}"
        scute.scale = (rad * 0.45, rad * 0.82, rad * 0.28)
        scute.parent = chest_pivot
        bvs = scute.modifiers.new("Bevel", "BEVEL")
        bvs.width = 0.015
        bvs.segments = 2
        for p in scute.data.polygons:
            p.use_smooth = True
        scute.data.materials.append(mat_horn)

        # Swept dorsal spine
        bpy.ops.mesh.primitive_cone_add(
            vertices=10,
            radius1=rad * 0.25,
            radius2=0.006,
            depth=rad * 1.28,
            location=pt + Vector((-0.24 * rad, 0.12 * rad, 0.20 * rad)),
            rotation=(-0.18, -0.92, 0.0),
        )
        sp = bpy.context.active_object
        sp.name = f"sovereign_black_sun_dorsal_spine_{idx:02d}"
        sp.parent = chest_pivot
        for p in sp.data.polygons:
            p.use_smooth = True
        sp.data.materials.append(mat_horn)

    # ─── 3. SCULPTED HEAD, FIERCE JAWS, CURVED CROWN HORNS & MOLTEN EYES ────────
    head_pivot = bpy.data.objects.new("sovereign_black_sun_head_pivot", None)
    bpy.context.collection.objects.link(head_pivot)
    head_pivot.parent = chest_pivot
    head_pivot.location = Vector((0.46, -0.08, 1.12))
    head_pivot.rotation_euler = Euler((math.radians(-10.0), math.radians(-26.0), math.radians(-16.0)), "XYZ")

    # Upper skull / snout
    bpy.ops.mesh.primitive_cone_add(
        vertices=20,
        radius1=0.22,
        radius2=0.075,
        depth=0.58,
        location=(0.24, 0.0, 0.12),
        rotation=(0.0, math.radians(66.0), 0.0),
    )
    skull = bpy.context.active_object
    skull.name = "sovereign_black_sun_skull"
    skull.scale = (1.0, 0.84, 0.72)
    skull.parent = head_pivot
    for p in skull.data.polygons:
        p.use_smooth = True
    skull.data.materials.append(mat_scales)

    # Brow ridges above eyes
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(0.14, side * 0.11, 0.21),
            rotation=(side * 0.22, math.radians(-18.0), side * 0.18),
        )
        brow = bpy.context.active_object
        brow.name = f"sovereign_black_sun_brow_{side}"
        brow.scale = (0.16, 0.045, 0.035)
        brow.parent = head_pivot
        for p in brow.data.polygons:
            p.use_smooth = True
        brow.data.materials.append(mat_horn)

    # Roaring lower jaw (hinged open)
    bpy.ops.mesh.primitive_cone_add(
        vertices=18,
        radius1=0.17,
        radius2=0.055,
        depth=0.48,
        location=(0.22, 0.0, -0.09),
        rotation=(0.0, math.radians(114.0), 0.0),
    )
    jaw = bpy.context.active_object
    jaw.name = "sovereign_black_sun_lower_jaw"
    jaw.scale = (1.0, 0.76, 0.58)
    jaw.parent = head_pivot
    for p in jaw.data.polygons:
        p.use_smooth = True
    jaw.data.materials.append(mat_scales)

    # Upper & Lower Fangs
    for side in (-1, 1):
        for f_idx, x_off in enumerate((0.20, 0.30, 0.40)):
            bpy.ops.mesh.primitive_cone_add(
                vertices=8,
                radius1=0.018,
                radius2=0.002,
                depth=0.085,
                location=(x_off, side * (0.09 - f_idx * 0.012), 0.04 - f_idx * 0.01),
                rotation=(0.0, math.radians(165.0), 0.0),
            )
            ufang = bpy.context.active_object
            ufang.name = f"sovereign_black_sun_ufang_{side}_{f_idx}"
            ufang.parent = head_pivot
            ufang.data.materials.append(mat_horn)

            bpy.ops.mesh.primitive_cone_add(
                vertices=8,
                radius1=0.016,
                radius2=0.002,
                depth=0.075,
                location=(x_off - 0.02, side * (0.075 - f_idx * 0.01), -0.08 - f_idx * 0.02),
                rotation=(0.0, math.radians(22.0), 0.0),
            )
            lfang = bpy.context.active_object
            lfang.name = f"sovereign_black_sun_lfang_{side}_{f_idx}"
            lfang.parent = head_pivot
            lfang.data.materials.append(mat_horn)

    # Molten glowing throat core inside open jaws
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=0.11, location=(0.18, 0.0, 0.01))
    throat = bpy.context.active_object
    throat.name = "sovereign_black_sun_molten_throat"
    throat.parent = head_pivot
    throat.data.materials.append(mat_maw)

    # Fierce Molten Slit Eyes
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=14,
            ring_count=10,
            radius=0.036,
            location=(0.16, side * 0.115, 0.155),
        )
        eye = bpy.context.active_object
        eye.name = f"sovereign_black_sun_eye_{side}"
        eye.scale = (1.45, 0.55, 0.85)
        eye.parent = head_pivot
        eye.data.materials.append(mat_maw)

    # 4 Swept-Back Curved Royal Dragon Horns (3D Bevelled Curves for S-curved silhouette)
    for side in (-1, 1):
        # Primary royal crown horn
        h_curve = bpy.data.curves.new(f"sovereign_black_sun_horn_primary_curve_{side}", type="CURVE")
        h_curve.dimensions = "3D"
        h_curve.bevel_depth = 0.062
        h_curve.bevel_resolution = 4
        spl = h_curve.splines.new("BEZIER")
        horn_pts = [
            (Vector((0.02, side * 0.11, 0.19)), 1.0),
            (Vector((-0.24, side * 0.24, 0.34)), 0.72),
            (Vector((-0.56, side * 0.35, 0.54)), 0.38),
            (Vector((-0.82, side * 0.42, 0.76)), 0.06),
        ]
        spl.bezier_points.add(len(horn_pts) - 1)
        for p_idx, (co, rad_h) in enumerate(horn_pts):
            bp = spl.bezier_points[p_idx]
            bp.co = co
            bp.radius = rad_h
            bp.handle_left_type = "AUTO"
            bp.handle_right_type = "AUTO"
        horn1 = bpy.data.objects.new(f"sovereign_black_sun_horn_primary_{side}", h_curve)
        bpy.context.collection.objects.link(horn1)
        horn1.parent = head_pivot
        horn1.data.materials.append(mat_horn)

        # Secondary lower cheek/jaw horn
        h2_curve = bpy.data.curves.new(f"sovereign_black_sun_horn_secondary_curve_{side}", type="CURVE")
        h2_curve.dimensions = "3D"
        h2_curve.bevel_depth = 0.040
        h2_curve.bevel_resolution = 3
        spl2 = h2_curve.splines.new("BEZIER")
        horn2_pts = [
            (Vector((-0.02, side * 0.14, 0.07)), 1.0),
            (Vector((-0.26, side * 0.28, 0.13)), 0.55),
            (Vector((-0.50, side * 0.36, 0.24)), 0.08),
        ]
        spl2.bezier_points.add(len(horn2_pts) - 1)
        for p_idx, (co, rad_h) in enumerate(horn2_pts):
            bp = spl2.bezier_points[p_idx]
            bp.co = co
            bp.radius = rad_h
            bp.handle_left_type = "AUTO"
            bp.handle_right_type = "AUTO"
        horn2 = bpy.data.objects.new(f"sovereign_black_sun_horn_secondary_{side}", h2_curve)
        bpy.context.collection.objects.link(horn2)
        horn2.parent = head_pivot
        horn2.data.materials.append(mat_horn)

    # ─── 4. BILLOWING FIRE BREATH STREAM POURING UPWARD AND TO THE RIGHT ────────
    fire_piv = bpy.data.objects.new("sovereign_black_sun_fire_pivot", None)
    bpy.context.collection.objects.link(fire_piv)
    fire_piv.parent = head_pivot
    fire_piv.location = Vector((0.36, 0.0, 0.02))
    fire_piv.rotation_euler = Euler((0.0, math.radians(52.0), math.radians(-6.0)), "XYZ")

    # Sculpted multi-lobe billowing fire mesh (not a flat geometric cone)
    bpy.ops.mesh.primitive_cone_add(
        vertices=48,
        radius1=0.08,
        radius2=0.58,
        depth=2.55,
        location=(0.0, 0.0, 1.28),
    )
    fire_obj = bpy.context.active_object
    fire_obj.name = "sovereign_black_sun_fire_plume"
    fire_obj.scale = (1.0, 0.68, 1.0)
    fire_obj.parent = fire_piv
    fire_obj.visible_shadow = False
    fire_obj.visible_diffuse = False
    fire_obj.visible_glossy = False

    sub_f = fire_obj.modifiers.new("Subsurf", "SUBSURF")
    sub_f.levels = 2
    sub_f.render_levels = 2
    for p in fire_obj.data.polygons:
        p.use_smooth = True
    fire_obj.data.materials.append(mat_fire)

    # ─── 5. COLOSSAL ARTICULATED WINGS FRAMING THE ECLIPSE ──────────────────────
    wings_data = []
    for side in (-1, 1):
        wing_shoulder = bpy.data.objects.new(f"sovereign_black_sun_wing_shoulder_{side}", None)
        bpy.context.collection.objects.link(wing_shoulder)
        wing_shoulder.parent = chest_pivot
        wing_shoulder.location = Vector((-0.02, side * 0.25, 0.56))

        if side == -1:
            base_rot = Euler((math.radians(24.0), math.radians(-26.0), math.radians(32.0)), "XYZ")
        else:
            base_rot = Euler((math.radians(-28.0), math.radians(-16.0), math.radians(-30.0)), "XYZ")
        wing_shoulder.rotation_euler = base_rot

        # Upper wing arm bone + thumb claw
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=14,
            radius=0.058,
            depth=1.42,
            location=(0.0, side * 0.68, 0.44),
            rotation=(side * math.radians(-52.0), math.radians(16.0), 0.0),
        )
        arm = bpy.context.active_object
        arm.name = f"sovereign_black_sun_wing_arm_{side}"
        arm.parent = wing_shoulder
        for p in arm.data.polygons:
            p.use_smooth = True
        arm.data.materials.append(mat_horn)

        # Wing Wrist / Outer Wing Pivot (for secondary lagging membrane motion)
        wing_wrist = bpy.data.objects.new(f"sovereign_black_sun_wing_wrist_{side}", None)
        bpy.context.collection.objects.link(wing_wrist)
        wing_wrist.parent = wing_shoulder
        wing_wrist.location = Vector((-0.08, side * 1.28, 0.86))

        # Wing thumb talon at the wrist apex
        bpy.ops.mesh.primitive_cone_add(
            vertices=10,
            radius1=0.045,
            radius2=0.005,
            depth=0.34,
            location=(0.08, side * 0.06, 0.18),
            rotation=(side * 0.25, math.radians(28.0), 0.0),
        )
        talon = bpy.context.active_object
        talon.name = f"sovereign_black_sun_wing_talon_{side}"
        talon.parent = wing_wrist
        for p in talon.data.polygons:
            p.use_smooth = True
        talon.data.materials.append(mat_horn)

        # 4 Wing Finger Struts radiating from wrist
        finger_tips = [
            Vector((-0.24, side * 1.48, 0.92)),
            Vector((-0.52, side * 1.32, 0.22)),
            Vector((-0.72, side * 0.95, -0.45)),
            Vector((-0.78, side * 0.42, -0.92)),
        ]
        for f_i, tip in enumerate(finger_tips):
            mid = tip * 0.5
            length = tip.length
            bpy.ops.mesh.primitive_cone_add(
                vertices=10,
                radius1=0.036,
                radius2=0.007,
                depth=length,
                location=mid,
            )
            strut = bpy.context.active_object
            strut.name = f"sovereign_black_sun_wing_strut_{side}_{f_i}"
            direction = tip.normalized()
            strut.rotation_euler = direction.to_track_quat("Z", "X").to_euler()
            strut.parent = wing_wrist
            for p in strut.data.polygons:
                p.use_smooth = True
            strut.data.materials.append(mat_horn)

        # Sculpted Bat-Wing Membrane Webbing with Scalloped Trailing Edge & Camber Billow
        bm_w = bmesh.new()
        wrist_v = bm_w.verts.new(Vector((0.0, 0.0, 0.0)))
        shoulder_local = Vector((0.06, -side * 1.15, -0.78))
        hip_local = Vector((-0.32, -side * 1.18, -1.35))

        tip_verts = [bm_w.verts.new(t) for t in finger_tips]
        sh_v = bm_w.verts.new(shoulder_local)
        hip_v = bm_w.verts.new(hip_local)

        # Create scalloped mid-points between finger tips for realistic bat-wing arches
        for i in range(len(tip_verts) - 1):
            t_a = finger_tips[i]
            t_b = finger_tips[i + 1]
            scallop_mid = (t_a + t_b) * 0.42 + Vector((0.08, 0.0, 0.04))
            v_mid = bm_w.verts.new(scallop_mid)
            bm_w.faces.new((wrist_v, tip_verts[i], v_mid))
            bm_w.faces.new((wrist_v, v_mid, tip_verts[i + 1]))

        bm_w.faces.new((wrist_v, tip_verts[-1], hip_v, sh_v))

        bmesh.ops.subdivide_edges(bm_w, edges=bm_w.edges[:], cuts=4, use_grid_fill=True)
        for v in bm_w.verts:
            # Aerodynamic camber billow
            dist_from_wrist = v.co.length
            v.co.x += math.sin(min(3.14, dist_from_wrist * 1.6)) * 0.14

        mem_mesh = bpy.data.meshes.new(f"sovereign_black_sun_wing_membrane_{side}")
        bm_w.to_mesh(mem_mesh)
        bm_w.free()
        for p in mem_mesh.polygons:
            p.use_smooth = True

        mem_obj = bpy.data.objects.new(f"sovereign_black_sun_wing_membrane_obj_{side}", mem_mesh)
        bpy.context.collection.objects.link(mem_obj)
        mem_obj.parent = wing_wrist
        sol = mem_obj.modifiers.new("Solidify", "SOLIDIFY")
        sol.thickness = 0.018
        mem_obj.data.materials.append(mat_wing)

        wings_data.append((wing_shoulder, wing_wrist, base_rot, side))

    # ─── 6. COILED TAIL WRAPPING AROUND THE VOLCANIC PEAK ───────────────────────
    tail_segments = []
    num_tail = 14
    for t_i in range(num_tail):
        frac = t_i / float(num_tail - 1)
        ang_t = frac * math.pi * 1.35 + 0.45
        rad_t = 0.48 + frac * 0.52
        loc_t = Vector((
            -0.25 + math.cos(ang_t) * rad_t,
            math.sin(ang_t) * rad_t * 0.65,
            -0.38 - frac * 0.98,
        ))
        seg_rad = 0.23 * (1.0 - frac * 0.78)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=seg_rad, location=loc_t)
        t_seg = bpy.context.active_object
        t_seg.name = f"sovereign_black_sun_tail_seg_{t_i:02d}"
        t_seg.scale = (1.22, 0.95, 1.35)
        t_seg.parent = wyrm_root
        for p in t_seg.data.polygons:
            p.use_smooth = True
        t_seg.data.materials.append(mat_scales)
        tail_segments.append((t_seg, loc_t, frac))

    return wyrm_root, chest_pivot, head_pivot, fire_piv, wings_data, tail_segments


def create_forked_lightning_bolts():
    """
    Creates two dramatic forked crimson-gold lightning bolts in clear sky windows flanking the eclipse
    that flash twice per loop at fixed frames (frames 46 and 126) and remain completely off at frames 0 and 179.
    """
    bolts = []
    rng = random.Random(55109)
    for b_idx, (base_x, base_z) in enumerate(((-0.75, 2.65), (4.15, 2.45))):
        curve_data = bpy.data.curves.new(f"sovereign_black_sun_lightning_curve_{b_idx}", type="CURVE")
        curve_data.dimensions = "3D"
        curve_data.bevel_depth = 0.036
        curve_data.bevel_resolution = 2

        for f_idx in range(4):
            spline = curve_data.splines.new("POLY")
            pts = 11 if f_idx == 0 else 6
            spline.points.add(pts - 1)
            cur = Vector((base_x + f_idx * 0.18, 10.6, base_z - f_idx * 0.45))
            for p_i in range(pts):
                spline.points[p_i].co = (cur.x, cur.y, cur.z, 1.0)
                spline.points[p_i].radius = max(0.22, 1.0 - p_i / float(pts))
                cur += Vector((rng.uniform(-0.34, 0.34), rng.uniform(-0.06, 0.06), -0.34))

        bolt_obj = bpy.data.objects.new(f"sovereign_black_sun_lightning_{b_idx}", curve_data)
        bpy.context.collection.objects.link(bolt_obj)
        bolt_obj.visible_shadow = False
        bolt_obj.visible_diffuse = False
        bolt_obj.visible_glossy = False

        mat_b = bpy.data.materials.new(f"sovereign_black_sun_lightning_mat_{b_idx}")
        mat_b.use_nodes = True
        nt = mat_b.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = (1.0, 0.84, 0.42, 1.0) if b_idx == 0 else (1.0, 0.38, 0.18, 1.0)
        emit.inputs["Strength"].default_value = 0.0
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        bolt_obj.data.materials.append(mat_b)
        bolts.append((bolt_obj, emit.inputs["Strength"]))

    return bolts


def create_depth_of_field_embers():
    """
    Creates 3D embers, ash flakes and molten debris organized into 3 depth-of-field
    cloud groups (near out-of-focus foreground bokeh, mid-plane sharp embers, and
    distant background embers), avoiding the Black Sun camera sightline cone.
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
                (0.88, (0.02, 0.003, 0.004, 1.0)),
                (1.0, (0.002, 0.001, 0.004, 1.0)),
            ],
        )
        nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        return mat

    mat_ember_gold = make_bokeh_ember_mat("sovereign_black_sun_ember_gold", (1.0, 0.72, 0.22, 1.0), 3.4)
    mat_ember_crimson = make_bokeh_ember_mat("sovereign_black_sun_ember_crimson", (0.98, 0.24, 0.08, 1.0), 2.8)

    rng = random.Random(314159)
    ember_groups = []

    cam_ref = Vector((0.0, -5.85, 0.10))
    sun_ref = Vector((1.95, 8.2, 0.92))
    sun_vec = sun_ref - cam_ref
    sun_dist = sun_vec.length
    sun_dir = sun_vec.normalized()

    for g_idx, (num_pts, y_min, y_max, base_rad, mat_use) in enumerate(
        (
            (65, -3.6, -1.2, 0.022, mat_ember_crimson),   # Foreground optical DoF bokeh embers
            (220, 1.2, 6.2, 0.014, mat_ember_gold),       # Mid-plane crisp rising embers
            (180, 6.8, 13.5, 0.018, mat_ember_gold),      # Distant background embers
        )
    ):
        bm = bmesh.new()
        placed = 0
        while placed < num_pts:
            in_right = rng.random() > 0.08
            x0 = rng.uniform(-0.3, 4.4) if in_right else rng.uniform(-3.8, -0.5)
            y0 = rng.uniform(y_min, y_max)
            z0 = rng.uniform(-2.1, 2.5)
            pt = Vector((x0, y0, z0))
            rel = pt - cam_ref
            t_proj = max(0.1, rel.dot(sun_dir))
            perp_dist = (rel - sun_dir * t_proj).length
            cone_rad = 1.68 * (t_proj / sun_dist) + 0.28
            if perp_dist < cone_rad:
                continue
            r_scale = base_rad * rng.uniform(0.55, 1.35)
            bmesh.ops.create_icosphere(
                bm,
                subdivisions=2,
                radius=r_scale,
                matrix=Matrix.Translation(pt),
            )
            placed += 1
        mesh_data = bpy.data.meshes.new(f"sovereign_black_sun_ember_cloud_mesh_{g_idx}")
        bm.to_mesh(mesh_data)
        bm.free()
        for p in mesh_data.polygons:
            p.use_smooth = True

        cloud_obj = bpy.data.objects.new(f"sovereign_black_sun_ember_cloud_{g_idx}", mesh_data)
        bpy.context.collection.objects.link(cloud_obj)
        cloud_obj.visible_shadow = False
        cloud_obj.visible_diffuse = False
        cloud_obj.visible_glossy = False
        cloud_obj.data.materials.append(mat_use)
        ember_groups.append((cloud_obj, g_idx))

    return ember_groups


def setup_camera(scene):
    cam_data = bpy.data.cameras.new("sovereign_black_sun_camera")
    cam_data.lens = 36.0
    cam_data.sensor_width = 36.0

    # Real optical Depth of Field focused on the Sovereign dragon (y ~ 2.55, cam y ~ -5.85 => dist ~ 8.4m)
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 8.4
    cam_data.dof.aperture_fstop = 2.0
    cam_data.dof.aperture_blades = 7

    cam_obj = bpy.data.objects.new("sovereign_black_sun_camera_obj", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj


def setup_compositor(scene):
    """
    Post-processing pipeline in Blender Compositor:
      - Fog Glow Glare (bloom on solar corona, diamond-ring flare, dragonfire & gold veins)
      - Diamond-Ring Star Streak Glare
      - Smooth Dark Vignette (keeps corners and left third dark & calm for UI text)
      - Subtle Optical Lens Dispersion / Film Grain
    """
    scene.use_nodes = True
    nt = scene.node_tree
    nt.nodes.clear()

    rl = nt.nodes.new("CompositorNodeRLayers")
    comp = nt.nodes.new("CompositorNodeComposite")

    # 1. Bloom / Fog Glow
    glare_glow = nt.nodes.new("CompositorNodeGlare")
    glare_glow.glare_type = "FOG_GLOW"
    glare_glow.quality = "MEDIUM"
    glare_glow.threshold = 0.95
    glare_glow.size = 7
    glare_glow.mix = -0.25
    nt.links.new(rl.outputs["Image"], glare_glow.inputs["Image"])

    # 2. Diamond-Ring Star Streak Glare
    glare_streaks = nt.nodes.new("CompositorNodeGlare")
    glare_streaks.glare_type = "STREAKS"
    glare_streaks.quality = "MEDIUM"
    glare_streaks.threshold = 3.8
    glare_streaks.streaks = 4
    glare_streaks.angle_offset = math.radians(22.0)
    glare_streaks.fade = 0.86
    glare_streaks.mix = -0.55
    nt.links.new(glare_glow.outputs["Image"], glare_streaks.inputs["Image"])

    # 3. Color Grading
    cb = nt.nodes.new("CompositorNodeColorBalance")
    cb.correction_method = "LIFT_GAMMA_GAIN"
    cb.lift = (0.97, 0.94, 0.96)
    cb.gamma = (1.03, 0.99, 0.95)
    cb.gain = (1.08, 1.02, 0.94)
    nt.links.new(glare_streaks.outputs["Image"], cb.inputs["Image"])

    # 4. Subtle Optical Vignette
    ell = nt.nodes.new("CompositorNodeEllipseMask")
    ell.width = 0.92
    ell.height = 0.90
    ell.x = 0.54
    ell.y = 0.50

    blur_vig = nt.nodes.new("CompositorNodeBlur")
    blur_vig.filter_type = "FAST_GAUSS"
    blur_vig.use_relative = True
    blur_vig.factor_x = 0.22
    blur_vig.factor_y = 0.22
    nt.links.new(ell.outputs["Mask"], blur_vig.inputs["Image"])

    vig_range = nt.nodes.new("CompositorNodeMapRange")
    vig_range.inputs["From Min"].default_value = 0.0
    vig_range.inputs["From Max"].default_value = 1.0
    vig_range.inputs["To Min"].default_value = 0.38
    vig_range.inputs["To Max"].default_value = 1.0
    nt.links.new(blur_vig.outputs["Image"], vig_range.inputs["Value"])

    mix_vig = nt.nodes.new("CompositorNodeMixRGB")
    mix_vig.blend_type = "MULTIPLY"
    mix_vig.inputs[0].default_value = 1.0
    nt.links.new(cb.outputs["Image"], mix_vig.inputs[1])
    nt.links.new(vig_range.outputs["Value"], mix_vig.inputs[2])

    # 5. Subtle Optical Lens Dispersion / Film Finish
    lens = nt.nodes.new("CompositorNodeLensdist")
    lens.use_jitter = True
    lens.use_fit = True
    lens.inputs[1].default_value = -0.006
    lens.inputs[2].default_value = 0.008
    nt.links.new(mix_vig.outputs["Image"], lens.inputs["Image"])

    nt.links.new(lens.outputs["Image"], comp.inputs["Image"])


def apply_frame_state(
    frame,
    total_frames,
    animated_nodes,
    lights,
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
    animated_nodes["obsidian_vein_strength"].default_value = 1.0 + 0.32 * (1.0 - p_cos) + 0.16 * p_sin
    animated_nodes["corona_strength"].default_value = 3.2 + 0.65 * (1.0 - p_cos) + 0.35 * p_sin
    animated_nodes["diamond_flare_strength"].default_value = 7.2 + 2.2 * (1.0 - p_cos)
    animated_nodes["mountain_lava_w"].default_value = (1.0 - p_cos) * 0.25
    animated_nodes["wing_vein_strength"].default_value = 1.0 + 0.28 * (1.0 - p_cos)

    # Fire breath periodic upward-right flow + 4D noise flicker (closed loop in Y/Z/W)
    animated_nodes["fire_noise_w"].default_value = (1.0 - p_cos) * 0.68
    animated_nodes["fire_breath_strength"].default_value = 2.6 + 0.85 * (1.0 - p_cos) + 0.45 * p_sin
    animated_nodes["fire_mapping_loc"].default_value = (
        0.0,
        0.42 * p_sin,
        -0.48 * (1.0 - p_cos),
    )

    # Dynamic fire point light & corona key light pulse
    lights["fire_light"].energy = 230.0 + 75.0 * (1.0 - p_cos) + 35.0 * p_sin
    lights["eclipse_key"].energy = 4.1 + 0.65 * (1.0 - p_cos)

    # 2. Obsidian Ring & Orbiting Slabs (smooth rotation in tilted plane, exact whole-turn return at frame 180)
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

    # 3. Colossal Sovereign Dragon Motion (1 slow wing flap per loop with lagging membrane, chest breathing, neck sway, tail wave)
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
    bolts[0][1].default_value = 36.0 * flash_a if flash_a > 0.01 else 0.0
    bolts[1][1].default_value = 30.0 * flash_b if flash_b > 0.01 else 0.0
    lights["storm_flash"].energy = 2.8 * max(flash_a, flash_b) if max(flash_a, flash_b) > 0.01 else 0.0

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
    frame_start, frame_end, output_prefix, samples, res_x, res_y, save_blend, skip_existing = parse_args()
    out_dir = os.path.dirname(output_prefix)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    clear_scene()
    scene = bpy.context.scene
    setup_render_engine(scene, samples=samples, res_x=res_x, res_y=res_y)

    animated_nodes = {}
    build_world_sky(scene)
    lights = setup_scene_lights(animated_nodes)
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
        lights,
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
        frame_path = f"{output_prefix}{f:04d}.png"
        if skip_existing and os.path.exists(frame_path) and os.path.getsize(frame_path) > 10000:
            print(f"[sovereign_black_sun] Skipping existing frame {f:04d} -> {frame_path}", flush=True)
            continue

        apply_frame_state(
            f,
            total_frames,
            animated_nodes,
            lights,
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
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"[sovereign_black_sun] Rendered frame {f}/{frame_end} -> {frame_path}", flush=True)


if __name__ == "__main__":
    main()
