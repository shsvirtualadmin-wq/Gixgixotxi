#!/usr/bin/env python3
"""
Boardly Store — "Black Sun Ember Storm" (id: black-sun-ember-storm)
Procedural Blender 4.2.3 LTS 3D Transparent Profile Effect Overlay (3:4 Aspect Ratio)
File: /tools/blender/black_sun_ember_storm.py

Specifications:
- Render Resolution: 1200x1600 (or 600x800 3:4 aspect ratio)
- Film > Transparent ON, RGBA PNG output, Standard view transform (zero dark halos on glow edges)
- Calibrated Emission strengths (<= 1.15) with multi-stop crimson -> gold -> hot-core ramps so colors
  stay richly saturated (never clipped to white) over both dark (#0E0E12) and light (#F8FAFC) backgrounds
- Center 60% of the card stays clear/low-opacity for complete readability of avatar, name, bio, buttons & stats
- Top Edge: Rising 3D Black Sun eclipse sphere at the top crest rimmed by a pulsing molten gold corona arc,
  downward crimson-gold god rays, and a rotating bevelled obsidian kintsugi ring with 4D-noise gold veins
- Side Edges: High-detail fractal 3D crimson-gold forked lightning bolts along left and right borders that flash
  twice per loop at fixed frames (frames 22-34 and frames 82-94)
- Bottom Corners: Organic curling warm crimson-gold ember smoke driven by looping 4D noise (time on a circle)
- Multi-Layer Embers & Ash: 3 depth layers (foreground DoF bokeh, mid-plane crisp shards & ash flakes,
  background distant embers) with real Cycles Camera Depth of Field (f/1.8)
- 120 frames at 30 fps (4.0s seamless loop, frame 0 .. 119)
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
    frame_end = 119
    output_prefix = "/app/applet/tools/blender/.frames_cache_black_sun_ember_storm/frame_"
    samples = 32
    res_x = 600
    res_y = 800
    save_blend = ""
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


def set_camera_only_ray_visibility(obj):
    if hasattr(obj, "visible_shadow"):
        obj.visible_shadow = False
    if hasattr(obj, "visible_diffuse"):
        obj.visible_diffuse = False
    if hasattr(obj, "visible_glossy"):
        obj.visible_glossy = False
    if hasattr(obj, "visible_transmission"):
        obj.visible_transmission = False
    if hasattr(obj, "visible_volume_scatter"):
        obj.visible_volume_scatter = False


def setup_render_engine(scene, samples=32, res_x=600, res_y=800):
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
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.14
    scene.cycles.adaptive_min_samples = 4
    scene.cycles.max_bounces = 1
    scene.cycles.diffuse_bounces = 1
    scene.cycles.glossy_bounces = 1
    scene.cycles.transmission_bounces = 0
    scene.cycles.volume_bounces = 0
    scene.cycles.transparent_max_bounces = 4
    scene.cycles.sample_clamp_direct = 4.0
    scene.cycles.sample_clamp_indirect = 2.0
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.seed = 108
    if hasattr(scene.cycles, "use_animated_seed"):
        scene.cycles.use_animated_seed = False

    scene.cycles.use_denoising = True
    if hasattr(scene.cycles, "denoiser"):
        for denoiser_name in ("OPENIMAGEDENOISE", "OPTIX"):
            try:
                scene.cycles.denoiser = denoiser_name
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

    scene.render.film_transparent = True
    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.frame_start = 0
    scene.frame_end = 119

    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15

    try:
        scene.view_settings.view_transform = "Standard"
        scene.view_settings.look = "None"
    except Exception:
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    world = bpy.data.worlds.new("BlackSunOverlayWorld")
    scene.world = world
    world.use_nodes = True
    wnodes = world.node_tree.nodes
    wlinks = world.node_tree.links
    wnodes.clear()
    bg = wnodes.new(type="ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    bg.inputs["Strength"].default_value = 0.0
    wout = wnodes.new(type="ShaderNodeOutputWorld")
    wlinks.new(bg.outputs["Background"], wout.inputs["Surface"])


def setup_camera_and_lights(scene):
    cam_data = bpy.data.cameras.new("OverlayCamera")
    cam_data.type = "PERSP"
    cam_data.lens = 60.0
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.sensor_width = 36.0
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 10.0
    cam_data.dof.aperture_fstop = 1.8
    cam_data.dof.aperture_blades = 7

    cam_obj = bpy.data.objects.new("OverlayCamera", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = (0.0, -10.0, 0.0)
    cam_obj.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    scene.camera = cam_obj

    top_light_data = bpy.data.lights.new("EclipseGoldKeyLight", type="POINT")
    top_light_data.energy = 260.0
    top_light_data.color = (1.0, 0.76, 0.25)
    top_light_data.shadow_soft_size = 0.8
    top_light_data.use_shadow = False
    top_light = bpy.data.objects.new("EclipseGoldKeyLight", top_light_data)
    scene.collection.objects.link(top_light)
    top_light.location = (0.0, -2.2, 3.8)

    rim_light_data = bpy.data.lights.new("CrimsonRimLight", type="POINT")
    rim_light_data.energy = 160.0
    rim_light_data.color = (0.95, 0.14, 0.14)
    rim_light_data.shadow_soft_size = 1.0
    rim_light_data.use_shadow = False
    rim_light = bpy.data.objects.new("CrimsonRimLight", rim_light_data)
    scene.collection.objects.link(rim_light)
    rim_light.location = (0.0, -2.8, -3.5)

    return cam_obj


def create_top_corona_plane_material():
    mat = bpy.data.materials.new("Mat_BlackSunTopCorona")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emit = nodes.new("ShaderNodeEmission")
    mix_shader = nodes.new("ShaderNodeMixShader")

    tex_coord = nodes.new("ShaderNodeTexCoord")
    sep_xyz = nodes.new("ShaderNodeSeparateXYZ")
    links.new(tex_coord.outputs["Generated"], sep_xyz.inputs["Vector"])

    sub_u = nodes.new("ShaderNodeMath")
    sub_u.operation = "SUBTRACT"
    sub_u.inputs[1].default_value = 0.5
    links.new(sep_xyz.outputs["X"], sub_u.inputs[0])

    scale_u = nodes.new("ShaderNodeMath")
    scale_u.operation = "MULTIPLY"
    scale_u.inputs[1].default_value = 1.32
    links.new(sub_u.outputs["Value"], scale_u.inputs[0])

    sq_u = nodes.new("ShaderNodeMath")
    sq_u.operation = "MULTIPLY"
    links.new(scale_u.outputs["Value"], sq_u.inputs[0])
    links.new(scale_u.outputs["Value"], sq_u.inputs[1])

    sub_v = nodes.new("ShaderNodeMath")
    sub_v.operation = "SUBTRACT"
    sub_v.inputs[1].default_value = 1.12
    links.new(sep_xyz.outputs["Y"], sub_v.inputs[0])

    sq_v = nodes.new("ShaderNodeMath")
    sq_v.operation = "MULTIPLY"
    links.new(sub_v.outputs["Value"], sq_v.inputs[0])
    links.new(sub_v.outputs["Value"], sq_v.inputs[1])

    sum_sq = nodes.new("ShaderNodeMath")
    sum_sq.operation = "ADD"
    links.new(sq_u.outputs["Value"], sum_sq.inputs[0])
    links.new(sq_v.outputs["Value"], sum_sq.inputs[1])

    dist = nodes.new("ShaderNodeMath")
    dist.operation = "SQRT"
    links.new(sum_sq.outputs["Value"], dist.inputs[0])

    atan2 = nodes.new("ShaderNodeMath")
    atan2.operation = "ARCTAN2"
    links.new(sub_v.outputs["Value"], atan2.inputs[0])
    links.new(scale_u.outputs["Value"], atan2.inputs[1])

    ray_scale = nodes.new("ShaderNodeMath")
    ray_scale.operation = "MULTIPLY"
    ray_scale.inputs[1].default_value = 18.0
    links.new(atan2.outputs["Value"], ray_scale.inputs[0])

    ray_sin = nodes.new("ShaderNodeMath")
    ray_sin.operation = "SINE"
    links.new(ray_scale.outputs["Value"], ray_sin.inputs[0])

    ray_amp = nodes.new("ShaderNodeMath")
    ray_amp.operation = "MULTIPLY"
    ray_amp.inputs[1].default_value = 0.045
    links.new(ray_sin.outputs["Value"], ray_amp.inputs[0])

    noise = nodes.new("ShaderNodeTexNoise")
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 8.5
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = 0.55
    noise.inputs["W"].default_value = 0.0
    links.new(tex_coord.outputs["Generated"], noise.inputs["Vector"])

    noise_centered = nodes.new("ShaderNodeMath")
    noise_centered.operation = "SUBTRACT"
    noise_centered.inputs[1].default_value = 0.5
    links.new(noise.outputs["Fac"], noise_centered.inputs[0])

    noise_amp = nodes.new("ShaderNodeMath")
    noise_amp.operation = "MULTIPLY"
    noise_amp.inputs[1].default_value = 0.095
    links.new(noise_centered.outputs["Value"], noise_amp.inputs[0])

    dist_p1 = nodes.new("ShaderNodeMath")
    dist_p1.operation = "ADD"
    links.new(dist.outputs["Value"], dist_p1.inputs[0])
    links.new(noise_amp.outputs["Value"], dist_p1.inputs[1])

    dist_perturbed = nodes.new("ShaderNodeMath")
    dist_perturbed.operation = "ADD"
    links.new(dist_p1.outputs["Value"], dist_perturbed.inputs[0])
    links.new(ray_amp.outputs["Value"], dist_perturbed.inputs[1])

    corona_ramp = nodes.new("ShaderNodeValToRGB")
    elems = corona_ramp.color_ramp.elements
    elems[0].position = 0.27
    elems[0].color = (0.95, 0.95, 0.95, 1.0)
    elems[1].position = 0.90
    elems[1].color = (0.0, 0.0, 0.0, 1.0)
    e_mid1 = elems.new(0.38)
    e_mid1.color = (0.85, 0.85, 0.85, 1.0)
    e_mid2 = elems.new(0.56)
    e_mid2.color = (0.38, 0.38, 0.38, 1.0)
    links.new(dist_perturbed.outputs["Value"], corona_ramp.inputs["Fac"])

    col_ramp = nodes.new("ShaderNodeValToRGB")
    celems = col_ramp.color_ramp.elements
    celems[0].position = 0.28
    celems[0].color = (1.0, 0.86, 0.24, 1.0)
    celems[1].position = 0.82
    celems[1].color = (0.86, 0.10, 0.12, 1.0)
    c_mid1 = celems.new(0.42)
    c_mid1.color = (0.96, 0.58, 0.06, 1.0)
    c_mid2 = celems.new(0.60)
    c_mid2.color = (0.92, 0.22, 0.08, 1.0)
    links.new(dist_perturbed.outputs["Value"], col_ramp.inputs["Fac"])

    v_fade = nodes.new("ShaderNodeValToRGB")
    velems = v_fade.color_ramp.elements
    velems[0].position = 0.06
    velems[0].color = (0.0, 0.0, 0.0, 1.0)
    velems[1].position = 0.55
    velems[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(sep_xyz.outputs["Y"], v_fade.inputs["Fac"])

    alpha_mul = nodes.new("ShaderNodeMath")
    alpha_mul.operation = "MULTIPLY"
    links.new(corona_ramp.outputs["Color"], alpha_mul.inputs[0])
    links.new(v_fade.outputs["Color"], alpha_mul.inputs[1])

    pulse_mul = nodes.new("ShaderNodeMath")
    pulse_mul.name = "CoronaPulseMul"
    pulse_mul.operation = "MULTIPLY"
    pulse_mul.inputs[1].default_value = 0.88
    links.new(alpha_mul.outputs["Value"], pulse_mul.inputs[0])

    alpha_clamp = nodes.new("ShaderNodeClamp")
    links.new(pulse_mul.outputs["Value"], alpha_clamp.inputs["Value"])

    emit.inputs["Strength"].default_value = 1.05
    links.new(col_ramp.outputs["Color"], emit.inputs["Color"])

    links.new(alpha_clamp.outputs["Result"], mix_shader.inputs["Fac"])
    links.new(transp.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emit.outputs["Emission"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], out.inputs["Surface"])

    return mat, noise, pulse_mul


def create_black_sun_core_material():
    mat = bpy.data.materials.new("Mat_BlackSunEclipseCore")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 1.08

    lw = nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.28

    col_ramp = nodes.new("ShaderNodeValToRGB")
    elems = col_ramp.color_ramp.elements
    elems[0].position = 0.0
    elems[0].color = (0.018, 0.004, 0.008, 1.0)
    elems[1].position = 0.92
    elems[1].color = (1.0, 0.88, 0.28, 1.0)
    e_mid1 = elems.new(0.62)
    e_mid1.color = (0.04, 0.008, 0.012, 1.0)
    e_mid2 = elems.new(0.80)
    e_mid2.color = (0.88, 0.16, 0.08, 1.0)
    links.new(lw.outputs["Fresnel"], col_ramp.inputs["Fac"])

    links.new(col_ramp.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def create_obsidian_kintsugi_material():
    mat = bpy.data.materials.new("Mat_ObsidianKintsugiTop")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.02, 0.008, 0.012, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.88
    bsdf.inputs["Roughness"].default_value = 0.16

    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "KintsugiNoise4D"
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 6.5
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.6
    noise.inputs["W"].default_value = 0.0
    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

    vein_ramp = nodes.new("ShaderNodeValToRGB")
    velems = vein_ramp.color_ramp.elements
    velems[0].position = 0.46
    velems[0].color = (0.05, 0.006, 0.008, 1.0)
    velems[1].position = 0.62
    velems[1].color = (1.0, 0.78, 0.14, 1.0)
    v_mid = velems.new(0.53)
    v_mid.color = (0.88, 0.14, 0.06, 1.0)
    links.new(noise.outputs["Fac"], vein_ramp.inputs["Fac"])

    links.new(vein_ramp.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 1.25
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    return mat, noise


def create_ember_glow_material(name, core_color, mid_color, edge_color, strength=1.08):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emit = nodes.new("ShaderNodeEmission")
    mix_shader = nodes.new("ShaderNodeMixShader")

    lw = nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.45

    inv = nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    links.new(lw.outputs["Facing"], inv.inputs[1])

    col_ramp = nodes.new("ShaderNodeValToRGB")
    celems = col_ramp.color_ramp.elements
    celems[0].position = 0.0
    celems[0].color = edge_color
    celems[1].position = 0.82
    celems[1].color = core_color
    cmid = celems.new(0.45)
    cmid.color = mid_color
    links.new(inv.outputs["Value"], col_ramp.inputs["Fac"])

    alpha_ramp = nodes.new("ShaderNodeValToRGB")
    alpha_ramp.color_ramp.interpolation = "B_SPLINE"
    aelems = alpha_ramp.color_ramp.elements
    aelems[0].position = 0.08
    aelems[0].color = (0.0, 0.0, 0.0, 1.0)
    aelems[1].position = 0.86
    aelems[1].color = (1.0, 1.0, 1.0, 1.0)
    amid = aelems.new(0.38)
    amid.color = (0.35, 0.35, 0.35, 1.0)
    links.new(inv.outputs["Value"], alpha_ramp.inputs["Fac"])

    obj_info = nodes.new("ShaderNodeObjectInfo")
    sep_col = nodes.new("ShaderNodeSeparateColor")
    links.new(obj_info.outputs["Color"], sep_col.inputs["Color"])

    alpha_mul = nodes.new("ShaderNodeMath")
    alpha_mul.operation = "MULTIPLY"
    links.new(alpha_ramp.outputs["Color"], alpha_mul.inputs[0])
    links.new(sep_col.outputs["Red"], alpha_mul.inputs[1])

    emit.inputs["Strength"].default_value = strength
    links.new(col_ramp.outputs["Color"], emit.inputs["Color"])

    links.new(alpha_mul.outputs["Value"], mix_shader.inputs["Fac"])
    links.new(transp.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emit.outputs["Emission"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], out.inputs["Surface"])

    return mat


def create_lightning_materials(side_prefix):
    mat_core = bpy.data.materials.new(f"Mat_LightningCore_{side_prefix}")
    mat_core.use_nodes = True
    cnodes = mat_core.node_tree.nodes
    clinks = mat_core.node_tree.links
    cnodes.clear()

    cout = cnodes.new("ShaderNodeOutputMaterial")
    ctransp = cnodes.new("ShaderNodeBsdfTransparent")
    cemit = cnodes.new("ShaderNodeEmission")
    cmix = cnodes.new("ShaderNodeMixShader")

    clw = cnodes.new("ShaderNodeLayerWeight")
    clw.inputs["Blend"].default_value = 0.38
    cinv = cnodes.new("ShaderNodeMath")
    cinv.operation = "SUBTRACT"
    cinv.inputs[0].default_value = 1.0
    clinks.new(clw.outputs["Facing"], cinv.inputs[1])

    ccol = cnodes.new("ShaderNodeValToRGB")
    celems = ccol.color_ramp.elements
    celems[0].position = 0.0
    celems[0].color = (0.88, 0.10, 0.12, 1.0)
    celems[1].position = 0.72
    celems[1].color = (1.0, 0.90, 0.32, 1.0)
    cmid = celems.new(0.38)
    cmid.color = (0.98, 0.58, 0.08, 1.0)
    clinks.new(cinv.outputs["Value"], ccol.inputs["Fac"])

    c_int = cnodes.new("ShaderNodeValue")
    c_int.name = "LightningIntensity"
    c_int.outputs[0].default_value = 0.0

    calpha = cnodes.new("ShaderNodeMath")
    calpha.operation = "MULTIPLY"
    clinks.new(cinv.outputs["Value"], calpha.inputs[0])
    clinks.new(c_int.outputs[0], calpha.inputs[1])

    cclamp = cnodes.new("ShaderNodeClamp")
    clinks.new(calpha.outputs["Value"], cclamp.inputs["Value"])

    cemit.inputs["Strength"].default_value = 1.12
    clinks.new(ccol.outputs["Color"], cemit.inputs["Color"])
    clinks.new(cclamp.outputs["Result"], cmix.inputs["Fac"])
    clinks.new(ctransp.outputs["BSDF"], cmix.inputs[1])
    clinks.new(cemit.outputs["Emission"], cmix.inputs[2])
    clinks.new(cmix.outputs["Shader"], cout.inputs["Surface"])

    mat_sheath = bpy.data.materials.new(f"Mat_LightningSheath_{side_prefix}")
    mat_sheath.use_nodes = True
    snodes = mat_sheath.node_tree.nodes
    slinks = mat_sheath.node_tree.links
    snodes.clear()

    sout = snodes.new("ShaderNodeOutputMaterial")
    stransp = snodes.new("ShaderNodeBsdfTransparent")
    semit = snodes.new("ShaderNodeEmission")
    smix = snodes.new("ShaderNodeMixShader")

    slw = snodes.new("ShaderNodeLayerWeight")
    slw.inputs["Blend"].default_value = 0.45
    sinv = snodes.new("ShaderNodeMath")
    sinv.operation = "SUBTRACT"
    sinv.inputs[0].default_value = 1.0
    slinks.new(slw.outputs["Facing"], sinv.inputs[1])

    scol = snodes.new("ShaderNodeValToRGB")
    selems = scol.color_ramp.elements
    selems[0].position = 0.0
    selems[0].color = (0.78, 0.06, 0.09, 1.0)
    selems[1].position = 0.80
    selems[1].color = (0.96, 0.42, 0.08, 1.0)
    slinks.new(sinv.outputs["Value"], scol.inputs["Fac"])

    s_int = snodes.new("ShaderNodeValue")
    s_int.name = "LightningIntensity"
    s_int.outputs[0].default_value = 0.0

    salpha_raw = snodes.new("ShaderNodeMath")
    salpha_raw.operation = "MULTIPLY"
    slinks.new(sinv.outputs["Value"], salpha_raw.inputs[0])
    slinks.new(s_int.outputs[0], salpha_raw.inputs[1])

    salpha_scale = snodes.new("ShaderNodeMath")
    salpha_scale.operation = "MULTIPLY"
    salpha_scale.inputs[1].default_value = 0.46
    slinks.new(salpha_raw.outputs["Value"], salpha_scale.inputs[0])

    sclamp = snodes.new("ShaderNodeClamp")
    slinks.new(salpha_scale.outputs["Value"], sclamp.inputs["Value"])

    semit.inputs["Strength"].default_value = 1.02
    slinks.new(scol.outputs["Color"], semit.inputs["Color"])
    slinks.new(sclamp.outputs["Result"], smix.inputs["Fac"])
    slinks.new(stransp.outputs["BSDF"], smix.inputs[1])
    slinks.new(semit.outputs["Emission"], smix.inputs[2])
    slinks.new(smix.outputs["Shader"], sout.inputs["Surface"])

    return mat_core, mat_sheath, [c_int, s_int]


def create_corner_smoke_material(name, is_right=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emit = nodes.new("ShaderNodeEmission")
    mix_shader = nodes.new("ShaderNodeMixShader")

    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.name = "SmokeMapping"
    links.new(tex_coord.outputs["Generated"], mapping.inputs["Vector"])

    sep = nodes.new("ShaderNodeSeparateXYZ")
    links.new(tex_coord.outputs["Generated"], sep.inputs["Vector"])

    dx = nodes.new("ShaderNodeMath")
    dx.operation = "SUBTRACT"
    dx.inputs[1].default_value = 0.82 if is_right else 0.18
    links.new(sep.outputs["X"], dx.inputs[0])

    dy = nodes.new("ShaderNodeMath")
    dy.operation = "SUBTRACT"
    dy.inputs[1].default_value = 0.18
    links.new(sep.outputs["Y"], dy.inputs[0])

    sqx = nodes.new("ShaderNodeMath")
    sqx.operation = "MULTIPLY"
    links.new(dx.outputs["Value"], sqx.inputs[0])
    links.new(dx.outputs["Value"], sqx.inputs[1])

    sqy = nodes.new("ShaderNodeMath")
    sqy.operation = "MULTIPLY"
    links.new(dy.outputs["Value"], sqy.inputs[0])
    links.new(dy.outputs["Value"], sqy.inputs[1])

    r2 = nodes.new("ShaderNodeMath")
    r2.operation = "ADD"
    links.new(sqx.outputs["Value"], r2.inputs[0])
    links.new(sqy.outputs["Value"], r2.inputs[1])

    radial_mask = nodes.new("ShaderNodeValToRGB")
    relems = radial_mask.color_ramp.elements
    relems[0].position = 0.02
    relems[0].color = (1.0, 1.0, 1.0, 1.0)
    relems[1].position = 0.42
    relems[1].color = (0.0, 0.0, 0.0, 1.0)
    links.new(r2.outputs["Value"], radial_mask.inputs["Fac"])

    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = "SmokeNoise4D"
    noise.noise_dimensions = "4D"
    noise.inputs["Scale"].default_value = 4.2
    noise.inputs["Detail"].default_value = 5.0
    noise.inputs["Roughness"].default_value = 0.58
    noise.inputs["Distortion"].default_value = 0.65
    noise.inputs["W"].default_value = 0.0
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])

    smoke_ramp = nodes.new("ShaderNodeValToRGB")
    selems = smoke_ramp.color_ramp.elements
    selems[0].position = 0.38
    selems[0].color = (0.0, 0.0, 0.0, 1.0)
    selems[1].position = 0.76
    selems[1].color = (1.0, 1.0, 1.0, 1.0)
    links.new(noise.outputs["Fac"], smoke_ramp.inputs["Fac"])

    col_ramp = nodes.new("ShaderNodeValToRGB")
    celems = col_ramp.color_ramp.elements
    celems[0].position = 0.38
    celems[0].color = (0.58, 0.06, 0.08, 1.0)
    celems[1].position = 0.78
    celems[1].color = (0.94, 0.48, 0.08, 1.0)
    cmid = celems.new(0.56)
    cmid.color = (0.82, 0.14, 0.10, 1.0)
    links.new(noise.outputs["Fac"], col_ramp.inputs["Fac"])

    alpha_mul1 = nodes.new("ShaderNodeMath")
    alpha_mul1.operation = "MULTIPLY"
    links.new(radial_mask.outputs["Color"], alpha_mul1.inputs[0])
    links.new(smoke_ramp.outputs["Color"], alpha_mul1.inputs[1])

    alpha_scale = nodes.new("ShaderNodeMath")
    alpha_scale.operation = "MULTIPLY"
    alpha_scale.inputs[1].default_value = 0.42
    links.new(alpha_mul1.outputs["Value"], alpha_scale.inputs[0])

    emit.inputs["Strength"].default_value = 0.96
    links.new(col_ramp.outputs["Color"], emit.inputs["Color"])

    links.new(alpha_scale.outputs["Value"], mix_shader.inputs["Fac"])
    links.new(transp.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emit.outputs["Emission"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], out.inputs["Surface"])

    return mat, noise, mapping


def build_top_black_sun_and_corona(scene):
    corona_mat, corona_noise, corona_pulse = create_top_corona_plane_material()
    black_sun_mat = create_black_sun_core_material()
    obsidian_mat, kintsugi_noise = create_obsidian_kintsugi_material()

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, 0.25, 3.12))
    corona_plane = bpy.context.active_object
    corona_plane.name = "TopCoronaPlane"
    corona_plane.scale = (6.3, 2.05, 1.0)
    corona_plane.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    corona_plane.data.materials.append(corona_mat)
    set_camera_only_ray_visibility(corona_plane)

    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64,
        ring_count=32,
        radius=1.08,
        location=(0.0, 0.08, 4.58),
    )
    sun_obj = bpy.context.active_object
    sun_obj.name = "TopBlackSunCore"
    sun_obj.scale = (1.18, 0.45, 0.92)
    sun_obj.data.materials.append(black_sun_mat)
    for poly in sun_obj.data.polygons:
        poly.use_smooth = True
    set_camera_only_ray_visibility(sun_obj)

    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.78,
        minor_radius=0.058,
        major_segments=96,
        minor_segments=24,
        location=(0.0, 0.02, 4.88),
    )
    ring_obj = bpy.context.active_object
    ring_obj.name = "TopObsidianKintsugiRing"
    ring_obj.rotation_euler = (math.radians(77.0), math.radians(5.0), 0.0)
    ring_obj.data.materials.append(obsidian_mat)
    for poly in ring_obj.data.polygons:
        poly.use_smooth = True

    monolith_parent = bpy.data.objects.new("TopRingMonoliths", None)
    scene.collection.objects.link(monolith_parent)
    monolith_parent.location = (0.0, 0.02, 4.88)
    monolith_parent.rotation_euler = (math.radians(77.0), math.radians(5.0), 0.0)

    for k in range(12):
        ang = (2.0 * math.pi * k) / 12.0
        r = 1.94
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.052, location=(0.0, 0.0, 0.0))
        shard = bpy.context.active_object
        shard.name = f"TopRingShard_{k:02d}"
        shard.parent = monolith_parent
        shard.location = (r * math.cos(ang), r * math.sin(ang), 0.0)
        shard.scale = (0.65, 1.85, 0.45)
        shard.rotation_euler = (0.0, 0.0, ang)
        shard.data.materials.append(obsidian_mat)

    return {
        "corona_noise": corona_noise,
        "corona_pulse": corona_pulse,
        "kintsugi_noise": kintsugi_noise,
        "monolith_parent": monolith_parent,
        "ring_obj": ring_obj,
    }


def build_lightning_bolt_mesh(name, points, radii, mat):
    curve_data = bpy.data.curves.new(name=name, type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 1.0
    curve_data.bevel_resolution = 3
    curve_data.use_fill_caps = True

    spline = curve_data.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for idx, (pt, rad) in enumerate(zip(points, radii)):
        spline.points[idx].co = (pt[0], pt[1], pt[2], 1.0)
        spline.points[idx].radius = rad

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    set_camera_only_ray_visibility(obj)
    return obj


def subdivide_jagged_bolt(coarse_pts, seed, amp_x=0.085, amp_y=0.025):
    rng = random.Random(seed)
    pts = list(coarse_pts)
    for step in range(2):
        scale = 1.0 if step == 0 else 0.48
        new_pts = [pts[0]]
        for i in range(len(pts) - 1):
            p0 = pts[i]
            p1 = pts[i + 1]
            mx = 0.5 * (p0[0] + p1[0]) + rng.uniform(-amp_x, amp_x) * scale
            my = 0.5 * (p0[1] + p1[1]) + rng.uniform(-amp_y, amp_y) * scale
            mz = 0.5 * (p0[2] + p1[2]) + rng.uniform(-0.04, 0.04) * scale
            new_pts.append((mx, my, mz))
            new_pts.append(p1)
        pts = new_pts
    return pts


def build_side_lightning_bolts(scene):
    mat_left_core, mat_left_sheath, nodes_left = create_lightning_materials("Left")
    mat_right_core, mat_right_sheath, nodes_right = create_lightning_materials("Right")

    left_coarse = [
        (-2.58, 0.0, 3.55),
        (-2.34, -0.04, 2.75),
        (-2.68, 0.02, 1.95),
        (-2.28, -0.03, 1.15),
        (-2.64, 0.01, 0.35),
        (-2.36, -0.02, -0.45),
        (-2.72, 0.02, -1.25),
        (-2.46, 0.0, -2.05),
    ]
    left_pts = subdivide_jagged_bolt(left_coarse, seed=401, amp_x=0.095)
    n_l = len(left_pts)
    left_radii = [
        0.006 + 0.015 * math.sin(math.pi * (i / float(n_l - 1)))
        for i in range(n_l)
    ]
    build_lightning_bolt_mesh("LightningLeft_Core", left_pts, left_radii, mat_left_core)
    build_lightning_bolt_mesh("LightningLeft_Sheath", left_pts, [r * 3.2 for r in left_radii], mat_left_sheath)

    left_b1 = subdivide_jagged_bolt([left_pts[6], (-2.08, -0.04, 2.15), (-1.92, -0.04, 1.52)], seed=402, amp_x=0.06)
    r_lb1 = [0.013 * (1.0 - i / float(len(left_b1))) for i in range(len(left_b1))]
    build_lightning_bolt_mesh("LightningLeft_Branch1", left_b1, r_lb1, mat_left_core)
    build_lightning_bolt_mesh("LightningLeft_Branch1_Sheath", left_b1, [r * 2.8 for r in r_lb1], mat_left_sheath)

    left_b2 = subdivide_jagged_bolt([left_pts[16], (-2.12, -0.03, -0.15), (-1.98, -0.02, -0.78)], seed=403, amp_x=0.06)
    r_lb2 = [0.012 * (1.0 - i / float(len(left_b2))) for i in range(len(left_b2))]
    build_lightning_bolt_mesh("LightningLeft_Branch2", left_b2, r_lb2, mat_left_core)
    build_lightning_bolt_mesh("LightningLeft_Branch2_Sheath", left_b2, [r * 2.8 for r in r_lb2], mat_left_sheath)

    right_coarse = [
        (2.55, 0.0, 3.45),
        (2.28, -0.04, 2.62),
        (2.66, 0.02, 1.82),
        (2.30, -0.03, 0.98),
        (2.68, 0.01, 0.15),
        (2.34, -0.02, -0.68),
        (2.64, 0.02, -1.48),
        (2.42, 0.0, -2.25),
    ]
    right_pts = subdivide_jagged_bolt(right_coarse, seed=501, amp_x=0.095)
    n_r = len(right_pts)
    right_radii = [
        0.006 + 0.015 * math.sin(math.pi * (i / float(n_r - 1)))
        for i in range(n_r)
    ]
    build_lightning_bolt_mesh("LightningRight_Core", right_pts, right_radii, mat_right_core)
    build_lightning_bolt_mesh("LightningRight_Sheath", right_pts, [r * 3.2 for r in right_radii], mat_right_sheath)

    right_b1 = subdivide_jagged_bolt([right_pts[8], (2.06, -0.04, 1.65), (1.92, -0.04, 1.02)], seed=502, amp_x=0.06)
    r_rb1 = [0.013 * (1.0 - i / float(len(right_b1))) for i in range(len(right_b1))]
    build_lightning_bolt_mesh("LightningRight_Branch1", right_b1, r_rb1, mat_right_core)
    build_lightning_bolt_mesh("LightningRight_Branch1_Sheath", right_b1, [r * 2.8 for r in r_rb1], mat_right_sheath)

    right_b2 = subdivide_jagged_bolt([right_pts[18], (2.08, -0.03, -0.45), (1.94, -0.02, -1.08)], seed=503, amp_x=0.06)
    r_rb2 = [0.012 * (1.0 - i / float(len(right_b2))) for i in range(len(right_b2))]
    build_lightning_bolt_mesh("LightningRight_Branch2", right_b2, r_rb2, mat_right_core)
    build_lightning_bolt_mesh("LightningRight_Branch2_Sheath", right_b2, [r * 2.8 for r in r_rb2], mat_right_sheath)

    return {
        "nodes_left": nodes_left,
        "nodes_right": nodes_right,
    }


def build_bottom_corner_smoke(scene):
    smoke_left_mat, smoke_left_noise, smoke_left_map = create_corner_smoke_material("Mat_CornerSmokeLeft", is_right=False)
    smoke_right_mat, smoke_right_noise, smoke_right_map = create_corner_smoke_material("Mat_CornerSmokeRight", is_right=True)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(-2.05, 0.15, -3.05))
    smoke_l = bpy.context.active_object
    smoke_l.name = "BottomCornerSmoke_Left"
    smoke_l.scale = (2.45, 2.25, 1.0)
    smoke_l.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    smoke_l.data.materials.append(smoke_left_mat)
    set_camera_only_ray_visibility(smoke_l)

    bpy.ops.mesh.primitive_plane_add(size=1.0, location=(2.05, 0.15, -3.05))
    smoke_r = bpy.context.active_object
    smoke_r.name = "BottomCornerSmoke_Right"
    smoke_r.scale = (2.45, 2.25, 1.0)
    smoke_r.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    smoke_r.data.materials.append(smoke_right_mat)
    set_camera_only_ray_visibility(smoke_r)

    return {
        "left_noise": smoke_left_noise,
        "left_map": smoke_left_map,
        "right_noise": smoke_right_noise,
        "right_map": smoke_right_map,
    }


def build_layered_embers(scene):
    rng = random.Random(20261101)

    mat_gold = create_ember_glow_material(
        "Mat_EmberGold",
        core_color=(1.0, 0.92, 0.36, 1.0),
        mid_color=(0.98, 0.56, 0.06, 1.0),
        edge_color=(0.86, 0.12, 0.10, 1.0),
        strength=1.10,
    )
    mat_crimson = create_ember_glow_material(
        "Mat_EmberCrimson",
        core_color=(1.0, 0.76, 0.18, 1.0),
        mid_color=(0.92, 0.18, 0.10, 1.0),
        edge_color=(0.62, 0.05, 0.08, 1.0),
        strength=1.08,
    )
    mat_ash = create_ember_glow_material(
        "Mat_EmberWarmAsh",
        core_color=(0.95, 0.44, 0.10, 1.0),
        mid_color=(0.55, 0.08, 0.09, 1.0),
        edge_color=(0.28, 0.03, 0.05, 1.0),
        strength=0.98,
    )

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0.0, 0.0, -20.0))
    sphere_template = bpy.context.active_object
    sphere_template.name = "Template_EmberSphere"
    for p in sphere_template.data.polygons:
        p.use_smooth = True

    embers = []

    def spawn_ember(idx, layer_name, x_base, y_depth, radius, speed_cycles, mat, max_opacity, sway_amp):
        obj = bpy.data.objects.new(f"Ember_{layer_name}_{idx:03d}", sphere_template.data.copy())
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        scene.collection.objects.link(obj)
        set_camera_only_ray_visibility(obj)

        stretch = rng.uniform(1.18, 1.72)
        obj.scale = (radius, radius, radius * stretch)
        obj.rotation_euler = (
            rng.uniform(-0.22, 0.22),
            rng.uniform(-0.32, 0.32),
            rng.uniform(-0.22, 0.22),
        )

        embers.append({
            "obj": obj,
            "x_base": x_base,
            "y_depth": y_depth,
            "radius": radius,
            "stretch": stretch,
            "phase": rng.uniform(0.0, 1.0),
            "sway_phase": rng.uniform(0.0, 2.0 * math.pi),
            "sway_amp": sway_amp,
            "speed_cycles": speed_cycles,
            "max_opacity": max_opacity,
        })

    for i in range(16):
        side = -1.0 if (i % 2 == 0) else 1.0
        x_base = side * rng.uniform(1.90, 2.78)
        y_depth = rng.uniform(-2.35, -1.60)
        radius = rng.uniform(0.065, 0.110)
        mat = mat_gold if (i % 2 == 0) else mat_crimson
        spawn_ember(i, "FG", x_base, y_depth, radius, 1, mat, rng.uniform(0.75, 0.95), rng.uniform(0.14, 0.26))

    for i in range(42):
        side = -1.0 if (i % 2 == 0) else 1.0
        x_base = side * rng.uniform(1.46, 2.82)
        y_depth = rng.uniform(-0.35, 0.35)
        radius = rng.uniform(0.032, 0.062)
        mat = mat_gold if (i % 3 == 0) else (mat_crimson if (i % 3 == 1) else mat_ash)
        spawn_ember(100 + i, "MID", x_base, y_depth, radius, 1 if (i % 3 != 0) else 2, mat, rng.uniform(0.82, 0.98), rng.uniform(0.12, 0.24))

    for i in range(8):
        side = -1.0 if (i % 2 == 0) else 1.0
        x_base = side * rng.uniform(0.92, 1.42)
        y_depth = rng.uniform(-0.7, 0.7)
        radius = rng.uniform(0.022, 0.034)
        mat = mat_gold if (i % 2 == 0) else mat_crimson
        spawn_ember(200 + i, "INNER", x_base, y_depth, radius, 2, mat, rng.uniform(0.24, 0.36), rng.uniform(0.10, 0.18))

    for i in range(24):
        if i < 18:
            side = -1.0 if (i % 2 == 0) else 1.0
            x_base = side * rng.uniform(1.38, 2.85)
        else:
            x_base = rng.uniform(-1.35, 1.35)
        y_depth = rng.uniform(1.75, 2.75)
        radius = rng.uniform(0.048, 0.086)
        mat = mat_ash if (i % 2 == 0) else mat_crimson
        max_op = rng.uniform(0.55, 0.78) if abs(x_base) > 1.3 else rng.uniform(0.18, 0.28)
        spawn_ember(300 + i, "BG", x_base, y_depth, radius, 1, mat, max_op, rng.uniform(0.15, 0.28))

    sphere_template.hide_render = True
    sphere_template.hide_viewport = True

    return embers


def lightning_envelope(frame_idx, peak_frame):
    d1 = (frame_idx - peak_frame) / 2.2
    d2 = (frame_idx - (peak_frame + 5.0)) / 1.8
    v = math.exp(-0.5 * d1 * d1) + 0.68 * math.exp(-0.5 * d2 * d2)
    if v < 0.01:
        return 0.0
    return min(1.0, v)


def update_scene_for_frame(frame_idx, total_frames, top_rig, lightning_rig, smoke_rig, embers):
    raw_u = frame_idx / float(total_frames)
    if frame_idx >= total_frames - 3:
        seam_t = (frame_idx - (total_frames - 4)) / 4.0
        u = raw_u * (1.0 - seam_t)
    else:
        u = raw_u
    theta = 2.0 * math.pi * u

    w_circle = 0.42 * math.sin(theta)
    top_rig["corona_noise"].inputs["W"].default_value = w_circle
    top_rig["corona_pulse"].inputs[1].default_value = 0.86 + 0.14 * math.sin(theta)
    top_rig["kintsugi_noise"].inputs["W"].default_value = 0.48 * math.cos(theta)

    rot_z = (2.0 * math.pi / 12.0) * u
    top_rig["monolith_parent"].rotation_euler = (math.radians(77.0), math.radians(5.0), rot_z)
    top_rig["ring_obj"].rotation_euler = (math.radians(77.0), math.radians(5.0), rot_z)

    l_flash = max(
        lightning_envelope(frame_idx, 26.0),
        0.48 * lightning_envelope(frame_idx, 88.0),
    )
    r_flash = max(
        lightning_envelope(frame_idx, 86.0),
        0.48 * lightning_envelope(frame_idx, 28.0),
    )
    for node in lightning_rig["nodes_left"]:
        node.outputs[0].default_value = l_flash
    for node in lightning_rig["nodes_right"]:
        node.outputs[0].default_value = r_flash

    smoke_rig["left_noise"].inputs["W"].default_value = 0.55 * math.sin(theta)
    smoke_rig["left_map"].inputs["Location"].default_value = (
        0.18 * math.cos(theta),
        0.18 * math.sin(theta),
        0.22 * math.sin(theta),
    )
    smoke_rig["right_noise"].inputs["W"].default_value = 0.55 * math.cos(theta)
    smoke_rig["right_map"].inputs["Location"].default_value = (
        -0.18 * math.sin(theta),
        0.18 * math.cos(theta),
        0.22 * math.cos(theta),
    )

    z_min = -4.15
    z_max = 4.15
    z_span = z_max - z_min

    for e in embers:
        prog = (u * e["speed_cycles"] + e["phase"]) % 1.0
        z_pos = z_min + prog * z_span
        sway_ang = 2.0 * math.pi * (u * e["speed_cycles"]) + e["sway_phase"]
        x_pos = e["x_base"] + e["sway_amp"] * math.sin(sway_ang)
        y_pos = e["y_depth"] + 0.08 * math.cos(sway_ang)

        if prog < 0.15:
            edge_fade = prog / 0.15
        elif prog > 0.85:
            edge_fade = (1.0 - prog) / 0.15
        else:
            edge_fade = 1.0

        flicker = 0.84 + 0.16 * math.sin(sway_ang * 2.0)
        alpha = max(0.0, min(1.0, e["max_opacity"] * edge_fade * flicker))

        obj = e["obj"]
        obj.location = (x_pos, y_pos, z_pos)
        obj.color = (alpha, alpha, alpha, 1.0)


def main():
    frame_start, frame_end, output_prefix, samples, res_x, res_y, save_blend, skip_existing = parse_args()

    out_dir = os.path.dirname(output_prefix)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    clear_scene()
    scene = bpy.context.scene
    setup_render_engine(scene, samples=samples, res_x=res_x, res_y=res_y)
    setup_camera_and_lights(scene)

    top_rig = build_top_black_sun_and_corona(scene)
    lightning_rig = build_side_lightning_bolts(scene)
    smoke_rig = build_bottom_corner_smoke(scene)
    embers = build_layered_embers(scene)

    total_frames = 120

    if save_blend:
        update_scene_for_frame(26, total_frames, top_rig, lightning_rig, smoke_rig, embers)
        blend_dir = os.path.dirname(save_blend)
        if blend_dir:
            os.makedirs(blend_dir, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=save_blend)
        print(f"[black_sun_ember_storm.py] Saved .blend file to {save_blend}")

    for f in range(frame_start, frame_end + 1):
        frame_path = f"{output_prefix}{f:04d}.png"
        if skip_existing and os.path.exists(frame_path) and os.path.getsize(frame_path) > 1024:
            print(f"[black_sun_ember_storm.py] Skipping existing frame {f:04d}: {frame_path}")
            continue

        scene.frame_set(f)
        update_scene_for_frame(f, total_frames, top_rig, lightning_rig, smoke_rig, embers)
        scene.render.filepath = frame_path
        bpy.ops.render.render(write_still=True)
        print(f"[black_sun_ember_storm.py] Rendered frame {f:04d} -> {frame_path}")


if __name__ == "__main__":
    main()
