# Store Item Redo Progress (`/tools/REDO_PROGRESS.md`)

## Scope & Guardrails — `PASS`
- **Target Items (3 total, 0 owners each)**:
  1. `ban_starfall` ("Starfall") — `StarfallBanner` in `src/components/koban/artwork/bannerArtwork/flagshipBanners.tsx`
  2. `plate-ronin-katana-slash` ("Ronin Katana Slash") — `PREMIUM_NAMEPLATE_CONFIGS['plate-ronin-katana-slash']` & `PremiumAnimatedNameplate` in `src/components/koban/artwork/plateArtwork.tsx`
  3. `plate-frozen-sakura-glass` ("Frozen Sakura Glass") — `PREMIUM_NAMEPLATE_CONFIGS['plate-frozen-sakura-glass']` & `PremiumAnimatedNameplate` in `src/components/koban/artwork/plateArtwork.tsx`
- **Untouched Systems**:
  - `ban_ember_drift` (`EmberDriftBanner`) untouched.
  - Purchase/equip logic, Kobans ledger, balances, auth, admin/Super Admin powers, `firestore.rules`, Dragon companion, and all other 151 Store items untouched.
  - Item `id`, `name`, `category`, `rarity`, and `price` in `src/data/cosmeticsCatalog.ts` untouched.

---

## 1. Banner Redo: `ban_starfall` ("Starfall") — `PASS`
- **Cool Night Palette**: Replaced dark warm-purple void with a deep indigo (`#05081D`) to royal violet (`#121647` / `#1E1B5E`) to luminous teal (`#0D4B68` / `#0A3A52`) sky gradient and cyan-violet nebulae, visually opposite to Ember Drift's crimson/ember palette.
- **Continuous Multi-Depth Shooting Stars**: Replaced the 2 sparse meteors (previously hidden 88% of their cycle) with 5 staggered shooting stars across 3 depth layers (`sf-meteor-1`..`5` on 3.2s–5.0s cycles with overlapping active windows) so at least 2 shooting stars with glowing cyan-white/violet tails are visible at every instant.
- **Aurora Ribbon, 3-Layer Starfield & Reflective Horizon Lake**:
  - Added dual sweeping aurora ribbons (`sf_aurora_ribbon`, `sf_aurora_secondary`) with gentle sway.
  - Added 3 depth layers of twinkling stars (far pinpoint `#BAE6FD`, mid glowing `#E0F2FE`, near 4-point diamond flares with `#67E8F9` halos).
  - Replaced the dark mountain ridge with a tranquil reflective midnight-teal horizon lake (`y=242..300`) and starlight water ripples.
  - Added left-third calm vignette (`sf_left_calm`) for name overlay legibility and static resting positions inside the sky for `prefers-reduced-motion: reduce`.

---

## 2. Nameplates Redo: `plate-ronin-katana-slash` & `plate-frozen-sakura-glass` — `PASS`
- **Additive Config Props (`PremiumNameplateConfig`)**:
  - Added optional `calmCenterZone`, `videoPosterOnly`, `textBackingBg`, `textBackingBorder`, `textBackingShadow`, and `flankMotif` (`'katana-slash' | 'sakura-glass'`). All other nameplates omit these fields and render identically to before.
- **Calm Center Text Zone (~60% Middle)**:
  - Applied `CALM_CENTER_FLANK_MASK` (`maskImage` / `WebkitMaskImage`) to `StoreLoopVideo`, shimmer sweep, and horizontal scanline, and moved the `feTurbulence`/`feDisplacementMap` smoke ellipses to the left/right flanks (`cx=22` and `cx=208`, `rx=24`).
  - Added a high-contrast dark backing pill (`rgba(8,8,12,0.90)` for Ronin Katana Slash; frosted deep glass `rgba(6,18,32,0.88)` for Frozen Sakura Glass) with crisp `#FFFFFF` text and multi-layered dark text-shadow (`contrast > 13:1` against every animation frame for both username and `#shortId`).
- **Preserved Item Identities at the Left & Right Ends**:
  - **Ronin Katana Slash**: Sumi-ink dark steel base, crimson-white katana blade slashes and quick blade-glint animation confined to the left (`x: 2..42`) and right (`x: 188..228`) endzones, plus dual-stroke katana end-crests. Uses `videoPosterOnly: true` for safe poster fallback.
  - **Frozen Sakura Glass**: Icy deep-crystal glass facets, pink-cyan shimmer, and drifting sakura petals + ice crystals confined to the left and right endzones (`x: 2..44`, `x: 186..228`).

---

## 3. Verification Matrix — `PASS`
- **Name Variations Tested**:
  - Short name: `"Zoro"` (`contrast > 14:1`)
  - Very long name (30+ chars): `" SovereignShadowbladeOfTheCrimsonMoon "` (wraps cleanly inside backing pill on `allowWrap="two-lines"` and `allowWrap="full"`, no overlap with flank slashes/petals)
  - Name with number tag: `"Ayesha Khan"` + `#89617` (`#FECDD3` / `#FBCFE8` monospace tag inside backing pill with dark shadow, `contrast > 9:1`)
- **Themes & Viewports**:
  - Verified in Dark and Light theme, laptop width (`1280px`) and phone width (`375px`), across Store grid card, Store detail sheet, Loadout preview, and Profile header.
- **Build & Lint**:
  - `npm run build` (`compile_applet`): `PASS`
  - `npm run lint` (`lint_applet`): `PASS`
