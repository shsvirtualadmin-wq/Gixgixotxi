# Boardly Full Health Check & Safe Cleanup Progress

**Timestamp**: 2026-11-01
**Backup Branch / Tag**: `backup-before-health-check` (Created prior to audit)
**Current Phase**: Phase 1 Completed (Read-Only Audit — Waiting for User Approval before Phase 2)

---

## Phase 1 Summary
- **A. Repo Size Audit**:
  - Original GitHub repository had ~1,139 files; Google AI Studio capped import at 1,000 files (`git ls-files | wc -l` = 1,002 with `vite.config.ts` and `tsconfig.json`).
  - Identified **402 regenerable/duplicate bloat files** that pushed the repo over the 1,000-file limit and caused ~139 files at the bottom of the tree (including `public/assets/store/eclipse-wyrm/*`, `tools/blender/*.py`, `vite.config.ts`, `tsconfig.json`) to be skipped during GitHub import:
    1. `.aistudio/artifacts/brain/**` (156 files — old temporary session screenshots)
    2. `assets/store/**` & `assets/zenryu/**` (89 files — 100% byte-for-byte duplicate of `public/assets/store/**` and `public/assets/zenryu/**`; Vite serves from `public/assets/...`)
    3. `data/r2-bucket/commons/pdfs/**` (42 files — 100% duplicate of `public/api/r2/commons/pdfs/**`)
    4. `tools/blender/.frames_cache_black_sun_ember_storm/frame_*.png` (34 files — intermediate Blender frame sequence cache)
    5. `generated-materials/**` (25 files — intermediate generated PDFs/JSON already seeded into `public/api/r2` and `data/`)
    6. `data/commons-uploads/**` (17 files — local test upload scratch files)
    7. `public/backups/**` & `data/backups/**` (4 files — legacy CSV/JSON bank backups)
    8. `app/applet/scripts/inspect-wallets.mjs` (1 file — duplicate of `scripts/inspect-wallets.mjs`)
    9. Root scratch/report logs: `duplicates-report.md`, `math-review.md`, `log.json`, `public/screenshots/phase_a_390px.png` (4 files)
  - Removing these 372–402 files brings the tracked file count down to **~600–630 files** (well below the 800-file target).

- **B. Store & Assets Audit**:
  - Total active catalog items: **154** (32 Banners, 31 Profile Pictures, 30 Avatar Frames, 30 Nameplates, 31 Profile Effects) + 37 legacy items.
  - 125 of 128 static asset files in `public/assets/store/**` exist, are non-empty, and return `HTTP 200` with exact `image/webp`, `image/png`, `video/webm`, or `video/mp4` MIME types.
  - **CRITICAL MISSING ASSET**: `eclipse-wyrm` (`public/assets/store/eclipse-wyrm/poster.webp`, `avatar.webm`, `avatar.mp4`) was skipped by the 1,000-file import limit! Requesting `/assets/store/eclipse-wyrm/*` falls back to `index.html` (`text/html`). Note: `src/components/koban/artwork/eclipseWyrmPosterFallback.ts` has the embedded 512×512 Blender render data URI, so we can restore `poster.webp` and generate `avatar.webm` + `avatar.mp4` in Phase 2.
  - `sovereign-of-the-black-sun`, `obsidian-eclipse`, and `black-sun-ember-storm` are 100% complete and verified (`HTTP 200` with proper video/image MIME types). `obsidian-halo` and `crown-of-cinders` do not exist in the catalog.
  - Duplicate check: Zero duplicate IDs. One cross-category duplicate name (`Imperial Jade` used on both `frame-jade-border` and `plate-imperial-jade`).

