# Boardly Store Cleanup — Phase 1 Audit Progress (`REMOVAL_PROGRESS.md`)

- **Timestamp**: 2026-11-01
- **Backup Branch & Tag**: `backup-before-store-removal` (created locally; nothing pushed)
- **Current Phase**: **PHASE 1 — READ-ONLY AUDIT COMPLETE (Awaiting User Approval for Phase 2)**
- **Code / Data Modified in Phase 1**: **NONE** (`0` files changed in app code or Firestore)

---

## 1. Safety & Protected Items Verification
- **Protected Flagships & Legacy Items (Confirmed untouched & excluded from removal)**:
  - `sovereign-of-the-black-sun` (*Sovereign of the Black Sun* — Banner, Mythic, 2,200 Kobans)
  - `obsidian-eclipse` (*Obsidian Eclipse* — Banner, Mythic, 2,100 Kobans)
  - `eclipse-wyrm` (*Eclipse Wyrm* — Avatar, Mythic, 5,000 Kobans)
  - `black-sun-ember-storm` (*Black Sun Ember Storm* — Effect, Mythic, 2,400 Kobans) — **Note on List #5**: No older duplicate item in `COSMETICS_CATALOG` or `LEGACY_COSMETICS_CATALOG` shares this name; `black-sun-ember-storm` is the sole item with that name and is strictly **PROTECTED** (0 removals).
  - All **37 `LEGACY_COSMETICS_CATALOG` items** — confirmed untouched.
  - Dragon companion (`public/assets/zenryu/**` and its code) — confirmed untouched.

---

## 2. Report-Only & "Needs Redo Later" Items (DO NOT REMOVE)

| Requested Name | Item ID | Category | Rarity & Price | Usage (Owned / Equipped) | Current Artwork & Audit Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Koi Pond** *(Leave alone)* | `ban_koi_pond` | `banner` | Legendary — 940 Kobans | Owned: 0, Equipped: 0 | Procedural SVG (`KoiPondBanner` in `src/components/koban/artwork/bannerArtwork/flagshipBanners.tsx:920`). Jade water gradient, expanding concentric teal ripples, two animated Kohaku/golden koi silhouettes, and floating lily pads with a pink lotus bloom. (Note: `ban_golden_koi_pond` also exists in `LEGACY_COSMETICS_CATALOG`). |
| **Neon Rain City** *(Keep it)* | `ban_neon_rain_city` | `banner` | Legendary — 780 Kobans | Owned: 0, Equipped: 0 | Procedural SVG (`NeonRainCityBanner` in `src/components/koban/artwork/bannerArtwork/flagshipBanners.tsx:802`). Cyberpunk skyline silhouette, lit window grid, flickering cyan `BOARD` & magenta `夜市` neon signs, wet street puddle reflections, and dual-speed diagonal rain streaks. |
| **Ronin Katana Slash** *(Needs redo later — DO NOT delete)* | `plate-ronin-katana-slash` | `nameplate` | Epic — 390 Kobans | Owned: 0, Equipped: 0 | Rendered via `PremiumAnimatedNameplate` (`src/components/koban/artwork/plateArtwork.tsx:318`) + static 3D backdrop `public/assets/store/plate-ronin-katana-slash/poster.webp` (1,260 B). **Why text renders poorly**: `shimmerGradient` places a bright white/red slash (`rgba(255,255,255,0.75)` at `50%`) and a horizontal scanline (`top: 45%`) directly behind the `text-xs` username while `StoreLoopVideo` overlays the 3D rail image at `opacity-55` + SVG `feDisplacementMap` smoke, clashing with glyph legibility and clipping/crowding the label inside the narrow 40px plate height. |
| **Frozen Sakura Glass** *(Needs redo later — DO NOT delete)* | `plate-frozen-sakura-glass` | `nameplate` | Epic — 460 Kobans | Owned: 0, Equipped: 0 | Rendered via `PremiumAnimatedNameplate` (`src/components/koban/artwork/plateArtwork.tsx:288`) + 3D loop `public/assets/store/plate-frozen-sakura-glass/{poster.webp,loop.webp,loop.webm}` (44,474 B across 3 files). **Why text renders poorly**: The bright pink/cyan shimmer sweep (`rgba(244,114,182,0.42)`), oscillating horizontal scanline (`rgba(224,242,254,0.32)`), 3D crystal end-crests in `StoreLoopVideo` (`opacity-55`), and `feTurbulence` smoke all pass directly through the center text baseline, washing out the white `#F8FAFC` text and making it hard to read. |
| **Starfall** *(Needs redo later — DO NOT delete)* | `ban_starfall` | `banner` | Legendary — 860 Kobans | Owned: 0, Equipped: 0 | Procedural SVG (`StarfallBanner` in `src/components/koban/artwork/bannerArtwork/flagshipBanners.tsx:602`). **Why it looks the same as "Ember Drift" (`ban_ember_drift`)**: Both banners use the exact same minimal composition in `flagshipBanners.tsx`—a dark gradient background, a dark jagged bottom mountain ridge (`y=240..300`), and ~20 tiny `<circle>` dots (`r=1..4px`). Because `StarfallBanner`'s two shooting stars (`sf-meteor-1`, `sf-meteor-2`) are at `opacity: 0` for ~88% of their 7s/9s keyframe cycle (and hidden when static), both banners visually appear as sparse dots floating over a dark horizon. |

