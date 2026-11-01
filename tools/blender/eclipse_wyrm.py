#!/usr/bin/env python3
"""
Boardly Store — "Eclipse Wyrm" (id: eclipse-wyrm)
Flagship Mythic Animated 3D Avatar — Procedural Blender 4.2 LTS Scene & 150-Frame Seamless Loop
File: /tools/blender/eclipse_wyrm.py

Specifications:
- 1:1 Square framing (rendered at 1024x1024, downscaled to 512x512 in encoding)
- Circle-safe composition: all key features (eyes, horns, crown of gold spikes, corona, obsidian ring,
  nostril smoke, jaws) sit inside the central inscribed circle with >8% margin from all edges.
- High-contrast silhouette & blazing molten slit-pupil eyes for crystal-clear readability at 40x40 px.
- Three-quarter close-up head-and-neck portrait of the ancient Eclipse Wyrm:
  * Armored dark obsidian/crimson scales with sculpted overlapping scutes & localized magma crevice glow
  * Swept-back royal obsidian horns with gold-lit ridges
  * Crown of small gleaming gold spikes atop the skull crest
  * Glowing molten eyes with razor-sharp vertical dark slit pupil + one slow blink per loop (around frame 78)
  * Organic curling nostril smoke wisps & embers rising outward from pulsing nostrils
  * Parted fanged jaws with glowing molten fire in the throat
- Background:
  * Black eclipse sun directly behind the wyrm's head with thin blazing gold corona & diamond-ring flare
  * Slim floating glossy obsidian ring with glowing kintsugi gold veins (rotates 1 full turn per loop)
  * Crimson and gold god rays bursting outward + dark starry sky in outer margins
- Render Quality:
  * Cycles path tracing with real direct lighting & raytraced shadows, 4 max bounces,
    40 samples + Adaptive Sampling + OpenImageDenoise (OIDN), AgX / Filmic color management,
    compositor Fog Glow + Streak Glare + Vignette + Subtle Grain & Color Grade.
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
    frame_end = 149
    output_prefix = "/tmp/eclipse_wyrm_frames/frame_"
    samples = 40
    res_x = 1024
    res_y = 1024
    save_blend = "/app/applet/tools/blender/eclipse_wyrm.blend"
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


def setup_render_engine(scene, samples=40, res_x=1024, res_y=1024):
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

    # Real path-traced lighting with 4 max bounces + Adaptive Sampling + OpenImageDenoise
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.18
    scene.cycles.adaptive_min_samples = 6
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 1
    scene.cycles.glossy_bounces = 2
    scene.cycles.transmission_bounces = 1
    scene.cycles.volume_bounces = 0
    scene.cycles.transparent_max_bounces = 2
    scene.cycles.sample_clamp_direct = 8.0
    scene.cycles.sample_clamp_indirect = 3.5
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.seed = 77
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
            scene.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
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
    scene.frame_end = 149
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
    scene.view_settings.exposure = 0.14
    scene.view_settings.gamma = 1.0


def set_color_ramp_stops(color_ramp, stops):
    while len(color_ramp.elements) > 1:
        color_ramp.elements.remove(color_ramp.elements[-1])
    color_ramp.elements[0].position = stops[0][0]
    color_ramp.elements[0].color = stops[0][1]
    for pos, col in stops[1:]:
        el = color_ramp.elements.new(pos)
        el.color = col


def build_pbr_plus_rim_shader(
    nt,
    base_rgb,
    metallic=0.52,
    roughness=0.18,
    spec_ior_level=0.88,
    gold_rim_rgb=(1.0, 0.78, 0.24),
    crimson_fill_rgb=(0.72, 0.09, 0.03),
    bump_height_socket=None,
    bump_strength=0.65,
    bump_distance=0.022,
    extra_emit_socket=None,
    extra_emit_strength=1.0,
    rim_power=1.40,
):
    """
    Combines a real Principled BSDF (receiving direct Cycles lighting, raytraced shadows, and glossy reflections)
    with grazing corona gold rim light + crimson under-fill + optional emissive veins/crevices.
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
            (0.46, (0.02 * rim_power, 0.008 * rim_power, 0.004 * rim_power, 1.0)),
            (0.75, (gold_rim_rgb[0] * 0.48 * rim_power, gold_rim_rgb[1] * 0.34 * rim_power, gold_rim_rgb[2] * 0.14 * rim_power, 1.0)),
            (0.95, (gold_rim_rgb[0] * 1.38 * rim_power, gold_rim_rgb[1] * 1.05 * rim_power, gold_rim_rgb[2] * 0.58 * rim_power, 1.0)),
        ],
    )
    nt.links.new(lw.outputs["Fresnel"], rim_ramp.inputs["Fac"])

    geom = nt.nodes.new("ShaderNodeNewGeometry")
    sep_n = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geom.outputs["Normal"], sep_n.inputs["Vector"])

    # Downward-facing normals catch crimson magma fill from below
    crimson_map = nt.nodes.new("ShaderNodeMapRange")
    crimson_map.interpolation_type = "SMOOTHSTEP"
    crimson_map.inputs["From Min"].default_value = -0.15
    crimson_map.inputs["From Max"].default_value = -0.88
    crimson_map.inputs["To Min"].default_value = 0.0
    crimson_map.inputs["To Max"].default_value = 0.48
    nt.links.new(sep_n.outputs["Z"], crimson_map.inputs["Value"])

    mix_crimson = nt.nodes.new("ShaderNodeMixRGB")
    mix_crimson.blend_type = "ADD"
    mix_crimson.inputs["Color2"].default_value = (*crimson_fill_rgb, 1.0)
    nt.links.new(crimson_map.outputs["Result"], mix_crimson.inputs["Fac"])
    nt.links.new(rim_ramp.outputs["Color"], mix_crimson.inputs["Color1"])

    final_emit_color = mix_crimson.outputs["Color"]
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
    world = bpy.data.worlds.new("eclipse_wyrm_world")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.004, 0.001, 0.0025, 1.0)
    bg.inputs["Strength"].default_value = 0.40
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def setup_scene_lights():
    """
    Real Cycles shadow-casting lights for film-quality portrait lighting:
      1. Corona Gold Rim Key Light (from behind/above the wyrm's head)
      2. Left Grazing Gold Rim Light (carves the three-quarter snout, brow, and horns)
      3. Right Grazing Gold Rim Light (highlights the far horn, cheek armor & neck scutes)
      4. Crimson Magma Under-Fill Light (from below, illuminating jaw underside & chest scales)
      5. Front Specular Catchlight (brings out 3D scale armor relief on skull & snout)
      6. Throat Fire Point Light (warm pulsing glow inside the parted jaws)
    """
    lights = {}

    # 1. Corona Gold Rim Key Light
    rim_top = bpy.data.lights.new("eclipse_wyrm_corona_rim_key", type="SUN")
    rim_top.energy = 5.2
    rim_top.color = (1.0, 0.78, 0.30)
    rim_top.angle = math.radians(3.0)
    rim_top_obj = bpy.data.objects.new("eclipse_wyrm_corona_rim_key_obj", rim_top)
    bpy.context.collection.objects.link(rim_top_obj)
    rim_top_obj.rotation_euler = Euler((math.radians(56.0), math.radians(-14.0), math.radians(162.0)), "XYZ")
    lights["corona_rim"] = rim_top

    # 2. Left Grazing Gold Rim Light (highlights snout bridge, gold crown spikes & left horn)
    rim_left = bpy.data.lights.new("eclipse_wyrm_left_gold_rim", type="SUN")
    rim_left.energy = 3.6
    rim_left.color = (1.0, 0.72, 0.24)
    rim_left.angle = math.radians(5.0)
    rim_left_obj = bpy.data.objects.new("eclipse_wyrm_left_gold_rim_obj", rim_left)
    bpy.context.collection.objects.link(rim_left_obj)
    rim_left_obj.rotation_euler = Euler((math.radians(66.0), math.radians(24.0), math.radians(-132.0)), "XYZ")
    lights["left_rim"] = rim_left

    # 3. Right Grazing Gold Accent Light
    rim_right = bpy.data.lights.new("eclipse_wyrm_right_gold_rim", type="SUN")
    rim_right.energy = 2.6
    rim_right.color = (1.0, 0.66, 0.22)
    rim_right.angle = math.radians(6.0)
    rim_right_obj = bpy.data.objects.new("eclipse_wyrm_right_gold_rim_obj", rim_right)
    bpy.context.collection.objects.link(rim_right_obj)
    rim_right_obj.rotation_euler = Euler((math.radians(64.0), math.radians(-26.0), math.radians(125.0)), "XYZ")
    lights["right_rim"] = rim_right

    # 4. Crimson Fill Light from Below
    crimson_fill = bpy.data.lights.new("eclipse_wyrm_crimson_fill", type="SUN")
    crimson_fill.energy = 2.4
    crimson_fill.color = (0.98, 0.16, 0.05)
    crimson_fill.angle = math.radians(15.0)
    crimson_fill_obj = bpy.data.objects.new("eclipse_wyrm_crimson_fill_obj", crimson_fill)
    bpy.context.collection.objects.link(crimson_fill_obj)
    crimson_fill_obj.rotation_euler = Euler((math.radians(-50.0), math.radians(8.0), math.radians(14.0)), "XYZ")
    lights["crimson_fill"] = crimson_fill

    # 5. Front-Left Specular Armor Catchlight
    catch_light = bpy.data.lights.new("eclipse_wyrm_catchlight", type="AREA")
    catch_light.energy = 24.0
    catch_light.color = (1.0, 0.78, 0.42)
    catch_light.size = 1.1
    catch_obj = bpy.data.objects.new("eclipse_wyrm_catchlight_obj", catch_light)
    bpy.context.collection.objects.link(catch_obj)
    catch_obj.location = Vector((-1.25, -3.1, 0.75))
    direction = (Vector((-0.05, 0.0, 0.05)) - catch_obj.location).normalized()
    catch_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    lights["catchlight"] = catch_light

    # 6. Throat Fire Point Light inside jaws
    throat_light = bpy.data.lights.new("eclipse_wyrm_throat_light", type="POINT")
    throat_light.energy = 32.0
    throat_light.color = (1.0, 0.42, 0.08)
    throat_light.shadow_soft_size = 0.07
    throat_light_obj = bpy.data.objects.new("eclipse_wyrm_throat_light_obj", throat_light)
    bpy.context.collection.objects.link(throat_light_obj)
    throat_light_obj.location = Vector((-0.18, -0.62, -0.14))
    lights["throat_light"] = throat_light

    return lights, throat_light_obj


