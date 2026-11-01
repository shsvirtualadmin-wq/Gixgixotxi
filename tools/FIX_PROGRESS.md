# Boardly Animated PFP Fix Progress (`/tools/FIX_PROGRESS.md`)

## Step 0: Precheck — `PASS`
- **Tracked file count**: `git ls-files | wc -l` = **718** (< 800).
- **Eclipse Wyrm Asset Verification (`http://localhost:3000`)**:
  - `/assets/store/eclipse-wyrm/poster.webp` -> `HTTP 200 OK`, `Content-Type: image/webp` (`19,640` bytes)
  - `/assets/store/eclipse-wyrm/avatar.webm` -> `HTTP 200 OK`, `Content-Type: video/webm` (`214,336` bytes)
  - `/assets/store/eclipse-wyrm/avatar.mp4` -> `HTTP 200 OK`, `Content-Type: video/mp4` (`320,350` bytes)

---

## Animated Profile Picture (PFP) Fix — `PASS`
- **Root Causes Fixed**:
  1. **Governor registration & late-mounting `<video>` (`src/components/koban/fx/StoreLoopVideo.tsx`, `src/components/koban/artwork/pfpArtwork.tsx`)**:
     - Added `getVideoEl?: () => HTMLVideoElement | null`, `setVideoEl(id, videoEl)`, and a safe `tryPlay` helper on `StoreVideoPlaybackGovernor` that sets `muted = true`, `defaultMuted = true`, and `playsInline = true` before calling `.play()`, ignores transient `AbortError`s during resource selection, and notifies `onPlayError` when autoplay is blocked (`NotAllowedError`).
     - Memoized `handleVideoRef` with `useCallback` in both `PfpEclipseWyrm` and `StoreLoopVideo` (used by the 5 Wave-2 3D loop PFPs: `pfp_phoenix_ascendant`, `pfp_ryujin_sea_dragon`, `pfp_shadow_ninja_mask`, `pfp_raijin_thunder_god`, `pfp_yokai_lantern_ghost`) so the governor receives the live `<video>` element on mount and on retry without detaching/re-attaching the ref on every render.
     - Verified the 5 Wave-1 layered PFPs (`pfp_zenryu_awakened`, `pfp_oni_warlord`, `pfp_kitsune_moonlight`, `pfp_cyber_samurai_visor`, `pfp_tengu_storm_priest`) use `storeFxScheduler` with a mounted `stageRef` / `canvasRef` and do not suffer from the video governor null-ref bug.
  2. **Chromium `opacity-0` / `videoReady` deadlock & autoplay-blocked fallback (`src/components/koban/artwork/pfpArtwork.tsx`)**:
     - Removed the `videoReady` gate that kept `<video>` at `opacity-0` with `preload="metadata"` (which caused Chromium's `VideoVisibilityTracker` to treat the video as occluded and suppress autoplay/frame decoding).
     - Kept `poster={posterUrl}` on `<video>` above `<img src={posterUrl}>` and tracked `autoplayBlocked` so if `play()` rejects due to autoplay restrictions or video load error, `<video>` cleanly falls back to the poster without a flicker.
  3. **Initial animation state & priority cap (`src/components/koban/CosmeticRenderers.tsx`, `src/components/ui/BoardlyAvatar.tsx`, `src/pages/store/StorePage.tsx`, `src/pages/profile/PublicUserProfilePage.tsx`)**:
     - Kept `isVisible` defaulting to `true` in `useCosmeticAnimation` so async profile loads immediately pass `canAnimate={true}` on first render.
     - Assigned `priority: 10` to equipped profile/loadout header avatars (`size >= 56`), `priority: 9` to the Store detail sheet preview, and `priority: 2` to Store Browse grid cards so the equipped header avatar always wins in the 8-video cap.
     - Kept dense lists (`size < 56`: leaderboards, member lists, comments), `prefers-reduced-motion: reduce`, and Smooth Mode (low-end devices) poster-only.
     - Added `profileData.avatar` fallback in `PublicUserProfilePage.tsx` so `/u/:username` Commons profiles always resolve the equipped PFP.

---

## Verification Summary — `PASS`
- **Modified Files**:
  - `src/components/koban/fx/StoreLoopVideo.tsx`
  - `src/components/koban/artwork/pfpArtwork.tsx`
  - `src/components/koban/CosmeticRenderers.tsx`
  - `src/components/ui/BoardlyAvatar.tsx`
  - `src/pages/store/StorePage.tsx`
  - `src/pages/profile/PublicUserProfilePage.tsx`
  - `tools/FIX_PROGRESS.md`
- **Build (`npm run build`)**: `PASS`
- **Lint (`npm run lint`)**: `PASS`
- **Catalog count (`154`) & guardrails**: `PASS`