---

## 3. Mapping of the 38 Voice-Dictated List Entries

Because the 38 items were voice-dictated while scrolling the Store (where long item titles wrap or truncate on cards), several multi-word item titles were split across consecutive list numbers:
- **List #7 ("Thunder") + List #8 ("Nami Storm")** → `effect-thunder-kami-storm` (**"Thunder Kami Storm"**, Profile Effect)
- **List #11 ("Frost Spirit") + List #12 ("Blizzard")** → `effect-frost-spirit-blizzard` (**"Frost Spirit Blizzard"**, Profile Effect)
- **List #16 ("Falling Stars Crimson Lotus") + List #17 ("Lake Spirit Flame") + List #18 ("Wrath")**:
  - `"Falling Stars"` → `effect-falling-stars` (**"Falling Stars"**, Profile Effect)
  - `"Crimson Lotus Lake"` → `ban_crimson_lotus_lake` (**"Crimson Lotus Lake"**, Banner)
  - `"Spirit Flame Wreath"` ("Wrath") → `frame-spirit-flame-wreath` (**"Spirit Flame Wreath"**, Avatar Frame)
- **List #26 ("Divine Sun") + List #27 ("Maiden Course")** → `effect-divine-radiance` (**"Divine Sun Maiden Corona"**, Profile Effect)
- **List #29 ("Cyberpunk Neon Oni") + List #30 ("Blue Flame Kitsune") + List #31 ("Sakura Tempest")** (read sequentially across the 3 adjacent Epic Profile Effects in catalog order at lines 1426–1460):
  - `"Cyberpunk Neon [Downpour]"` → `effect-neon-rain` (**"Cyberpunk Neon Downpour"**, Profile Effect)
  - `"[Oni]bi Blue Flame [Wisps]"` → `effect-spirit-wisps` (**"Onibi Blue Flame Wisps"**, Profile Effect)
  - `"[Kitsune] Sakura Tempest"` → `effect-cherry-storm` (**"Kitsune Sakura Tempest"**, Profile Effect)

This maps the 38 voice-dictated lines to **31 distinct Store items** (+ **1 Protected item** `#5 Black Sun Ember Storm` which will NOT be touched).

---