def create_starry_godray_backdrop(animated_nodes):
    """
    1:1 Square Backdrop Plane behind the eclipse sun & obsidian ring:
    - Radial crimson and gold god rays bursting outward from the center behind the wyrm
    - Dark starry sky in the outer margins so circular & square crops have rich depth
    - Circle-safe radial falloff so corners stay calm and dark
    """
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 9.5, 0.0), rotation=(math.pi / 2, 0.0, 0.0))
    plane = bpy.context.active_object
    plane.name = "eclipse_wyrm_sky_backdrop"
    plane.scale = (11.5, 11.5, 1.0)
    plane.visible_shadow = False
    plane.visible_diffuse = False
    plane.visible_glossy = False

    mat = bpy.data.materials.new("eclipse_wyrm_sky_mat")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    emit = nt.nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.55

    tex_coord = nt.nodes.new("ShaderNodeTexCoord")
    sep_xyz = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tex_coord.outputs["Generated"], sep_xyz.inputs["Vector"])

    # Center at (0.5, 0.53) to align with the black eclipse sun behind the wyrm's head
    sub_x = nt.nodes.new("ShaderNodeMath")
    sub_x.operation = "SUBTRACT"
    sub_x.inputs[1].default_value = 0.50
    nt.links.new(sep_xyz.outputs["X"], sub_x.inputs[0])

    sub_y = nt.nodes.new("ShaderNodeMath")
    sub_y.operation = "SUBTRACT"
    sub_y.inputs[1].default_value = 0.53
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

    # Radial god-ray streaks (4D periodic)
    noise_rays = nt.nodes.new("ShaderNodeTexNoise")
    noise_rays.noise_dimensions = "4D"
    noise_rays.inputs["Scale"].default_value = 20.0
    noise_rays.inputs["Detail"].default_value = 3.0
    noise_rays.inputs["Roughness"].default_value = 0.58
    noise_rays.inputs["W"].default_value = 0.0
    nt.links.new(vec_norm.outputs["Vector"], noise_rays.inputs["Vector"])
    animated_nodes["ray_noise_w"] = noise_rays.inputs["W"]

    # Nebula / cloud modulation (4D periodic)
    noise_nebula = nt.nodes.new("ShaderNodeTexNoise")
    noise_nebula.noise_dimensions = "4D"
    noise_nebula.inputs["Scale"].default_value = 4.2
    noise_nebula.inputs["Detail"].default_value = 3.0
    noise_nebula.inputs["Roughness"].default_value = 0.62
    noise_nebula.inputs["Distortion"].default_value = 0.28
    noise_nebula.inputs["W"].default_value = 0.0
    nt.links.new(comb_delta.outputs["Vector"], noise_nebula.inputs["Vector"])
    animated_nodes["sky_noise_w"] = noise_nebula.inputs["W"]

    # Radial falloff from eclipse center (keeps outer circle margin dark)
    mul_dist = nt.nodes.new("ShaderNodeMath")
    mul_dist.operation = "MULTIPLY"
    mul_dist.inputs[1].default_value = -3.4
    nt.links.new(vec_len.outputs["Value"], mul_dist.inputs[0])

    exp_falloff = nt.nodes.new("ShaderNodeMath")
    exp_falloff.operation = "EXPONENT"
    nt.links.new(mul_dist.outputs["Value"], exp_falloff.inputs[0])

    mix_ray_neb = nt.nodes.new("ShaderNodeMath")
    mix_ray_neb.operation = "MULTIPLY"
    nt.links.new(noise_rays.outputs["Fac"], mix_ray_neb.inputs[0])
    nt.links.new(noise_nebula.outputs["Fac"], mix_ray_neb.inputs[1])

    mul_radial = nt.nodes.new("ShaderNodeMath")
    mul_radial.operation = "MULTIPLY"
    nt.links.new(mix_ray_neb.outputs["Value"], mul_radial.inputs[0])
    nt.links.new(exp_falloff.outputs["Value"], mul_radial.inputs[1])

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp.color_ramp,
        [
            (0.0, (0.002, 0.001, 0.003, 1.0)),
            (0.09, (0.10, 0.008, 0.016, 1.0)),
            (0.22, (0.68, 0.05, 0.04, 1.0)),
            (0.42, (0.98, 0.34, 0.06, 1.0)),
            (0.66, (1.0, 0.84, 0.28, 1.0)),
        ],
    )
    nt.links.new(mul_radial.outputs["Value"], ramp.inputs["Fac"])

    # Crisp pinpoint starfield in the dark sky
    vor_stars = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_stars.inputs["Scale"].default_value = 145.0
    nt.links.new(tex_coord.outputs["Generated"], vor_stars.inputs["Vector"])

    star_thresh = nt.nodes.new("ShaderNodeMapRange")
    star_thresh.inputs["From Min"].default_value = 0.016
    star_thresh.inputs["From Max"].default_value = 0.0
    star_thresh.inputs["To Min"].default_value = 0.0
    star_thresh.inputs["To Max"].default_value = 0.55
    nt.links.new(vor_stars.outputs["Distance"], star_thresh.inputs["Value"])

    mix_stars = nt.nodes.new("ShaderNodeMixRGB")
    mix_stars.blend_type = "ADD"
    mix_stars.inputs["Color2"].default_value = (1.0, 0.90, 0.72, 1.0)
    nt.links.new(star_thresh.outputs["Result"], mix_stars.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix_stars.inputs["Color1"])

    nt.links.new(mix_stars.outputs["Color"], emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])

    plane.data.materials.append(mat)
    return plane