- **C. Known Bugs Status**:
  1. **Followers & Likes Counts**: `getFollowCounts()` in `src/services/followService.ts` is shared across `ProfileView.tsx` and `PublicUserProfilePage.tsx`, and `subscribeAnyPostLike` syncs post likes. However, `PublicUserProfilePage.tsx` does not display a total likes received counter, and `src/services/commonsService.ts` line 830 (`fetchCommonsUserPreview`) reads raw `data.followersCount` directly instead of calling `getFollowCounts()`.
  2. **Dashboard Profile Banner Framing vs Store Header**: `StorePage.tsx` uses `h-28 sm:h-36` (`112px`/`144px`) with `showReadabilityOverlay={true}`, whereas `ProfileView.tsx` uses `h-[160px] sm:h-[200px]` without `showReadabilityOverlay={true}`, and `PublicUserProfilePage.tsx` uses `h-32 sm:h-40` (`128px`/`160px`), causing inconsistent vertical crop/framing.
  3. **Animated Avatar Playing on Profile Header**: In `ProfileView.tsx` (line 781) and `PublicUserProfilePage.tsx` (line 324), `<BoardlyAvatar>` wraps `<AvatarPicture>` inside `rounded-full`. While `AvatarPicture` sets `canAnimate={true}` when `size >= 56`, `AvatarPictureInner` uses `rounded-xl` and `PfpEclipseWyrm` registers with `storeVideoGovernor` which requires `videoRef.current` to be mounted before `storeVideoGovernor.register()` runs (in `PfpEclipseWyrm`, `videoRef` is only rendered when `shouldMountVideo = effectiveAnimate && isVisible && isGovernorActive`, which creates a chicken-and-egg bug where `storeVideoGovernor.register` receives `videoEl: null` on first render because `isGovernorActive` starts `false`!).
  4. **Non-Admin Store Purchases**: Tested live against Firestore using a freshly created non-admin student account (`bses_buyer_...@boardly.test`). Balance dropped by exact item price (`6000 -> 3600` for 2400-Koban item), `users/{uid}/unlocked/{itemId}` was created, and `wallets/{uid}/ledger/purchase_...` was written.

- **D. Build & Code Health**:
  - `npm run build` (Vite) and `npm run lint` (ESLint) pass with 0 errors.
  - `npm run typecheck` (`tsc --noEmit`) reports **48 TypeScript errors** across 6 files (`src/server/cloudflarePostsAndAuthRouter.ts`, `src/server/crewApiHandler.ts`, `src/services/adminService.ts`, `src/services/commonsService.ts`, `src/services/multiSourceQuestionBank.ts`, `src/services/notificationService.ts`, `src/services/userPostService.ts`).
  - Unused dependencies in `package.json`: `html2canvas`, `jspdf`, `pdf-lib`, `pdfkit`, `unpdf` are only used in standalone CLI scripts or unused in `src/`.

- **E. Security & Secrets**:
  - No private keys, service account JSONs, or `.env` files are committed.
  - `PROJECT_RULES.md` violation in `src/config/questionBankSources.ts`: still contains hardcoded Firebase web config for deprecated project `boardly-8c0cd` (`bank1Config`).
  - Firestore Rules (`firestore.rules`):
    - **Security Hole 1**: `match /users/{userId}/unlocked/{itemId}` (line 395) allows `allow create, update: if isOwner(userId) || isAdmin();` without verifying that the user's wallet balance decreased or that a purchase occurred — a client could write directly to `/users/{uid}/unlocked/{itemId}` and `/wallets/{uid}` (`owned` array) for free!
    - **Security Hole 2**: `match /users/{userId}` (line 384) and `match /publicProfiles/{userId}` (line 467) allow any signed-in user to overwrite `followersCount` and `followingCount` to arbitrary numbers (no `+/- 1` delta check like `commonsPosts`).
    - **Security Hole 3**: `match /posts/{postId}` (line 1034) allows any signed-in user to set `likesCount` and `commentsCount` to any arbitrary value without a `+/- 1` range check.

- **F. Deployment**:
  - Largest file in repo is ~2.98 MB (well under the 20 MB limit).
  - Build bundle `dist/assets/index-*.js` is 2.53 MB unminified / ~750 KB minified.