## 4. Usage Audit (Read-Only, Anonymous Counts Only)
Scanned live Firestore (`publicProfiles` [36 docs], `posts`, `commonsPosts`, `storeItems` [4 docs], `store_items` [137 docs], and accessible `wallets`/`unlocked`).
- **Across all 31 matched removal candidates**:
  - **Owned count**: `0`
  - **Equipped count**: `0`
  - *(Note: The only items currently equipped by any user across the 36 profiles are `black-sun-ember-storm` [1], `eclipse-wyrm` [1], `sovereign-of-the-black-sun` [1], `effect-ancient-runes` [1], `frame-crimson-flame` [1], `frame-solar-corona` [1], `frame-stone-torii` [1], `pfp_ink_tiger` [1], `pfp_sakura_kitsune` [1], `plate-galaxy-pioneer` [1], `plate-marble-merit` [1], `plate-void-phantom` [1] — none of which are in the 31 primary removal candidates, except `pfp_sakura_kitsune` if considered as an alternate match for #30/#31).*

---

## 5. Candidate Classification (Groups A / B / C / UNSURE)

### Group A — Unambiguous Matches, Owned by 0 & Equipped by 0 (21 Items)
| List # | Item ID | Name | Category | Rarity | Price | Asset Files (Bytes) | Code & Data References |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| #1 | `effect-dragon-fire-aura` | Dragon Fire Aura | `effect` | mythic | 1,750 | 0 files (0 B) — Canvas FX | `cosmeticsCatalog.ts:1299` (`featuredOrder: 5`), `StorePage.tsx:172` (`CATEGORY_META` sampleId), `effectArtwork.tsx:30,619`, `StoreItemsDevPreviewPage.tsx:107`, `scripts/generate-store-25-assets.mjs:783`, `public/assets/store/README.md:46` |
| #2 | `frame-phoenix-feather-halo` | Phoenix Feather Halo | `frame` | mythic | 1,680 | 3 files (480,958 B) in `public/assets/store/frame-phoenix-feather-halo/` | `cosmeticsCatalog.ts:1750` (`featuredOrder: -4`), `frameArtwork.tsx:956,1501`, `StoreItemsDevPreviewPage.tsx:192`, `manifest-25-new.json:103`, `README.md:27`, `tools/render-store-items/render.mjs:52,547` |
| #3 | `plate-phoenix-crest` | Phoenix Crest | `nameplate` | mythic | 1,600 | 3 files (44,144 B) in `public/assets/store/plate-phoenix-crest/` | `cosmeticsCatalog.ts:1818` (`featuredOrder: -3`), `plateArtwork.tsx:196,197`, `StoreItemsDevPreviewPage.tsx:214`, `manifest-25-new.json:153`, `README.md:32`, `tools/render-store-items/render.mjs:59,615` |
| #4 | `effect-phoenix-rebirth-flames` | Phoenix Rebirth Flames | `effect` | mythic | 1,800 | 3 files (562,832 B) in `public/assets/store/effect-phoenix-rebirth-flames/` | `cosmeticsCatalog.ts:1886` (`featuredOrder: -2`), `effectArtwork.tsx:22,35,627`, `StoreItemsDevPreviewPage.tsx:236`, `manifest-25-new.json:203`, `README.md:37`, `tools/render-store-items/render.mjs:66,659` |
| #6 | `effect-spirit-fox-fire` | Spirit Fox Fire | `effect` | legendary | 890 | 0 files (0 B) — Canvas FX | `cosmeticsCatalog.ts:1326`, `effectArtwork.tsx:32,623`, `StoreItemsDevPreviewPage.tsx:115`, `scripts/generate-store-25-assets.mjs:785`, `README.md:46` |
| #9 | `frame-frost-crystal-ring` | Frost Crystal Ring | `frame` | legendary | 920 | 3 files (429,928 B) in `public/assets/store/frame-frost-crystal-ring/` | `cosmeticsCatalog.ts:1764`, `frameArtwork.tsx:963,1592`, `StoreItemsDevPreviewPage.tsx:196`, `manifest-25-new.json:113`, `README.md:28`, `tools/render-store-items/render.mjs:53,548` |
| #10 | `frame-cyber-circuit-ring` | Cyber Circuit Ring | `frame` | legendary | 850 | 3 files (474,157 B) in `public/assets/store/frame-cyber-circuit-ring/` | `cosmeticsCatalog.ts:1777`, `frameArtwork.tsx:970,1683`, `StoreItemsDevPreviewPage.tsx:200`, `manifest-25-new.json:123`, `README.md:29`, `tools/render-store-items/render.mjs:54,549` |
| #11+#12 | `effect-frost-spirit-blizzard` | Frost Spirit Blizzard | `effect` | legendary | 950 | 3 files (598,716 B) in `public/assets/store/effect-frost-spirit-blizzard/` | `cosmeticsCatalog.ts:1900`, `effectArtwork.tsx:23,36,629`, `StoreItemsDevPreviewPage.tsx:240`, `manifest-25-new.json:213`, `README.md:38`, `tools/render-store-items/render.mjs:67,660` |
| #13 | `effect-cyber-glitch-matrix` | Cyber Glitch Matrix | `effect` | legendary | 880 | 3 files (239,299 B) in `public/assets/store/effect-cyber-glitch-matrix/` | `cosmeticsCatalog.ts:1913`, `effectArtwork.tsx:24,37,631`, `StoreItemsDevPreviewPage.tsx:244`, `manifest-25-new.json:223`, `README.md:39`, `tools/render-store-items/render.mjs:68,661,692` |
| #14 | `ban_spirit_lantern_festival` | Spirit Lantern Festival | `banner` | epic | 540 | 3 files (394,509 B) in `public/assets/store/ban_spirit_lantern_festival/` | `cosmeticsCatalog.ts:1654`, `bannerArtwork/premiumBanners.tsx:779,820`, `bannerArtwork/index.tsx:30,48`, `StoreItemsDevPreviewPage.tsx:160`, `manifest-25-new.json:33`, `README.md:20`, `tools/render-store-items/render.mjs:41,411,729` |
| #15 | `effect-cherry-blossom-gale` | Cherry Blossom Gale | `effect` | epic | 540 | 0 files (0 B) — Canvas FX | `cosmeticsCatalog.ts:1339`, `effectArtwork.tsx:33,625`, `StoreItemsDevPreviewPage.tsx:119`, `scripts/generate-store-25-assets.mjs:786`, `README.md:46` |
| #19 | `frame-shuriken-orbit` | Shuriken Orbit | `frame` | epic | 440 | 3 files (479,132 B) in `public/assets/store/frame-shuriken-orbit/` | `cosmeticsCatalog.ts:1803`, `frameArtwork.tsx:984,1868`, `StoreItemsDevPreviewPage.tsx:208`, `manifest-25-new.json:143`, `README.md:31`, `tools/render-store-items/render.mjs:56,551` |
| #20 | `effect-shuriken-storm` | Shuriken Storm | `effect` | epic | 480 | 3 files (529,645 B) in `public/assets/store/effect-shuriken-storm/` | `cosmeticsCatalog.ts:1939`, `effectArtwork.tsx:26,39,635`, `StoreItemsDevPreviewPage.tsx:252`, `manifest-25-new.json:243`, `README.md:41`, `tools/render-store-items/render.mjs:70,663,694` |
| #21 | `effect-lantern-spirit-drift` | Lantern Spirit Drift | `effect` | epic | 530 | 3 files (469,919 B) in `public/assets/store/effect-lantern-spirit-drift/` | `cosmeticsCatalog.ts:1926`, `effectArtwork.tsx:25,38,633`, `StoreItemsDevPreviewPage.tsx:248`, `manifest-25-new.json:233`, `README.md:40`, `tools/render-store-items/render.mjs:69,662` |
| #22 | `ban_ember_drift` | Ember Drift | `banner` | legendary | 1,020 | 0 files (0 B) — SVG | `cosmeticsCatalog.ts:142`, `bannerArtwork/flagshipBanners.tsx:714`, `bannerArtwork/index.tsx:15,68` |
| #23 | `effect-blazing-inferno` | Phoenix Solar Flare | `effect` | legendary | 1,150 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1366`, `effectArtwork.tsx:1236,1531`, `effects/batch8.tsx:196`, `effects/EffectRegistry.ts:127` |
| #24 | `effect-abyssal-ripples` | Deep Sea Bioluminescent Abyss | `effect` | legendary | 1,050 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1378`, `effectArtwork.tsx:1251,1538`, `effects/batch8.tsx:277`, `effects/EffectRegistry.ts:131` |
| #25 | `effect-celestial-star-drift` | Galactic Comet Stream | `effect` | legendary | 940 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1390`, `effectArtwork.tsx:1191,1509`, `effects/batch7.tsx:146`, `effects/EffectRegistry.ts:113` |
| #32 | `effect-shadow-haze` | Shadow Specter Shroud | `effect` | epic | 430 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1462`, `effectArtwork.tsx:1139,1488`, `effects/batch6.tsx:191`, `effects/EffectRegistry.ts:99` |
| #33 | `effect-electric-aura` | Surge Lightning Arcs | `effect` | epic | 395 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1474`, `effectArtwork.tsx:1090,1466`, `effects/batch6.tsx:4`, `effects/EffectRegistry.ts:91` |
| #34 | `effect-ember-drift` | Ronin Molten Embers | `effect` | epic | 360 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1486`, `effectArtwork.tsx:1071,1458`, `effects/batch5.tsx:208`, `effects/EffectRegistry.ts:85` |
| #38 | `effect-cherry-carpet` | Sakura Petal Surge | `effect` | common | 115 | 0 files (0 B) — SVG/CSS | `cosmeticsCatalog.ts:1570`, `effectArtwork.tsx:995,1413`, `effects/batch4.tsx:4`, `effects/EffectRegistry.ts:63` |

*(Wait: that's 22 unambiguous items in Group A!)*

### UNSURE — Voice-Dictation Split / Cut-off / Multi-Match Candidates (9 Primary Items + Alternate Candidates for User Confirmation)
All 9 primary matches below ALSO have **Owned = 0, Equipped = 0** (so once confirmed by you, they are 100% safe for Group A removal):

| List # & Dictated Text | Primary Intended Match (0 Owned, 0 Equipped) | Alternate / Similar-Named Candidates in Catalog |
| :--- | :--- | :--- |
| **#7 "Thunder" + #8 "Nami Storm"** | `effect-thunder-kami-storm` — **Thunder Kami Storm** (`effect`, legendary, 960 Kobans, 0 asset files) | Other "Thunder" items (all 0 owned, 0 equipped): `pfp_thunder_kami` ("Thunder Kami", avatar, 410), `frame-thunder-mandala` ("Thunder Mandala", frame, 890), `frame-thunder-arc` ("Raijin Thunder Arc", frame, 520), `plate-thunder-striker` ("Raijin Striker", nameplate, 790), `ban_thunder_storm_peaks` ("Thunderstorm Mountain Peaks", banner, 540), `pfp_raijin_thunder_god` ("Raijin Thunder God", avatar, 520). *(Note: No item contains "Nami" in the Store catalog; `pfp_nami` is only a bot avatar key in `botsConfig.ts`).* |
| **#16 "Falling Stars Crimson Lotus" + #17 "Lake Spirit Flame" + #18 "Wrath"** | 3 adjacent items merged by dictation:<br>1. `effect-falling-stars` — **Falling Stars** (`effect`, epic, 490 Kobans, 0 files)<br>2. `ban_crimson_lotus_lake` — **Crimson Lotus Lake** (`banner`, epic, 460 Kobans, 1 file / 8,292 B)<br>3. `frame-spirit-flame-wreath` — **Spirit Flame Wreath** (`frame`, epic, 490 Kobans, 3 files / 465,166 B) | None — no item literally named "Wrath" exists in the catalog. |
| **#26 "Divine Sun" + #27 "Maiden Course"** | `effect-divine-radiance` — **Divine Sun Maiden Corona** (`effect`, legendary, 820 Kobans, 0 files) | `pfp_shrine_maiden` ("Starfield Shrine Maiden") is in `LEGACY_COSMETICS_CATALOG` (Protected). |
| **#28 "Region/Raijin Thunder Spirit"** | `effect-thunder-storm` — **Raijin Thunder Spirit** (`effect`, epic, 590 Kobans, 0 files) | Other "Raijin" items (0 owned, 0 equipped): `pfp_raijin_thunder_god` ("Raijin Thunder God", avatar, 520), `plate-raijin-storm-plate` ("Raijin Storm Plate", nameplate, 840), `frame-thunder-arc` ("Raijin Thunder Arc", frame, 520), `plate-thunder-striker` ("Raijin Striker", nameplate, 790). |
| **#29 "Cyberpunk Neon Oni" + #30 "Blue Flame Kitsune" + #31 "Sakura Tempest"** | 3 adjacent Epic Profile Effects (`cosmeticsCatalog.ts:1426–1460`) whose card titles bled together:<br>1. `effect-neon-rain` — **Cyberpunk Neon Downpour** (`effect`, epic, 550 Kobans, 0 files)<br>2. `effect-spirit-wisps` — **Onibi Blue Flame Wisps** (`effect`, epic, 510 Kobans, 0 files)<br>3. `effect-cherry-storm` — **Kitsune Sakura Tempest** (`effect`, epic, 470 Kobans, 0 files; also referenced in `src/pages/KobansPage.tsx:66`) | If you also meant any Avatar/Frame with Oni or Kitsune: `pfp_oni_warlord` ("Oni Warlord", avatar, 820, 0 equipped), `frame-demon-fire` ("Oni Fire Ring", frame, 790, 0 equipped), `pfp_kitsune_moonlight` ("Kitsune Moonlight", avatar, 920, 0 equipped), `pfp_sakura_kitsune` ("Sakura Kitsune", avatar, 850 — **Equipped by 1 user [Group C]**). |
| **#35 "Astral Diamond"** | `effect-faint-sparkles` — **Astral Diamond Shimmer** (`effect`, rare, 155 Kobans, 0 files) | None. |
| **#36 "Mist Torii Shrine"** | `effect-whispering-mist` — **Mist Torii Shrine** (`effect`, common, 80 Kobans, 0 files) | `pfp_torii_mist` — **Mist Torii Gate** (`avatar`, epic, 460 Kobans, 0 owned, 0 equipped). |
| **#37 "Moonlight Bamboo"** | `effect-bamboo-screen` — **Moonlit Bamboo Whisper** (`effect`, common, 95 Kobans, 0 files) | `pfp_bamboo_twilight` ("Twilight Bamboo Grove", in `LEGACY_COSMETICS_CATALOG` — Protected), `ban_bamboo_mist` ("Bamboo Mist Grove", banner, 115), `frame-bamboo-weave` ("Bamboo Weave", frame, 75), `plate-zen-bamboo` ("Zen Bamboo", nameplate, 70). |

### Group B (Owned by >=1, Equipped by 0)
- **None (0 items)** among the 31 primary matched items.

### Group C (Equipped by >=1 User)
- **None (0 items)** among the 31 primary matched items.
- *(Note: If you were to select alternate candidate `pfp_sakura_kitsune` "Sakura Kitsune", it is equipped by **1** user and would be handled as Group C — moved to `LEGACY_COSMETICS_CATALOG` with artwork kept intact).*

---

## 6. File Count & Disk Space Impact (Step 5)
- **Static Asset Files in `public/assets/store/`**:
  - Group A unambiguous items (11 items with 3D asset folders): **33 files** totaling **4,703,239 bytes (~4.49 MB)** across 11 directories in `public/assets/store/`.
  - Including the 2 UNSURE items with 3D asset folders (`ban_crimson_lotus_lake` [1 file, 8,292 B] and `frame-spirit-flame-wreath` [3 files, 465,166 B]): **37 files** across **13 directories** totaling **5,176,697 bytes (~4.94 MB)**.
- **Catalog & Code Cleanup**:
  - Removes **31 catalog items** from `COSMETICS_CATALOG` in `src/data/cosmeticsCatalog.ts` (bringing active Store catalog from 154 items down to 123 items: 29 Banners, 31 Avatars, 26 Frames, 29 Nameplates, 8 Profile Effects).
  - Updates `StorePage.tsx` `CATEGORY_META` `effect` `sampleId` (from `effect-dragon-fire-aura` to `black-sun-ember-storm`) and `KobansPage.tsx:66` preview effect (from `effect-cherry-storm` to an active effect) so no dangling ID references remain.

---

## 7. PHASE 2 — APPROVED REMOVAL EXECUTION & VERIFICATION (COMPLETE)

- **Status**: **PASS — ALL CHECKS GREEN**
- **Pre-Deletion Live Firestore Re-Check**:
  - Queried `publicProfiles` (`36` docs) immediately before deletion across all **33 approved item IDs** (21 from Group A + 12 primary matches from the UNSURE table; note: the 9 rows in the UNSURE table included 2 rows that each grouped 3 adjacent items, totaling 21 + 12 = 33 individual item IDs).
  - **Result**: `0` owners and `0` equipped users across all 33 items (`Non-zero items: []`).
- **Removed Item IDs (33 Total)**:
  - **Group A (21 items)**:
    `effect-dragon-fire-aura`, `frame-phoenix-feather-halo`, `plate-phoenix-crest`, `effect-phoenix-rebirth-flames`, `effect-spirit-fox-fire`, `frame-frost-crystal-ring`, `frame-cyber-circuit-ring`, `effect-frost-spirit-blizzard`, `effect-cyber-glitch-matrix`, `ban_spirit_lantern_festival`, `effect-cherry-blossom-gale`, `frame-shuriken-orbit`, `effect-shuriken-storm`, `effect-lantern-spirit-drift`, `effect-blazing-inferno`, `effect-abyssal-ripples`, `effect-celestial-star-drift`, `effect-shadow-haze`, `effect-electric-aura`, `effect-ember-drift`, `effect-cherry-carpet`
  - **UNSURE Primary Matches Confirmed (12 items)**:
    `effect-thunder-kami-storm`, `effect-falling-stars`, `ban_crimson_lotus_lake`, `frame-spirit-flame-wreath`, `effect-divine-radiance`, `effect-thunder-storm`, `effect-neon-rain`, `effect-spirit-wisps`, `effect-cherry-storm`, `effect-faint-sparkles`, `effect-whispering-mist`, `effect-bamboo-screen`
- **Explicitly Kept & Verified Untouched**:
  - `ban_ember_drift` (Ember Drift), `ban_starfall` (Starfall), `plate-ronin-katana-slash` (Ronin Katana Slash), `plate-frozen-sakura-glass` (Frozen Sakura Glass)
  - `ban_koi_pond` (Koi Pond), `ban_neon_rain_city` (Neon Rain City)
  - Protected Flagships: `sovereign-of-the-black-sun`, `obsidian-eclipse`, `eclipse-wyrm`, `black-sun-ember-storm`
  - All **37 `LEGACY_COSMETICS_CATALOG`** items
  - All 17 alternate candidates (`pfp_thunder_kami`, `frame-thunder-mandala`, `frame-thunder-arc`, `plate-thunder-striker`, `ban_thunder_storm_peaks`, `pfp_raijin_thunder_god`, `plate-raijin-storm-plate`, `pfp_shrine_maiden`, `pfp_oni_warlord`, `frame-demon-fire`, `pfp_kitsune_moonlight`, `pfp_sakura_kitsune`, `pfp_torii_mist`, `pfp_bamboo_twilight`, `ban_bamboo_mist`, `frame-bamboo-weave`, `plate-zen-bamboo`)
  - Dragon companion (`public/assets/zenryu/**` and its code)
- **Static Asset Directories & Files Removed**:
  - **13 directories / 37 files** removed from `/public/assets/store/`, freeing **5,176,697 bytes (~4.94 MB)**:
    `ban_crimson_lotus_lake`, `ban_spirit_lantern_festival`, `frame-phoenix-feather-halo`, `frame-frost-crystal-ring`, `frame-cyber-circuit-ring`, `frame-spirit-flame-wreath`, `frame-shuriken-orbit`, `plate-phoenix-crest`, `effect-phoenix-rebirth-flames`, `effect-frost-spirit-blizzard`, `effect-cyber-glitch-matrix`, `effect-lantern-spirit-drift`, `effect-shuriken-storm`
- **Code & Catalog Updates**:
  - `src/data/cosmeticsCatalog.ts`: Active `COSMETICS_CATALOG` reduced by 33 items from `154` to **`121` active items** (`30` Banners, `31` Avatars, `25` Avatar Frames, `29` Nameplates, `6` Profile Effects). `LEGACY_COSMETICS_CATALOG` remains at **`37` items**.
  - `src/pages/store/StorePage.tsx`: Updated `CATEGORY_META` `effect` `sampleId` from `'effect-dragon-fire-aura'` to `'black-sun-ember-storm'`.
  - `src/pages/KobansPage.tsx`: Updated `sampleEffect` from `'effect-cherry-storm'` to `'black-sun-ember-storm'`.
  - Cleaned renderer & registry entries in `src/components/koban/artwork/bannerArtwork/premiumBanners.tsx`, `src/components/koban/artwork/bannerArtwork/index.tsx`, `src/components/koban/artwork/frameArtwork.tsx`, `src/components/koban/artwork/plateArtwork.tsx`, `src/components/koban/artwork/effectArtwork.tsx`, `src/components/koban/effects/EffectRegistry.ts`, `batch1.tsx`, `batch3.tsx`, `batch4.tsx`, `batch5.tsx`, deleted `batch6.tsx` / `batch7.tsx` / `batch8.tsx`, and updated `src/pages/store/StoreItemsDevPreviewPage.tsx`, `public/assets/store/manifest-25-new.json`, `public/assets/store/README.md`, `tools/render-store-items/render.mjs`, and `scripts/generate-store-25-assets.mjs`.
- **Verification**:
  - `npm run build` (`compile_applet`): **PASS** (0 TypeScript or Vite build errors).
  - Headless runtime check (`/store`, `/dashboard/profile`, `/commons` + flagship/kept/zenryu assets): **PASS** (`0` page errors, `0` HTTP 404 responses).
  - Tracked file count (`git ls-files | wc -l`): **`718` files** (down from `758`).
  - Local commit created: `"Remove unused Store items"` (not pushed).