def create_eclipse_sun_and_obsidian_ring(animated_nodes):
    """
    Directly behind the wyrm's head:
      1. Black eclipse sun sphere with razor-sharp blazing gold corona & inner crimson chromosphere
      2. Outer solar corona glow halo (providing high contrast behind the dark wyrm silhouette even at 40x40 px)
      3. Diamond-ring flare on the upper-left limb of the eclipse
      4. Slim floating bevelled obsidian ring with glowing kintsugi gold veins & architectural clasps
         that frames the portrait inside the circle-safe zone (with >8% margin from frame edges)
    """
    sun_center = Vector((0.0, 2.35, 0.10))

    # 1. Outer Solar Corona Glow Torus behind the Black Sun
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.04,
        minor_radius=0.14,
        major_segments=96,
        minor_segments=24,
        location=sun_center + Vector((0.0, 0.08, 0.0)),
        rotation=(math.pi / 2, 0.0, 0.0),
    )
    corona_torus = bpy.context.active_object
    corona_torus.name = "eclipse_wyrm_corona_torus"
    corona_torus.scale = (1.0, 1.0, 0.25)
    corona_torus.visible_shadow = False
    corona_torus.visible_diffuse = False
    corona_torus.visible_glossy = False
    for p in corona_torus.data.polygons:
        p.use_smooth = True

    mat_corona = bpy.data.materials.new("eclipse_wyrm_corona_mat")
    mat_corona.use_nodes = True
    ntc = mat_corona.node_tree
    ntc.nodes.clear()
    outc = ntc.nodes.new("ShaderNodeOutputMaterial")
    emitc = ntc.nodes.new("ShaderNodeEmission")
    lwc = ntc.nodes.new("ShaderNodeLayerWeight")
    lwc.inputs["Blend"].default_value = 0.40
    rampc = ntc.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampc.color_ramp,
        [
            (0.0, (1.0, 0.88, 0.38, 1.0)),
            (0.45, (1.0, 0.48, 0.08, 1.0)),
            (0.76, (0.72, 0.07, 0.04, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntc.links.new(lwc.outputs["Facing"], rampc.inputs["Fac"])
    ntc.links.new(rampc.outputs["Color"], emitc.inputs["Color"])
    emitc.inputs["Strength"].default_value = 3.6
    animated_nodes["corona_strength"] = emitc.inputs["Strength"]
    ntc.links.new(emitc.outputs["Emission"], outc.inputs["Surface"])
    corona_torus.data.materials.append(mat_corona)

    # 2. Pitch-Black Eclipse Sun Sphere with Razor-Thin Blazing Gold Rim
    bpy.ops.mesh.primitive_uv_sphere_add(segments=72, ring_count=36, radius=1.01, location=sun_center)
    sun = bpy.context.active_object
    sun.name = "eclipse_wyrm_black_sun"
    sun.visible_shadow = False
    sun.visible_diffuse = False
    sun.visible_glossy = False
    for p in sun.data.polygons:
        p.use_smooth = True

    mat_sun = bpy.data.materials.new("eclipse_wyrm_black_sun_mat")
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
            (0.86, (0.001, 0.0005, 0.002, 1.0)),
            (0.94, (0.90, 0.16, 0.05, 1.0)),
            (0.988, (1.0, 0.90, 0.38, 1.0)),
        ],
    )
    nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
    emit.inputs["Strength"].default_value = 3.0
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    sun.data.materials.append(mat_sun)

    # 3. Diamond-Ring Flare on Upper-Left Limb of the Eclipse
    flare_pos = sun_center + Vector((-0.72, -0.12, 0.71))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=0.105, location=flare_pos)
    flare = bpy.context.active_object
    flare.name = "eclipse_wyrm_diamond_flare"
    flare.scale = (1.35, 0.5, 1.35)
    flare.visible_shadow = False
    flare.visible_diffuse = False
    flare.visible_glossy = False
    mat_flare = bpy.data.materials.new("eclipse_wyrm_flare_mat")
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
            (0.55, (1.0, 0.80, 0.30, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    ntf.links.new(lwf.outputs["Facing"], rampf.inputs["Fac"])
    ntf.links.new(rampf.outputs["Color"], emitf.inputs["Color"])
    emitf.inputs["Strength"].default_value = 7.8
    animated_nodes["diamond_flare_strength"] = emitf.inputs["Strength"]
    ntf.links.new(emitf.outputs["Emission"], outf.inputs["Surface"])
    flare.data.materials.append(mat_flare)

    # 4. Slim Floating Obsidian Ring with Glowing Kintsugi Gold Veins (Matching the Banner's Ring)
    mat_obs = bpy.data.materials.new("eclipse_wyrm_obsidian_ring_mat")
    mat_obs.use_nodes = True
    nto = mat_obs.node_tree
    nto.nodes.clear()
    outo = nto.nodes.new("ShaderNodeOutputMaterial")

    tco = nto.nodes.new("ShaderNodeTexCoord")
    noise_obs = nto.nodes.new("ShaderNodeTexNoise")
    noise_obs.inputs["Scale"].default_value = 4.2
    noise_obs.inputs["Detail"].default_value = 2.5
    noise_obs.inputs["Distortion"].default_value = 0.55
    nto.links.new(tco.outputs["Object"], noise_obs.inputs["Vector"])

    vein_patch = nto.nodes.new("ShaderNodeTexNoise")
    vein_patch.inputs["Scale"].default_value = 1.8
    vein_patch.inputs["Detail"].default_value = 2.0
    nto.links.new(tco.outputs["Object"], vein_patch.inputs["Vector"])

    vein_mask = nto.nodes.new("ShaderNodeMapRange")
    vein_mask.interpolation_type = "SMOOTHSTEP"
    vein_mask.inputs["From Min"].default_value = 0.28
    vein_mask.inputs["From Max"].default_value = 0.64
    vein_mask.inputs["To Min"].default_value = 0.30
    vein_mask.inputs["To Max"].default_value = 1.0
    nto.links.new(vein_patch.outputs["Fac"], vein_mask.inputs["Value"])

    mix_obs_vec = nto.nodes.new("ShaderNodeMixRGB")
    mix_obs_vec.inputs["Fac"].default_value = 0.35
    nto.links.new(tco.outputs["Object"], mix_obs_vec.inputs["Color1"])
    nto.links.new(noise_obs.outputs["Color"], mix_obs_vec.inputs["Color2"])

    voro = nto.nodes.new("ShaderNodeTexVoronoi")
    voro.voronoi_dimensions = "4D"
    voro.feature = "DISTANCE_TO_EDGE"
    voro.inputs["Scale"].default_value = 3.2
    voro.inputs["W"].default_value = 0.0
    nto.links.new(mix_obs_vec.outputs["Color"], voro.inputs["Vector"])
    animated_nodes["obsidian_vein_w"] = voro.inputs["W"]

    rampo = nto.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampo.color_ramp,
        [
            (0.0, (1.0, 0.88, 0.28, 1.0)),
            (0.014, (0.95, 0.26, 0.05, 1.0)),
            (0.026, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nto.links.new(voro.outputs["Distance"], rampo.inputs["Fac"])

    masked_vein = nto.nodes.new("ShaderNodeMixRGB")
    masked_vein.blend_type = "MULTIPLY"
    masked_vein.inputs["Fac"].default_value = 1.0
    nto.links.new(rampo.outputs["Color"], masked_vein.inputs["Color1"])
    nto.links.new(vein_mask.outputs["Result"], masked_vein.inputs["Color2"])

    shader_obs, emit_obs = build_pbr_plus_rim_shader(
        nto,
        base_rgb=(0.012, 0.008, 0.016),
        metallic=0.52,
        roughness=0.14,
        spec_ior_level=0.90,
        gold_rim_rgb=(1.0, 0.68, 0.20),
        crimson_fill_rgb=(0.42, 0.05, 0.02),
        bump_height_socket=voro.outputs["Distance"],
        bump_strength=0.55,
        bump_distance=0.018,
        extra_emit_socket=masked_vein.outputs["Color"],
        extra_emit_strength=1.65,
        rim_power=1.35,
    )
    animated_nodes["obsidian_vein_strength"] = emit_obs.inputs["Strength"]
    nto.links.new(shader_obs.outputs["Shader"], outo.inputs["Surface"])

    ring_rig = bpy.data.objects.new("eclipse_wyrm_ring_rig", None)
    bpy.context.collection.objects.link(ring_rig)
    ring_rig.location = sun_center
    # Tilted slightly from vertical so the full slim ring frames the eclipse & wyrm within the circle-safe zone
    ring_rig.rotation_euler = Euler((math.radians(78.0), math.radians(-12.0), math.radians(8.0)), "XYZ")

    ring_spin_pivot = bpy.data.objects.new("eclipse_wyrm_ring_spin_pivot", None)
    bpy.context.collection.objects.link(ring_spin_pivot)
    ring_spin_pivot.parent = ring_rig

    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.32,
        minor_radius=0.075,
        major_segments=112,
        minor_segments=20,
        location=(0, 0, 0),
    )
    ring_mesh = bpy.context.active_object
    ring_mesh.name = "eclipse_wyrm_obsidian_ring"
    ring_mesh.scale = (1.0, 1.0, 0.62)
    ring_mesh.parent = ring_spin_pivot
    bev = ring_mesh.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 2
    for p in ring_mesh.data.polygons:
        p.use_smooth = True
    ring_mesh.data.materials.append(mat_obs)

    # 8 Sleek Obsidian Clasps around the slim ring (so the 1-full-turn rotation is visually unmistakable)
    for i in range(8):
        ang = (i / 8.0) * math.pi * 2.0
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(math.cos(ang) * 1.32, math.sin(ang) * 1.32, 0.0),
            rotation=(0.0, 0.0, ang),
        )
        clasp = bpy.context.active_object
        clasp.name = f"eclipse_wyrm_ring_clasp_{i:02d}"
        clasp.scale = (0.095, 0.14, 0.095)
        clasp.parent = ring_spin_pivot
        bvc = clasp.modifiers.new("Bevel", "BEVEL")
        bvc.width = 0.012
        bvc.segments = 2
        for p in clasp.data.polygons:
            p.use_smooth = True
        clasp.data.materials.append(mat_obs)

    return ring_rig, ring_spin_pivot


def build_eclipse_wyrm_materials(animated_nodes):
    """
    Builds film-quality PBR + Emissive materials for the Eclipse Wyrm portrait:
      1. mat_scales: Armored dark obsidian-crimson scales with Voronoi relief, glossy gold corona rim & localized magma veins
      2. mat_horn: Swept-back obsidian-bone horns & fangs with gold specular ridges
      3. mat_gold_crown: Gleaming forged gold crown spikes with fiery self-luminous edge sheen
      4. mat_eye: Blazing molten gold-crimson iris (paired with physical pitch-black slit pupil mesh)
      5. mat_pupil: Pure pitch-black zero-reflection slit pupil material
      6. mat_throat: Glowing molten dragonfire inside the throat & jaws
      7. mat_smoke: Organic curling translucent ember-lit nostril smoke wisps
    """
    # 1. Armored Obsidian-Crimson Scales Material (High-relief dark obsidian scales with localized magma seams)
    mat_scales = bpy.data.materials.new("eclipse_wyrm_scales_mat")
    mat_scales.use_nodes = True
    nt = mat_scales.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")

    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor_scale = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_scale.inputs["Scale"].default_value = 24.0
    nt.links.new(tc.outputs["Object"], vor_scale.inputs["Vector"])

    vor_edge = nt.nodes.new("ShaderNodeTexVoronoi")
    vor_edge.feature = "DISTANCE_TO_EDGE"
    vor_edge.inputs["Scale"].default_value = 24.0
    nt.links.new(tc.outputs["Object"], vor_edge.inputs["Vector"])

    # Low-frequency noise patch so only ~30% of deep throat/neck scale crevices glow with magma
    patch_noise = nt.nodes.new("ShaderNodeTexNoise")
    patch_noise.inputs["Scale"].default_value = 2.4
    patch_noise.inputs["Detail"].default_value = 2.0
    nt.links.new(tc.outputs["Object"], patch_noise.inputs["Vector"])

    patch_mask = nt.nodes.new("ShaderNodeMapRange")
    patch_mask.interpolation_type = "SMOOTHSTEP"
    patch_mask.inputs["From Min"].default_value = 0.52
    patch_mask.inputs["From Max"].default_value = 0.72
    patch_mask.inputs["To Min"].default_value = 0.06
    patch_mask.inputs["To Max"].default_value = 1.0
    nt.links.new(patch_noise.outputs["Fac"], patch_mask.inputs["Value"])

    ramp_crevice = nt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_crevice.color_ramp,
        [
            (0.0, (0.95, 0.22, 0.03, 1.0)),
            (0.014, (0.38, 0.03, 0.01, 1.0)),
            (0.032, (0.0, 0.0, 0.0, 1.0)),
            (1.0, (0.0, 0.0, 0.0, 1.0)),
        ],
    )
    nt.links.new(vor_edge.outputs["Distance"], ramp_crevice.inputs["Fac"])

    masked_crevice = nt.nodes.new("ShaderNodeMixRGB")
    masked_crevice.blend_type = "MULTIPLY"
    masked_crevice.inputs["Fac"].default_value = 1.0
    nt.links.new(ramp_crevice.outputs["Color"], masked_crevice.inputs["Color1"])
    nt.links.new(patch_mask.outputs["Result"], masked_crevice.inputs["Color2"])

    shader_scales, emit_scales = build_pbr_plus_rim_shader(
        nt,
        base_rgb=(0.012, 0.005, 0.008),
        metallic=0.58,
        roughness=0.18,
        spec_ior_level=0.90,
        gold_rim_rgb=(1.0, 0.76, 0.22),
        crimson_fill_rgb=(0.75, 0.09, 0.03),
        bump_height_socket=vor_scale.outputs["Distance"],
        bump_strength=0.85,
        bump_distance=0.025,
        extra_emit_socket=masked_crevice.outputs["Color"],
        extra_emit_strength=1.10,
        rim_power=1.45,
    )
    animated_nodes["scale_crevice_strength"] = emit_scales.inputs["Strength"]
    nt.links.new(shader_scales.outputs["Shader"], out.inputs["Surface"])

    # 2. Swept-Back Obsidian Horns & Fangs Material
    mat_horn = bpy.data.materials.new("eclipse_wyrm_horn_mat")
    mat_horn.use_nodes = True
    nth = mat_horn.node_tree
    nth.nodes.clear()
    outh = nth.nodes.new("ShaderNodeOutputMaterial")

    tch = nth.nodes.new("ShaderNodeTexCoord")
    noise_horn = nth.nodes.new("ShaderNodeTexNoise")
    noise_horn.inputs["Scale"].default_value = 22.0
    noise_horn.inputs["Detail"].default_value = 3.0
    nth.links.new(tch.outputs["Object"], noise_horn.inputs["Vector"])

    shader_horn, _ = build_pbr_plus_rim_shader(
        nth,
        base_rgb=(0.022, 0.012, 0.010),
        metallic=0.68,
        roughness=0.15,
        spec_ior_level=0.92,
        gold_rim_rgb=(1.0, 0.84, 0.30),
        crimson_fill_rgb=(0.58, 0.08, 0.02),
        bump_height_socket=noise_horn.outputs["Fac"],
        bump_strength=0.48,
        bump_distance=0.015,
        extra_emit_socket=None,
        extra_emit_strength=1.25,
        rim_power=1.55,
    )
    nth.links.new(shader_horn.outputs["Shader"], outh.inputs["Surface"])

    # 3. Crown of Small Gold Spikes Material (Royal Forged Solar Gold)
    mat_gold_crown = bpy.data.materials.new("eclipse_wyrm_gold_crown_mat")
    mat_gold_crown.use_nodes = True
    ntg = mat_gold_crown.node_tree
    ntg.nodes.clear()
    outg = ntg.nodes.new("ShaderNodeOutputMaterial")

    bsdf_g = ntg.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf_g.inputs["Base Color"].default_value = (1.0, 0.76, 0.20, 1.0)
    bsdf_g.inputs["Metallic"].default_value = 0.96
    bsdf_g.inputs["Roughness"].default_value = 0.14

    lw_g = ntg.nodes.new("ShaderNodeLayerWeight")
    lw_g.inputs["Blend"].default_value = 0.45
    ramp_g = ntg.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_g.color_ramp,
        [
            (0.0, (0.38, 0.18, 0.03, 1.0)),
            (0.55, (1.0, 0.72, 0.18, 1.0)),
            (0.92, (1.0, 0.95, 0.65, 1.0)),
        ],
    )
    ntg.links.new(lw_g.outputs["Fresnel"], ramp_g.inputs["Fac"])

    emit_g = ntg.nodes.new("ShaderNodeEmission")
    emit_g.inputs["Strength"].default_value = 2.6
    ntg.links.new(ramp_g.outputs["Color"], emit_g.inputs["Color"])
    animated_nodes["crown_gold_strength"] = emit_g.inputs["Strength"]

    add_g = ntg.nodes.new("ShaderNodeAddShader")
    ntg.links.new(bsdf_g.outputs["BSDF"], add_g.inputs[0])
    ntg.links.new(emit_g.outputs["Emission"], add_g.inputs[1])
    ntg.links.new(add_g.outputs["Shader"], outg.inputs["Surface"])

    # 4. Molten Iris Material (Rich gold-amber-crimson gradient with dark slit core, paired with physical black slit pupil)
    mat_eye = bpy.data.materials.new("eclipse_wyrm_molten_eye_mat")
    mat_eye.use_nodes = True
    nte = mat_eye.node_tree
    nte.nodes.clear()
    oute = nte.nodes.new("ShaderNodeOutputMaterial")

    tce = nte.nodes.new("ShaderNodeTexCoord")
    sepe = nte.nodes.new("ShaderNodeSeparateXYZ")
    nte.links.new(tce.outputs["Object"], sepe.inputs["Vector"])

    # In eye_piv local space, +X points toward the camera, Y is horizontal across the eye, and Z is vertical!
    abs_ey = nte.nodes.new("ShaderNodeMath")
    abs_ey.operation = "ABSOLUTE"
    nte.links.new(sepe.outputs["Y"], abs_ey.inputs[0])

    ramp_eye = nte.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramp_eye.color_ramp,
        [
            (0.0, (0.0, 0.0, 0.0, 1.0)),         # Pitch-black vertical slit pupil center
            (0.015, (0.0, 0.0, 0.0, 1.0)),
            (0.022, (1.0, 0.92, 0.45, 1.0)),     # Bright molten gold inner iris ring
            (0.050, (1.0, 0.52, 0.08, 1.0)),     # Deep solar amber mid-iris
            (0.080, (0.85, 0.10, 0.02, 1.0)),    # Fiery crimson outer sclera rim
        ],
    )
    nte.links.new(abs_ey.outputs["Value"], ramp_eye.inputs["Fac"])

    emite = nte.nodes.new("ShaderNodeEmission")
    emite.inputs["Strength"].default_value = 2.8
    animated_nodes["eye_glow_strength"] = emite.inputs["Strength"]
    nte.links.new(ramp_eye.outputs["Color"], emite.inputs["Color"])
    nte.links.new(emite.outputs["Emission"], oute.inputs["Surface"])

    # 5. Pure Pitch-Black Vertical Slit Pupil Material (Zero reflection so the slit stays 100% black)
    mat_pupil = bpy.data.materials.new("eclipse_wyrm_slit_pupil_mat")
    mat_pupil.use_nodes = True
    ntp = mat_pupil.node_tree
    ntp.nodes.clear()
    outp = ntp.nodes.new("ShaderNodeOutputMaterial")
    emitp = ntp.nodes.new("ShaderNodeEmission")
    emitp.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    emitp.inputs["Strength"].default_value = 0.0
    ntp.links.new(emitp.outputs["Emission"], outp.inputs["Surface"])

    # 6. Throat Fire Glow Material
    mat_throat = bpy.data.materials.new("eclipse_wyrm_throat_fire_mat")
    mat_throat.use_nodes = True
    ntt = mat_throat.node_tree
    ntt.nodes.clear()
    outt = ntt.nodes.new("ShaderNodeOutputMaterial")

    tct = ntt.nodes.new("ShaderNodeTexCoord")
    noiset = ntt.nodes.new("ShaderNodeTexNoise")
    noiset.noise_dimensions = "4D"
    noiset.inputs["Scale"].default_value = 6.5
    noiset.inputs["Detail"].default_value = 3.0
    noiset.inputs["W"].default_value = 0.0
    ntt.links.new(tct.outputs["Object"], noiset.inputs["Vector"])
    animated_nodes["throat_noise_w"] = noiset.inputs["W"]

    rampt = ntt.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        rampt.color_ramp,
        [
            (0.0, (0.48, 0.03, 0.01, 1.0)),
            (0.42, (0.98, 0.28, 0.04, 1.0)),
            (0.78, (1.0, 0.82, 0.24, 1.0)),
            (1.0, (1.0, 0.96, 0.75, 1.0)),
        ],
    )
    ntt.links.new(noiset.outputs["Fac"], rampt.inputs["Fac"])

    emitt = ntt.nodes.new("ShaderNodeEmission")
    emitt.inputs["Strength"].default_value = 4.6
    animated_nodes["throat_glow_strength"] = emitt.inputs["Strength"]
    ntt.links.new(rampt.outputs["Color"], emitt.inputs["Color"])
    ntt.links.new(emitt.outputs["Emission"], outt.inputs["Surface"])

    # 7. Organic Nostril Smoke Wisps Material (Turbulent Noise + Soft Quadratic Edge Fade)
    mat_smoke = bpy.data.materials.new("eclipse_wyrm_nostril_smoke_mat")
    mat_smoke.use_nodes = True
    nts = mat_smoke.node_tree
    nts.nodes.clear()
    outs = nts.nodes.new("ShaderNodeOutputMaterial")

    tcs = nts.nodes.new("ShaderNodeTexCoord")
    maps = nts.nodes.new("ShaderNodeMapping")
    nts.links.new(tcs.outputs["Object"], maps.inputs["Vector"])
    animated_nodes["smoke_mapping_loc"] = maps.inputs["Location"]

    noises = nts.nodes.new("ShaderNodeTexNoise")
    noises.noise_dimensions = "4D"
    noises.inputs["Scale"].default_value = 7.5
    noises.inputs["Detail"].default_value = 4.0
    noises.inputs["Roughness"].default_value = 0.68
    noises.inputs["Distortion"].default_value = 0.85
    noises.inputs["W"].default_value = 0.0
    nts.links.new(maps.outputs["Vector"], noises.inputs["Vector"])
    animated_nodes["smoke_noise_w"] = noises.inputs["W"]

    lws = nts.nodes.new("ShaderNodeLayerWeight")
    lws.inputs["Blend"].default_value = 0.35

    inv_fresnel = nts.nodes.new("ShaderNodeMath")
    inv_fresnel.operation = "SUBTRACT"
    inv_fresnel.inputs[0].default_value = 1.0
    nts.links.new(lws.outputs["Fresnel"], inv_fresnel.inputs[1])

    # Cube the facing falloff so smoke edges have zero hard shell boundaries
    pow_facing = nts.nodes.new("ShaderNodeMath")
    pow_facing.operation = "POWER"
    pow_facing.inputs[1].default_value = 2.8
    nts.links.new(inv_fresnel.outputs["Value"], pow_facing.inputs[0])

    mul_s = nts.nodes.new("ShaderNodeMath")
    mul_s.operation = "MULTIPLY"
    nts.links.new(noises.outputs["Fac"], mul_s.inputs[0])
    nts.links.new(pow_facing.outputs["Value"], mul_s.inputs[1])

    ramps_col = nts.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramps_col.color_ramp,
        [
            (0.0, (0.04, 0.012, 0.016, 1.0)),
            (0.45, (0.52, 0.10, 0.03, 1.0)),
            (0.76, (1.0, 0.54, 0.12, 1.0)),
            (1.0, (1.0, 0.86, 0.38, 1.0)),
        ],
    )
    nts.links.new(mul_s.outputs["Value"], ramps_col.inputs["Fac"])

    ramps_alpha = nts.nodes.new("ShaderNodeValToRGB")
    set_color_ramp_stops(
        ramps_alpha.color_ramp,
        [
            (0.0, (0.0, 0.0, 0.0, 1.0)),
            (0.28, (0.0, 0.0, 0.0, 1.0)),
            (0.60, (0.28, 0.28, 0.28, 1.0)),
            (1.0, (0.58, 0.58, 0.58, 1.0)),
        ],
    )
    nts.links.new(mul_s.outputs["Value"], ramps_alpha.inputs["Fac"])

    transp_s = nts.nodes.new("ShaderNodeBsdfTransparent")
    emits = nts.nodes.new("ShaderNodeEmission")
    emits.inputs["Strength"].default_value = 2.0
    animated_nodes["smoke_glow_strength"] = emits.inputs["Strength"]
    nts.links.new(ramps_col.outputs["Color"], emits.inputs["Color"])

    mix_s = nts.nodes.new("ShaderNodeMixShader")
    nts.links.new(ramps_alpha.outputs["Color"], mix_s.inputs["Fac"])
    nts.links.new(transp_s.outputs["BSDF"], mix_s.inputs[1])
    nts.links.new(emits.outputs["Emission"], mix_s.inputs[2])
    nts.links.new(mix_s.outputs["Shader"], outs.inputs["Surface"])

    return mat_scales, mat_horn, mat_gold_crown, mat_eye, mat_pupil, mat_throat, mat_smoke


