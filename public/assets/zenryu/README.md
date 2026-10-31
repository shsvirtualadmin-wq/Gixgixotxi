# Zenryu — Layered Dragon Companion Assets (`/assets/zenryu/`)

This directory holds the layered transparent `.webp` raster art parts for **Zenryu**, the Boardly Cockpit dragon companion (`<DragonCompanion />`).

## Required Asset Slots & Specifications

All dragon parts share a unified **960 × 640 px** canvas (maximum 1024 px on any edge, transparent RGBA WebP, `< 150 KB` per file, `< 600 KB` total across all assets) so that layers align pixel-for-pixel without manual offset drift.

| Filename | Layer Order (Back → Front) | Transform Pivot (`transform-origin`) | Max Resolution | Target Weight | Description |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `wing-l.webp` | 1 (Back) | `53.6% 49.2%` (`515px, 315px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Far/left swept dragon wing with obsidian wing-arm bones, scalloped dark-crimson membrane, and ember veins. Animated with CSS/JS wing-flap transform. |
| `tail.webp` | 2 | `45.3% 60.2%` (`435px, 385px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Long spiked whip tail with overlapping obsidian scales, dorsal crimson spines, and bladed halberd spade tip. Animated with sinuous sway transform. |
| `zenryu-body.webp` | 3 | `55.7% 55.5%` (`535px, 355px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Core armored torso, glowing crimson ventral chest scutes, dorsal ridge spikes, and razor talons. Animated with breathing scale transform. |
| `wing-r.webp` | 4 | `53.6% 49.2%` (`515px, 315px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Near/right foreground dragon wing with detailed membrane veins, rim lighting, and apex wing claw. Animated in primary wing-flap phase. |
| `head.webp` | 5 | `66.9% 42.5%` (`642px, 272px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Fierce horned draconic skull, arched armored neck, swept elder horns, and fangs. Rotates dynamically to follow the user's finger/pointer inside the stage. |
| `eyes-glow.webp` | 6 | `66.9% 42.5%` (`642px, 272px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Glowing ember-red slit dragon eye and trailing ethereal flame wisp.Synchronized with `head.webp` and fades out when Zenryu sleeps. |
| `flame-roar.webp` | 7 (Front) | `82.5% 36.9%` (`792px, 236px`) | `960 × 640` (`≤ 1024px`) | `< 150 KB` | Volumetric dragon fire burst jetting from the jaws when Zenryu is tapped and roars. |
| `dragon-egg.webp` | Locked State | `50% 50%` (`256px, 256px`) | `512 × 512` (`≤ 1024px`) | `< 150 KB` | Obsidian-and-crimson scaled dragon egg with glowing internal magma fissures, displayed inside the stage for students under 1,000 correct answers. |

## Replacing or Updating Art

To swap in custom painted key-art or Spine/PSD layer exports:
1. Export each part as a transparent `.webp` at `960 × 640 px` (or up to `1024 px` max width) keeping the pivot coordinates above.
2. Keep each file under `150 KB` and total directory weight under `600 KB`.
3. Place the files into `/public/assets/zenryu/` (served at `/assets/zenryu/<filename>`).