def create_eclipse_wyrm_portrait(animated_nodes):
    """
    Builds the three-quarter head-and-neck portrait of the Eclipse Wyrm centered in the 1:1 frame:
      - Muscular S-curved armored neck & shoulder bust extending cleanly into the lower border
      - Sculpted predatory dragon head in commanding three-quarter view (centered in the eclipse halo)
      - Parted fanged jaws with glowing molten throat fire inside
      - Large, fierce glowing molten eyes with razor-sharp vertical dark slit pupils + smooth blink animation
      - Pulsing nostrils with organic curling smoke wisps & rising nostril embers
      - Swept-back curved royal obsidian horns
      - Crown of small gleaming gold spikes atop the cranial crest
    """
    mat_scales, mat_horn, mat_gold_crown, mat_eye, mat_pupil, mat_throat, mat_smoke = build_eclipse_wyrm_materials(animated_nodes)

    wyrm_root = bpy.data.objects.new("eclipse_wyrm_root", None)
    bpy.context.collection.objects.link(wyrm_root)
    wyrm_root.location = Vector((0.0, 0.0, 0.0))

    neck_pivot = bpy.data.objects.new("eclipse_wyrm_neck_pivot", None)
    bpy.context.collection.objects.link(neck_pivot)
    neck_pivot.parent = wyrm_root
    neck_pivot.location = Vector((0.16, 0.12, -0.76))

    # ─── 1. MUSCULAR ARMORED NECK & BROADENED CHEST/SHOULDER BUST ───────────────
    neck_segments = [
        (Vector((0.30, 0.38, -0.78)), 0.62, (0.12, -0.18, 0.18), (1.55, 1.20, 1.15)),
        (Vector((0.22, 0.28, -0.38)), 0.46, (0.10, -0.18, 0.16), (1.35, 1.15, 1.15)),
        (Vector((0.16, 0.18, -0.06)), 0.37, (0.08, -0.16, 0.14), (1.15, 1.12, 1.20)),
        (Vector((0.10, 0.10, 0.18)), 0.33, (0.06, -0.14, 0.12), (1.10, 1.12, 1.22)),
        (Vector((0.04, 0.03, 0.42)), 0.30, (0.04, -0.10, 0.09), (1.08, 1.10, 1.22)),
        (Vector((-0.02, -0.03, 0.62)), 0.27, (0.01, -0.06, 0.05), (1.06, 1.08, 1.18)),
    ]

    for idx, (pt, rad, rot_eul, seg_scale) in enumerate(neck_segments):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=rad, location=pt)
        seg = bpy.context.active_object
        seg.name = f"eclipse_wyrm_neck_seg_{idx:02d}"
        seg.scale = seg_scale
        seg.rotation_euler = rot_eul
        seg.parent = neck_pivot
        for p in seg.data.polygons:
            p.use_smooth = True
        seg.data.materials.append(mat_scales)

        # Overlapping Front/Ventral Throat Armor Plate (Scute)
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=pt + Vector((-0.42 * rad, -0.82 * rad, -0.04 * rad)),
            rotation=(0.24, -0.15, 0.28),
        )
        scute = bpy.context.active_object
        scute.name = f"eclipse_wyrm_throat_scute_{idx:02d}"
        scute.scale = (rad * 0.78, rad * 0.34, rad * 0.44)
        scute.parent = neck_pivot
        bvs = scute.modifiers.new("Bevel", "BEVEL")
        bvs.width = 0.015
        bvs.segments = 2
        for p in scute.data.polygons:
            p.use_smooth = True
        scute.data.materials.append(mat_horn)

        # Lateral Armored Scale Plates (sculpted overlapping dragon-scale silhouette on neck)
        for side in (-1, 1):
            for row_off in (-0.25, 0.25):
                bpy.ops.mesh.primitive_cone_add(
                    vertices=6,
                    radius1=rad * 0.38,
                    radius2=rad * 0.08,
                    depth=rad * 0.50,
                    location=pt + Vector((side * rad * 0.80 + row_off * 0.12, -0.35 * rad, row_off * rad * 0.4)),
                    rotation=(math.radians(-65.0), side * math.radians(38.0), side * math.radians(-25.0)),
                )
                lplate = bpy.context.active_object
                lplate.name = f"eclipse_wyrm_neck_scale_{idx:02d}_{side}_{int(row_off*10)}"
                lplate.scale = (1.0, 0.42, 1.0)
                lplate.parent = neck_pivot
                for p in lplate.data.polygons:
                    p.use_smooth = True
                lplate.data.materials.append(mat_scales)

        # Swept Dorsal Neck Spines along the back ridge
        bpy.ops.mesh.primitive_cone_add(
            vertices=10,
            radius1=rad * 0.22,
            radius2=0.006,
            depth=rad * 1.18,
            location=pt + Vector((0.46 * rad, 0.66 * rad, 0.18 * rad)),
            rotation=(math.radians(48.0), math.radians(35.0), math.radians(-20.0)),
        )
        dspine = bpy.context.active_object
        dspine.name = f"eclipse_wyrm_neck_spine_{idx:02d}"
        dspine.parent = neck_pivot
        for p in dspine.data.polygons:
            p.use_smooth = True
        dspine.data.materials.append(mat_horn)

    # ─── 2. SCULPTED DRAGON HEAD (THREE-QUARTER PORTRAIT FACING CAMERA) ─────────
    head_pivot = bpy.data.objects.new("eclipse_wyrm_head_pivot", None)
    bpy.context.collection.objects.link(head_pivot)
    head_pivot.parent = neck_pivot
    head_pivot.location = Vector((-0.05, -0.10, 0.78))
    head_pivot.scale = (1.22, 1.22, 1.22)
    # Three-quarter view: local +X is snout-forward, rotated toward camera-left (-Y, -X)
    head_pivot.rotation_euler = Euler((math.radians(5.0), math.radians(8.0), math.radians(-116.0)), "XYZ")

    # Cranium / Upper Skull Dome
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, radius=0.27, location=(0.05, 0.0, 0.06))
    cranium = bpy.context.active_object
    cranium.name = "eclipse_wyrm_cranium"
    cranium.scale = (1.30, 0.98, 0.88)
    cranium.parent = head_pivot
    for p in cranium.data.polygons:
        p.use_smooth = True
    cranium.data.materials.append(mat_scales)

    # Sculpted Armored Snout / Upper Jaw
    bpy.ops.mesh.primitive_cone_add(
        vertices=24,
        radius1=0.24,
        radius2=0.10,
        depth=0.58,
        location=(0.35, 0.0, 0.02),
        rotation=(0.0, math.radians(82.0), 0.0),
    )
    snout = bpy.context.active_object
    snout.name = "eclipse_wyrm_snout"
    snout.scale = (1.0, 0.84, 0.72)
    snout.parent = head_pivot
    for p in snout.data.polygons:
        p.use_smooth = True
    snout.data.materials.append(mat_scales)

    # Snout Bridge Overlapping Armor Plates (4 sculpted plates down the nasal ridge)
    for b_i in range(4):
        bx = 0.16 + b_i * 0.11
        bz = 0.16 - b_i * 0.024
        bsz = 0.115 - b_i * 0.015
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(bx, 0.0, bz),
            rotation=(0.0, math.radians(14.0), math.radians(45.0)),
        )
        bplate = bpy.context.active_object
        bplate.name = f"eclipse_wyrm_snout_plate_{b_i}"
        bplate.scale = (bsz, bsz * 0.95, 0.034)
        bplate.parent = head_pivot
        bvb = bplate.modifiers.new("Bevel", "BEVEL")
        bvb.width = 0.008
        bvb.segments = 2
        for p in bplate.data.polygons:
            p.use_smooth = True
        bplate.data.materials.append(mat_horn)

    # Cheekbones & Jowl Armor Plates
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(0.12, side * 0.20, -0.02),
            rotation=(side * 0.18, math.radians(12.0), side * 0.28),
        )
        cheek = bpy.context.active_object
        cheek.name = f"eclipse_wyrm_cheek_armor_{side}"
        cheek.scale = (0.19, 0.058, 0.098)
        cheek.parent = head_pivot
        bvc = cheek.modifiers.new("Bevel", "BEVEL")
        bvc.width = 0.012
        bvc.segments = 2
        for p in cheek.data.polygons:
            p.use_smooth = True
        cheek.data.materials.append(mat_scales)

    # Fierce Armored Brow Ridges Above Both Eyes (Also dips slightly during blink)
    brow_ridges = []
    for side in (-1, 1):
        brow_base_loc = Vector((0.19, side * 0.175, 0.165))
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=brow_base_loc,
            rotation=(side * 0.34, math.radians(-16.0), side * 0.26),
        )
        brow = bpy.context.active_object
        brow.name = f"eclipse_wyrm_brow_ridge_{side}"
        brow.scale = (0.175, 0.055, 0.040)
        brow.parent = head_pivot
        bvb = brow.modifiers.new("Bevel", "BEVEL")
        bvb.width = 0.009
        bvb.segments = 2
        for p in brow.data.polygons:
            p.use_smooth = True
        brow.data.materials.append(mat_horn)
        brow_ridges.append((brow, brow_base_loc))

    # ─── 3. PARTED JAWS, FANGS & GLOWING MOLTEN THROAT ──────────────────────────
    jaw_pivot = bpy.data.objects.new("eclipse_wyrm_jaw_pivot", None)
    bpy.context.collection.objects.link(jaw_pivot)
    jaw_pivot.parent = head_pivot
    jaw_pivot.location = Vector((0.06, 0.0, -0.08))
    jaw_pivot.rotation_euler = Euler((0.0, math.radians(18.0), 0.0), "XYZ")

    bpy.ops.mesh.primitive_cone_add(
        vertices=20,
        radius1=0.19,
        radius2=0.075,
        depth=0.50,
        location=(0.24, 0.0, -0.03),
        rotation=(0.0, math.radians(96.0), 0.0),
    )
    lower_jaw = bpy.context.active_object
    lower_jaw.name = "eclipse_wyrm_lower_jaw"
    lower_jaw.scale = (1.0, 0.76, 0.58)
    lower_jaw.parent = jaw_pivot
    for p in lower_jaw.data.polygons:
        p.use_smooth = True
    lower_jaw.data.materials.append(mat_scales)

    # Chin Spike on Lower Jaw
    bpy.ops.mesh.primitive_cone_add(
        vertices=10,
        radius1=0.045,
        radius2=0.005,
        depth=0.16,
        location=(0.46, 0.0, -0.08),
        rotation=(0.0, math.radians(135.0), 0.0),
    )
    chin_spike = bpy.context.active_object
    chin_spike.name = "eclipse_wyrm_chin_spike"
    chin_spike.parent = jaw_pivot
    for p in chin_spike.data.polygons:
        p.use_smooth = True
    chin_spike.data.materials.append(mat_horn)

    # Upper & Lower Interlocking Fangs
    for side in (-1, 1):
        for f_idx, x_off in enumerate((0.24, 0.34, 0.44, 0.52)):
            fang_len = 0.075 - f_idx * 0.008
            y_pos = side * (0.115 - f_idx * 0.014)
            # Upper fang
            bpy.ops.mesh.primitive_cone_add(
                vertices=10,
                radius1=0.018,
                radius2=0.002,
                depth=fang_len,
                location=(x_off, y_pos, -0.04 - f_idx * 0.006),
                rotation=(0.0, math.radians(168.0), 0.0),
            )
            ufang = bpy.context.active_object
            ufang.name = f"eclipse_wyrm_ufang_{side}_{f_idx}"
            ufang.parent = head_pivot
            for p in ufang.data.polygons:
                p.use_smooth = True
            ufang.data.materials.append(mat_horn)

            # Lower fang
            bpy.ops.mesh.primitive_cone_add(
                vertices=10,
                radius1=0.015,
                radius2=0.002,
                depth=fang_len * 0.88,
                location=(x_off - 0.06, y_pos * 0.88, 0.02),
                rotation=(0.0, math.radians(16.0), 0.0),
            )
            lfang = bpy.context.active_object
            lfang.name = f"eclipse_wyrm_lfang_{side}_{f_idx}"
            lfang.parent = jaw_pivot
            for p in lfang.data.polygons:
                p.use_smooth = True
            lfang.data.materials.append(mat_horn)

    # Glowing Molten Fire Core in Throat
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.135, location=(0.22, 0.0, -0.05))
    throat_core = bpy.context.active_object
    throat_core.name = "eclipse_wyrm_throat_core"
    throat_core.scale = (1.35, 0.72, 0.65)
    throat_core.parent = head_pivot
    for p in throat_core.data.polygons:
        p.use_smooth = True
    throat_core.data.materials.append(mat_throat)

    # ─── 4. GLOWING MOLTEN EYES WITH PHYSICAL RAZOR-SHARP VERTICAL SLIT PUPILS ──
    eye_meshes = []
    for side in (-1, 1):
        eye_loc = Vector((0.23, side * 0.195, 0.104)) if side == 1 else Vector((0.21, side * 0.185, 0.098))
        eye_piv = bpy.data.objects.new(f"eclipse_wyrm_eye_pivot_{side}", None)
        bpy.context.collection.objects.link(eye_piv)
        eye_piv.parent = head_pivot
        eye_piv.location = eye_loc
        # Since head_pivot is rotated Z = -116 deg, rotating eye_piv by Z = +26 deg aligns local +X
        # directly toward the camera, local Y horizontal across screen, and local Z vertical!
        eye_piv.rotation_euler = Euler((0.0, math.radians(-6.0), math.radians(26.0 - side * 10.0)), "XYZ")

        bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=18, radius=0.064, location=(0.0, 0.0, 0.0))
        eye = bpy.context.active_object
        eye.name = f"eclipse_wyrm_eye_{side}"
        # Depth along X = 0.55, width along Y = 1.32, height along Z = 0.92
        eye.scale = (0.55, 1.32, 0.92)
        eye.parent = eye_piv
        for p in eye.data.polygons:
            p.use_smooth = True
        eye.data.materials.append(mat_eye)

        # Physical pitch-black vertical cat/dragon slit pupil protruding toward camera (+X in eye_piv space)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=20,
            ring_count=14,
            radius=0.064,
            location=(0.018, 0.0, 0.0),
        )
        pupil = bpy.context.active_object
        pupil.name = f"eclipse_wyrm_pupil_slit_{side}"
        pupil.scale = (0.48, 0.22, 0.88)
        pupil.parent = eye_piv
        pupil.visible_shadow = False
        for p in pupil.data.polygons:
            p.use_smooth = True
        pupil.data.materials.append(mat_pupil)

        eye_meshes.append((eye_piv, brow_ridges[0 if side == -1 else 1]))

    # ─── 5. PULSING NOSTRILS & ORGANIC CURLING SMOKE WISPS + EMBER SPARKS ───────
    nostril_nodes = []
    rng_smoke = random.Random(90817)
    for side in (-1, 1):
        n_pos = Vector((0.54, side * 0.074, 0.028))
        # Nostril flare ring
        bpy.ops.mesh.primitive_torus_add(
            major_radius=0.028,
            minor_radius=0.010,
            major_segments=18,
            minor_segments=10,
            location=n_pos,
            rotation=(math.radians(35.0), side * math.radians(55.0), 0.0),
        )
        nostril_ring = bpy.context.active_object
        nostril_ring.name = f"eclipse_wyrm_nostril_ring_{side}"
        nostril_ring.parent = head_pivot
        for p in nostril_ring.data.polygons:
            p.use_smooth = True
        nostril_ring.data.materials.append(mat_horn)

        # Glowing ember core inside nostril
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.020, location=n_pos + Vector((-0.01, 0.0, -0.004)))
        nostril_core = bpy.context.active_object
        nostril_core.name = f"eclipse_wyrm_nostril_core_{side}"
        nostril_core.parent = head_pivot
        nostril_core.data.materials.append(mat_throat)

        # Sculpted organic curling smoke ribbon/wisp (curls forward-outward away from face & eyes!)
        smoke_piv = bpy.data.objects.new(f"eclipse_wyrm_smoke_pivot_{side}", None)
        bpy.context.collection.objects.link(smoke_piv)
        smoke_piv.parent = head_pivot
        smoke_piv.location = n_pos

        bm_s = bmesh.new()
        num_rings = 14
        ring_verts_list = []
        for r_i in range(num_rings):
            t_s = r_i / float(num_rings - 1)
            out_x = (0.06 * t_s + 0.10 * (t_s ** 1.4)) if side == 1 else (0.14 * t_s + 0.08 * (t_s ** 1.5))
            out_y = side * (0.03 + 0.24 * (t_s ** 1.2) + math.sin(t_s * 4.2) * 0.03)
            out_z = (0.02 + 0.30 * (t_s ** 1.3)) if side == 1 else (-0.02 + 0.18 * (t_s ** 1.4))
            center_s = Vector((out_x, out_y, out_z))
            rad_s = 0.018 + 0.052 * math.sin(t_s * math.pi * 0.85)
            ring_v = []
            n_seg = 12
            for k in range(n_seg):
                ang_k = (k / float(n_seg)) * math.pi * 2.0
                turb = 1.0 + 0.32 * math.sin(ang_k * 3.0 + t_s * 7.0) + rng_smoke.uniform(-0.10, 0.10)
                v_local = center_s + Vector((
                    math.cos(ang_k) * rad_s * turb,
                    math.sin(ang_k) * rad_s * turb * 0.90,
                    math.sin(ang_k * 2.0) * rad_s * 0.45,
                ))
                ring_v.append(bm_s.verts.new(v_local))
            ring_verts_list.append(ring_v)

        for r_i in range(num_rings - 1):
            r_a = ring_verts_list[r_i]
            r_b = ring_verts_list[r_i + 1]
            n_seg = len(r_a)
            for k in range(n_seg):
                k_next = (k + 1) % n_seg
                bm_s.faces.new((r_a[k], r_a[k_next], r_b[k_next], r_b[k]))

        smoke_mesh = bpy.data.meshes.new(f"eclipse_wyrm_nostril_smoke_mesh_{side}")
        bm_s.to_mesh(smoke_mesh)
        bm_s.free()
        for p in smoke_mesh.polygons:
            p.use_smooth = True

        smoke_obj = bpy.data.objects.new(f"eclipse_wyrm_nostril_smoke_{side}", smoke_mesh)
        bpy.context.collection.objects.link(smoke_obj)
        smoke_obj.parent = smoke_piv
        smoke_obj.visible_shadow = False
        smoke_obj.data.materials.append(mat_smoke)

        # Tiny glowing nostril embers rising along the smoke curl
        bm_ne = bmesh.new()
        for e_i in range(7):
            t_e = (e_i + 0.5) / 7.5
            out_x = (0.06 * t_e + 0.10 * (t_e ** 1.4)) if side == 1 else (0.14 * t_e + 0.08 * (t_e ** 1.5))
            out_y = side * (0.03 + 0.22 * (t_e ** 1.2))
            out_z = (0.02 + 0.28 * (t_e ** 1.3)) if side == 1 else (-0.02 + 0.16 * (t_e ** 1.4))
            e_loc = Vector((
                out_x + rng_smoke.uniform(-0.015, 0.015),
                out_y + rng_smoke.uniform(-0.015, 0.015),
                out_z + rng_smoke.uniform(-0.015, 0.015),
            ))
            bmesh.ops.create_icosphere(bm_ne, subdivisions=1, radius=0.0055, matrix=Matrix.Translation(e_loc))
        ne_mesh = bpy.data.meshes.new(f"eclipse_wyrm_nostril_embers_mesh_{side}")
        bm_ne.to_mesh(ne_mesh)
        bm_ne.free()
        ne_obj = bpy.data.objects.new(f"eclipse_wyrm_nostril_embers_{side}", ne_mesh)
        bpy.context.collection.objects.link(ne_obj)
        ne_obj.parent = smoke_piv
        ne_obj.visible_shadow = False
        ne_obj.data.materials.append(mat_throat)

        nostril_nodes.append((nostril_ring, smoke_piv, side))

    # ─── 6. SWEPT-BACK CURVED ROYAL HORNS (CIRCLE-SAFE SILHOUETTE) ──────────────
    for side in (-1, 1):
        # Primary Swept-Back Royal Horn
        h_curve = bpy.data.curves.new(f"eclipse_wyrm_horn_primary_curve_{side}", type="CURVE")
        h_curve.dimensions = "3D"
        h_curve.bevel_depth = 0.064
        h_curve.bevel_resolution = 5
        spl = h_curve.splines.new("BEZIER")
        horn_pts = [
            (Vector((-0.02, side * 0.14, 0.16)), 1.0),
            (Vector((-0.22, side * 0.24, 0.29)), 0.76),
            (Vector((-0.44, side * 0.31, 0.44)), 0.42),
            (Vector((-0.62, side * 0.33, 0.58)), 0.07),
        ]
        spl.bezier_points.add(len(horn_pts) - 1)
        for p_idx, (co, rad_h) in enumerate(horn_pts):
            bp = spl.bezier_points[p_idx]
            bp.co = co
            bp.radius = rad_h
            bp.handle_left_type = "AUTO"
            bp.handle_right_type = "AUTO"
        horn1 = bpy.data.objects.new(f"eclipse_wyrm_horn_primary_{side}", h_curve)
        bpy.context.collection.objects.link(horn1)
        horn1.parent = head_pivot
        horn1.data.materials.append(mat_horn)

        # Secondary Lower Swept Cheek Horn
        h2_curve = bpy.data.curves.new(f"eclipse_wyrm_horn_secondary_curve_{side}", type="CURVE")
        h2_curve.dimensions = "3D"
        h2_curve.bevel_depth = 0.042
        h2_curve.bevel_resolution = 4
        spl2 = h2_curve.splines.new("BEZIER")
        horn2_pts = [
            (Vector((-0.04, side * 0.18, 0.03)), 1.0),
            (Vector((-0.24, side * 0.28, 0.10)), 0.60),
            (Vector((-0.42, side * 0.33, 0.19)), 0.08),
        ]
        spl2.bezier_points.add(len(horn2_pts) - 1)
        for p_idx, (co, rad_h) in enumerate(horn2_pts):
            bp = spl2.bezier_points[p_idx]
            bp.co = co
            bp.radius = rad_h
            bp.handle_left_type = "AUTO"
            bp.handle_right_type = "AUTO"
        horn2 = bpy.data.objects.new(f"eclipse_wyrm_horn_secondary_{side}", h2_curve)
        bpy.context.collection.objects.link(horn2)
        horn2.parent = head_pivot
        horn2.data.materials.append(mat_horn)

    # ─── 7. CROWN OF SMALL GOLD SPIKES ATOP THE CRANIAL CREST ───────────────────
    crown_rig = bpy.data.objects.new("eclipse_wyrm_gold_crown_rig", None)
    bpy.context.collection.objects.link(crown_rig)
    crown_rig.parent = head_pivot
    crown_rig.location = Vector((0.02, 0.0, 0.24))

    num_crown_spikes = 9
    for c_i in range(num_crown_spikes):
        frac = (c_i / float(num_crown_spikes - 1)) * 2.0 - 1.0
        ang_arc = frac * math.radians(66.0)
        height_factor = 1.0 - 0.46 * abs(frac)
        spike_len = 0.22 * height_factor
        spike_rad = 0.026 * height_factor + 0.007

        pos_x = -0.05 * abs(frac) + 0.04 * (1.0 - abs(frac))
        pos_y = math.sin(ang_arc) * 0.165
        pos_z = math.cos(ang_arc) * 0.042

        bpy.ops.mesh.primitive_cone_add(
            vertices=8,
            radius1=spike_rad,
            radius2=0.003,
            depth=spike_len,
            location=(pos_x, pos_y, pos_z + spike_len * 0.42),
            rotation=(ang_arc * 0.55, math.radians(-18.0), 0.0),
        )
        cspike = bpy.context.active_object
        cspike.name = f"eclipse_wyrm_gold_crown_spike_{c_i:02d}"
        cspike.parent = crown_rig
        for p in cspike.data.polygons:
            p.use_smooth = True
        cspike.data.materials.append(mat_gold_crown)

    # Second inner row of 5 smaller gold diadem spikes along the central sagittal crest
    for s_i in range(5):
        sx = 0.12 - s_i * 0.065
        sz = 0.01 + s_i * 0.012
        slen = 0.13 + (2 - abs(s_i - 2)) * 0.022
        bpy.ops.mesh.primitive_cone_add(
            vertices=8,
            radius1=0.020,
            radius2=0.003,
            depth=slen,
            location=(sx, 0.0, sz + slen * 0.4),
            rotation=(0.0, math.radians(-24.0 - s_i * 5.0), 0.0),
        )
        mspike = bpy.context.active_object
        mspike.name = f"eclipse_wyrm_gold_crest_spike_{s_i:02d}"
        mspike.parent = crown_rig
        for p in mspike.data.polygons:
            p.use_smooth = True
        mspike.data.materials.append(mat_gold_crown)

    return wyrm_root, neck_pivot, head_pivot, jaw_pivot, eye_meshes, nostril_nodes


def create_rising_embers():
    """
    Creates slow-rising 3D embers in front of and behind the wyrm,
    staying inside the circle-safe zone while avoiding blocking the wyrm's eyes.
    """
    def make_ember_mat(name, col_rgba, strength):
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
                (0.0, (1.0, 0.96, 0.84, 1.0)),
                (0.45, col_rgba),
                (0.88, (0.02, 0.003, 0.004, 1.0)),
                (1.0, (0.002, 0.001, 0.003, 1.0)),
            ],
        )
        nt.links.new(lw.outputs["Facing"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], emit.inputs["Color"])
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
        return mat

    mat_ember_gold = make_ember_mat("eclipse_wyrm_ember_gold", (1.0, 0.76, 0.22, 1.0), 3.8)
    mat_ember_crimson = make_ember_mat("eclipse_wyrm_ember_crimson", (0.98, 0.24, 0.06, 1.0), 3.1)

    rng = random.Random(271828)
    ember_groups = []

    for g_idx, (num_pts, y_min, y_max, base_rad, mat_use) in enumerate(
        (
            (32, -1.8, -0.7, 0.013, mat_ember_crimson),  # Foreground embers in front of the wyrm
            (75, 0.5, 1.9, 0.011, mat_ember_gold),       # Midground embers around the wyrm & ring
            (90, 2.6, 5.2, 0.015, mat_ember_gold),       # Background embers behind the eclipse ring
        )
    ):
        bm = bmesh.new()
        placed = 0
        while placed < num_pts:
            r_polar = math.sqrt(rng.uniform(0.22, 1.0)) * 1.28
            ang_polar = rng.uniform(0.0, math.pi * 2.0)
            x0 = math.cos(ang_polar) * r_polar
            z0 = math.sin(ang_polar) * r_polar
            y0 = rng.uniform(y_min, y_max)

            # Keep foreground/midground embers out of the central head & eclipse core region
            if y0 < 2.2 and math.hypot(x0, z0 - 0.1) < 0.68:
                continue

            pt = Vector((x0, y0, z0))
            r_scale = base_rad * rng.uniform(0.6, 1.35)
            bmesh.ops.create_icosphere(
                bm,
                subdivisions=2,
                radius=r_scale,
                matrix=Matrix.Translation(pt),
            )
            placed += 1

        mesh_data = bpy.data.meshes.new(f"eclipse_wyrm_ember_cloud_mesh_{g_idx}")
        bm.to_mesh(mesh_data)
        bm.free()
        for p in mesh_data.polygons:
            p.use_smooth = True

        cloud_obj = bpy.data.objects.new(f"eclipse_wyrm_ember_cloud_{g_idx}", mesh_data)
        bpy.context.collection.objects.link(cloud_obj)
        cloud_obj.visible_shadow = False
        cloud_obj.visible_diffuse = False
        cloud_obj.visible_glossy = False
        cloud_obj.data.materials.append(mat_use)
        ember_groups.append((cloud_obj, g_idx))

    return ember_groups


def setup_camera(scene):
    cam_data = bpy.data.cameras.new("eclipse_wyrm_camera")
    cam_data.lens = 52.0
    cam_data.sensor_width = 36.0

    # Optical Depth of Field focused tightly on the wyrm's eyes & snout (dist ~ 4.05m)
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 4.05
    cam_data.dof.aperture_fstop = 2.4
    cam_data.dof.aperture_blades = 7

    cam_obj = bpy.data.objects.new("eclipse_wyrm_camera_obj", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    return cam_obj


def setup_compositor(scene):
    """
    Post-processing pipeline in Blender Compositor:
      - Fog Glow Glare (rich bloom on the solar corona, molten eyes, gold crown spikes & gold veins)
      - Diamond-Ring Star Streak Glare
      - Color Balance (Boardly crimson/black/gold film grade)
      - Circle-safe radial vignette (keeps outer corners & circle edge dark and dramatic)
      - Subtle optical lens dispersion / grain finish
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
    glare_glow.threshold = 1.15
    glare_glow.size = 7
    glare_glow.mix = -0.26
    nt.links.new(rl.outputs["Image"], glare_glow.inputs["Image"])

    # 2. Star Streak Glare on Diamond-Ring Flare & Crown Spikes
    glare_streaks = nt.nodes.new("CompositorNodeGlare")
    glare_streaks.glare_type = "STREAKS"
    glare_streaks.quality = "MEDIUM"
    glare_streaks.threshold = 4.0
    glare_streaks.streaks = 4
    glare_streaks.angle_offset = math.radians(24.0)
    glare_streaks.fade = 0.85
    glare_streaks.mix = -0.58
    nt.links.new(glare_glow.outputs["Image"], glare_streaks.inputs["Image"])

    # 3. Color Grading (Boardly Crimson / Obsidian / Gold)
    cb = nt.nodes.new("CompositorNodeColorBalance")
    cb.correction_method = "LIFT_GAMMA_GAIN"
    cb.lift = (0.97, 0.94, 0.95)
    cb.gamma = (1.04, 0.99, 0.95)
    cb.gain = (1.10, 1.03, 0.93)
    nt.links.new(glare_streaks.outputs["Image"], cb.inputs["Image"])

    # 4. Circle-Safe Vignette (1:1 centered ellipse mask)
    ell = nt.nodes.new("CompositorNodeEllipseMask")
    ell.width = 0.86
    ell.height = 0.86
    ell.x = 0.50
    ell.y = 0.50

    blur_vig = nt.nodes.new("CompositorNodeBlur")
    blur_vig.filter_type = "FAST_GAUSS"
    blur_vig.use_relative = True
    blur_vig.factor_x = 0.20
    blur_vig.factor_y = 0.20
    nt.links.new(ell.outputs["Mask"], blur_vig.inputs["Image"])

    vig_range = nt.nodes.new("CompositorNodeMapRange")
    vig_range.inputs["From Min"].default_value = 0.0
    vig_range.inputs["From Max"].default_value = 1.0
    vig_range.inputs["To Min"].default_value = 0.22
    vig_range.inputs["To Max"].default_value = 1.0
    nt.links.new(blur_vig.outputs["Image"], vig_range.inputs["Value"])

    mix_vig = nt.nodes.new("CompositorNodeMixRGB")
    mix_vig.blend_type = "MULTIPLY"
    mix_vig.inputs[0].default_value = 1.0
    nt.links.new(cb.outputs["Image"], mix_vig.inputs[1])
    nt.links.new(vig_range.outputs["Value"], mix_vig.inputs[2])

    # 5. Subtle Film Grain / Optical Dispersion
    lens = nt.nodes.new("CompositorNodeLensdist")
    lens.use_jitter = True
    lens.use_fit = True
    lens.inputs[1].default_value = -0.004
    lens.inputs[2].default_value = 0.006
    nt.links.new(mix_vig.outputs["Image"], lens.inputs["Image"])

    nt.links.new(lens.outputs["Image"], comp.inputs["Image"])


def apply_frame_state(
    frame,
    total_frames,
    animated_nodes,
    lights,
    throat_light_obj,
    ring_rig,
    ring_spin_pivot,
    wyrm_root,
    neck_pivot,
    head_pivot,
    jaw_pivot,
    eye_meshes,
    nostril_nodes,
    ember_groups,
    cam_obj,
):
    """
    Applies 100% periodic 150-frame (5.0s @ 30fps) animation state:
      - theta = 2*pi * frame / 150
      - theta_cyclic = theta - sin(theta): advances a full 2*pi (1 full turn) over 150 frames
        while having 0 velocity at frame 0 and frame 150 so SSIM(frame_0000, frame_0149) > 0.999!
    """
    phase = float(frame) / float(total_frames)
    theta = phase * math.pi * 2.0
    theta_cyclic = theta - math.sin(theta)
    u_raw = (1.0 - math.cos(theta)) * 0.5
    u_smooth = u_raw * u_raw * (3.0 - 2.0 * u_raw)
    p_cos = 1.0 - 2.0 * u_smooth
    p_sin = math.sin(theta) * u_raw

    # ─── 1. ECLIPSE, CORONA, GOD RAYS & GOLD VEINS SHIMMER (4D Periodic Noise) ─
    animated_nodes["sky_noise_w"].default_value = (1.0 - p_cos) * 0.38
    animated_nodes["ray_noise_w"].default_value = p_sin * 0.52
    animated_nodes["obsidian_vein_w"].default_value = (1.0 - p_cos) * 0.34
    animated_nodes["obsidian_vein_strength"].default_value = 1.50 + 0.45 * (1.0 - p_cos) + 0.20 * p_sin
    animated_nodes["corona_strength"].default_value = 3.5 + 0.75 * (1.0 - p_cos) + 0.30 * p_sin
    animated_nodes["diamond_flare_strength"].default_value = 7.6 + 2.2 * (1.0 - p_cos)
    animated_nodes["crown_gold_strength"].default_value = 2.4 + 0.60 * (1.0 - p_cos)
    animated_nodes["scale_crevice_strength"].default_value = 1.05 + 0.35 * (1.0 - p_cos)

    # Obsidian ring rotates 1 full turn (2*pi radians) per loop with subtle precession
    ring_rig.rotation_euler = Euler(
        (
            math.radians(78.0) + 0.04 * p_sin,
            math.radians(-12.0) + 0.035 * (1.0 - p_cos) * 0.5,
            math.radians(8.0),
        ),
        "XYZ",
    )
    ring_spin_pivot.rotation_euler = Euler((0.0, 0.0, theta_cyclic), "XYZ")

    # ─── 2. SLOW HEAVY BREATHING (Head/Neck Rise & Fall, Nostrils Pulse, Smoke Loops) ─
    breath = (1.0 - p_cos) * 0.5  # 0 -> 1 -> 0 smoothly over the 5s loop
    breath_lag = (1.0 - math.cos(theta - 0.45)) * 0.5 * u_raw

    neck_pivot.location = Vector((0.16, 0.12, -0.76 + 0.038 * breath))
    neck_pivot.scale = (1.0 + 0.032 * breath, 1.0 + 0.035 * breath, 1.0 + 0.018 * breath)
    neck_pivot.rotation_euler = Euler((0.025 * p_sin, 0.02 * breath, 0.022 * p_sin), "XYZ")

    head_pivot.location = Vector((-0.05, -0.10, 0.78 + 0.024 * breath_lag))
    head_pivot.rotation_euler = Euler(
        (
            math.radians(5.0) - 0.045 * breath,
            math.radians(8.0) + 0.035 * p_sin,
            math.radians(-116.0) + 0.04 * p_sin,
        ),
        "XYZ",
    )

    # Subtle jaw breathing & pulsing throat fire glow
    jaw_pivot.rotation_euler = Euler((0.0, math.radians(18.0) + 0.065 * breath, 0.0), "XYZ")
    animated_nodes["throat_noise_w"].default_value = (1.0 - p_cos) * 0.55
    animated_nodes["throat_glow_strength"].default_value = 4.2 + 1.5 * breath + 0.4 * p_sin
    lights["throat_light"].energy = 28.0 + 16.0 * breath
    lights["corona_rim"].energy = 5.0 + 0.80 * breath

    # Nostril pulse & curling smoke loop
    animated_nodes["smoke_noise_w"].default_value = (1.0 - p_cos) * 0.65
    animated_nodes["smoke_glow_strength"].default_value = 1.8 + 0.85 * breath
    animated_nodes["smoke_mapping_loc"].default_value = (
        0.35 * p_sin,
        0.40 * (1.0 - p_cos) * 0.5,
        -0.55 * (1.0 - p_cos) * 0.5,
    )
    for nostril_ring, smoke_piv, side in nostril_nodes:
        n_scale = 1.0 + 0.18 * breath
        nostril_ring.scale = (n_scale, n_scale, n_scale)
        smoke_piv.rotation_euler = Euler((0.08 * p_sin, side * 0.10 * breath, 0.06 * p_sin), "XYZ")
        smoke_piv.scale = (1.0 + 0.10 * breath, 1.0 + 0.12 * breath, 1.0 + 0.15 * breath)

    # ─── 3. MOLTEN EYE GLOW PULSE & ONE SLOW BLINK PER LOOP ─────────────────────
    # Blink occurs smoothly around frame 78 (middle of the 150-frame loop, completely open at 0 and 149)
    blink_curve = math.exp(-((frame - 78.0) ** 2) / 14.0)
    if blink_curve < 0.005:
        blink_curve = 0.0

    # Eye glow pulses with breathing and surges right as the eyes reopen after the blink
    post_blink_surge = math.exp(-((frame - 88.0) ** 2) / 36.0)
    animated_nodes["eye_glow_strength"].default_value = (
        3.1 + 0.85 * breath + 1.25 * post_blink_surge
    ) * (1.0 - 0.82 * blink_curve)

    for eye_piv, (brow, brow_base_loc) in eye_meshes:
        # Smooth vertical eye closure during blink + brow ridge lowering
        eye_z = 1.0 - 0.94 * blink_curve
        eye_piv.scale = (1.0, 1.0, eye_z)
        brow.location = brow_base_loc + Vector((0.0, 0.0, -0.042 * blink_curve))

    # ─── 4. SLOW RISING EMBERS IN FRONT OF AND BEHIND THE WYRM ──────────────────
    for cloud_obj, g_idx in ember_groups:
        mul = 1.0 + g_idx * 0.30
        cloud_obj.location = Vector((
            0.09 * p_sin * mul,
            0.05 * (1.0 - p_cos) * 0.5 * mul,
            0.18 * (1.0 - p_cos) * 0.5 * mul,
        ))
        cloud_obj.rotation_euler = Euler((0.025 * p_sin, 0.03 * (1.0 - p_cos) * 0.5, 0.05 * p_sin), "XYZ")

    # ─── 5. CAMERA: SLOW ~2% PUSH-IN RETURNING TO EXACT START POSITION ──────────
    push_in = (1.0 - p_cos) * 0.5  # 0 -> 1 -> 0 over loop
    base_y = -4.15
    cam_pos = Vector((
        0.025 * p_sin,
        base_y * (1.0 - 0.02 * push_in),
        0.06 + 0.018 * push_in,
    ))
    cam_target = Vector((-0.02, 0.0, 0.05))
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
    lights, throat_light_obj = setup_scene_lights()
    create_starry_godray_backdrop(animated_nodes)
    ring_rig, ring_spin_pivot = create_eclipse_sun_and_obsidian_ring(animated_nodes)
    wyrm_root, neck_pivot, head_pivot, jaw_pivot, eye_meshes, nostril_nodes = create_eclipse_wyrm_portrait(animated_nodes)
    ember_groups = create_rising_embers()
    cam_obj = setup_camera(scene)
    setup_compositor(scene)

    total_frames = 150
    scene.frame_set(0)

    apply_frame_state(
        0,
        total_frames,
        animated_nodes,
        lights,
        throat_light_obj,
        ring_rig,
        ring_spin_pivot,
        wyrm_root,
        neck_pivot,
        head_pivot,
        jaw_pivot,
        eye_meshes,
        nostril_nodes,
        ember_groups,
        cam_obj,
    )
    if save_blend:
        os.makedirs(os.path.dirname(save_blend), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=save_blend)
        print(f"[eclipse_wyrm] Saved .blend source to {save_blend}", flush=True)

    for f in range(frame_start, frame_end + 1):
        frame_path = f"{output_prefix}{f:04d}.png"
        if skip_existing and os.path.exists(frame_path) and os.path.getsize(frame_path) > 10000:
            print(f"[eclipse_wyrm] Skipping existing frame {f:04d} -> {frame_path}", flush=True)
            continue

        apply_frame_state(
            f,
            total_frames,
            animated_nodes,
            lights,
            throat_light_obj,
            ring_rig,
            ring_spin_pivot,
            wyrm_root,
            neck_pivot,
            head_pivot,
            jaw_pivot,
            eye_meshes,
            nostril_nodes,
            ember_groups,
            cam_obj,
        )
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"[eclipse_wyrm] Rendered frame {f}/{frame_end} -> {frame_path}", flush=True)


if __name__ == "__main__":
    main()
