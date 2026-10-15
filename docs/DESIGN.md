# Boardly Design System & Visual Specification

**Design Identity:** "Dark Glass Study Cockpit"  
**Aesthetic Pillars:** Calm, focused, editorial, original. High-contrast glassmorphism, fluid micro-interactions, responsive ergonomics. Never generic, never template-like.

---

## 1. Design Token System

### 1.1 Color Palette & CSS Variables

```css
:root {
  /* Core Canvas */
  --bg: #070B14;
  --bg-2: #0E1626;
  
  /* Glass Surfaces & Elevation */
  --surface: rgba(255, 255, 255, 0.06);
  --surface-hover: rgba(255, 255, 255, 0.10);
  --surface-active: rgba(255, 255, 255, 0.14);
  --border: rgba(255, 255, 255, 0.12);
  --border-focus: rgba(47, 107, 255, 0.6);
  --glass-inner-glow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.6);

  /* Typography & Contrast (Strict WCAG AA) */
  --text: #EAF0FF;
  --text-muted: #A3B0CC;
  --text-faint: #6F7C99;

  /* Brand Palette (Aligned with Boardly Royal Blue Logo) */
  --brand: #2F6BFF;
  --brand-2: #22D3EE;
  --violet: #7C5CFF;
  --brand-gradient: linear-gradient(135deg, #2F6BFF 0%, #22D3EE 100%);
  --brand-glow: 0 0 24px -4px rgba(47, 107, 255, 0.45);

  /* Role-Specific Accent Gradients */
  --accent-student: linear-gradient(135deg, #2F6BFF 0%, #22D3EE 100%);
  --accent-crew: linear-gradient(135deg, #7C5CFF 0%, #E879F9 100%);
  --accent-captain: linear-gradient(135deg, #F59E0B 0%, #FB923C 100%);
  --accent-admin: linear-gradient(135deg, #10B981 0%, #34D399 100%);

  /* Status Colors */
  --status-success: #34D399;
  --status-warning: #FBBF24;
  --status-danger: #F87171;
  --status-info: #38BDF8;

  /* Border Radii */
  --radius-input: 12px;
  --radius-card: 20px;
  --radius-hero: 28px;
  --radius-pill: 9999px;
}
```

### 1.2 Ambient Background Layer

The canvas background consists of:
1. Base vertical gradient from `var(--bg)` (`#070B14`) to `var(--bg-2)` (`#0E1626`).
2. Two large, slowly drifting blurred radial glow orbs:
   - Top-left: Brand Blue (`#2F6BFF`) at 25% opacity, blur 140px, width 650px.
   - Bottom-right: Violet (`#7C5CFF`) at 18% opacity, blur 160px, width 600px.
3. Faint 48px grid overlay at 4% white opacity.
4. Optional tinted light theme: `bg: #EEF2FB`, glass surfaces `rgba(255,255,255,0.75)`, text `#0B1220`. Never pure `#FFFFFF` white pages.

---

## 2. Typography & Hierarchy

Utilizes strictly the local display font `Oblata Display` (`/public/fonts/Oblata-Display-Regular.otf`) and clean system sans-serif fallback stacks (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`). Zero external Google Fonts or CDN dependencies.

| Element | Size (Desktop / Mobile) | Weight | Tracking | Line-Height | Description / Role |
|---|---|---|---|---|---|
| **Hero Title** | 56px / 38px | 800 | -0.03em | 1.05 | Oblata Display, 1-2 words in brand-cyan gradient |
| **Section Title (h2)** | 36px / 28px | 700 | -0.025em | 1.15 | Oblata Display, high contrast `--text` |
| **Card Header (h3)** | 22px / 20px | 600 | -0.015em | 1.25 | Clean sans-serif |
| **Body Primary** | 16px / 16px | 400 | 0 | 1.6 | High legibility, `--text` |
| **Body Secondary** | 14px / 14px | 400 | 0 | 1.5 | `--text-muted` |
| **Captions & Tags** | 13px / 12px | 500 | +0.01em | 1.4 | `--text-faint`, tabular numbers for data |
| **Large Numbers** | 48px / 36px | 700 | -0.03em | 1.0 | Monospace / Tabular numbers, animated ticker |

---

## 3. Core Component Library

### 3.1 Button
- **Height:** 48px (minimum 44px touch target on mobile).
- **Primary:** Gradient `var(--brand-gradient)` with soft glow `0 0 20px -4px rgba(47,107,255,0.4)`. Hover brightness 1.08, active press scale `0.98`.
- **Secondary (Glass):** `var(--surface)`, border `var(--border)`, hover `var(--surface-hover)`.
- **Ghost:** Transparent, hover `var(--surface)`.

### 3.2 Glass Card
- **Styling:** `background: var(--surface); backdrop-filter: blur(20px) saturate(140%); border: 1px solid var(--border); box-shadow: var(--glass-shadow); box-shadow-inner: var(--glass-inner-glow); border-radius: var(--radius-card);`.
- **Featured Card (Active):** Animated 1px gradient border running on an 8-second smooth rotation loop.
- **Graceful Fallback:** Solid opaque background (`#0E1626` with border) if `backdrop-filter` is unsupported.

### 3.3 Inputs & Selects
- **Height:** 48px, radius 12px.
- **Surface:** Glass `rgba(255,255,255,0.04)`, 1px border `var(--border)`.
- **Focus:** 2px ring in `var(--brand)` with glowing shadow. Clear error border in `var(--status-danger)`.

### 3.4 Skeletons & Loaders
- **Single Logo Preloader:** Central Boardly logo badge (60x60, rounded 18px) with smooth 1.8s pulse, shown during app bootstrap until onAuthStateChanged resolves.
- **Data Skeletons:** 1.4s smooth shimmer gradient across cards and tables.

### 3.5 MathText with KaTeX
- Inline `$...$` and display block `$$...$$` with `throwOnError: false`.
- Math typography dynamically sized to match surrounding body text.
- Full support for fraction bars, square roots, vector arrows, matrices, and chemical formulas.

---

## 4. The Interactive PhoneMockup Component

The **PhoneMockup** is a custom, neutral Boardly study hardware device:
- **Frame:** Metallic dark titanium gradient border with 36px rounded corners.
- **Camera Notch:** Minimal subtle camera pill (28x6px), NOT an iPhone island replica.
- **Screen:** Dynamic 19.5:9 viewport with glass reflection streak across the diagonal.
- **Physics:** Floating animation ($\pm 8\text{px}$, 6s sine wave), responsive 3D tilt tracking cursor position.
- **Typography:** Strictly $\ge 13\text{px}$ for all inner screen labels.

### 4.1 Four PhoneMockup Screen Modes

1. **Student Mode (Default):**
   - Live Countdown Pill: "FAST-NU Test: 24 Days Left".
   - Daily Drill Card: "Physics: Vectors & Mechanics (15/20 Completed)".
   - Strengths Radar / Progress Bars: Math (92%), Physics (84%), English (88%).
   - Active Streak Counter: "🔥 7-Day Study Streak".

2. **Crew Ambassador Mode:**
   - Referral Code Card: "FAST-BILAL26" with one-tap copy pill.
   - Live Metrics: 42 Registered Students, 28 Activated.
   - Milestone Bar: "18 more activations to Paid Internship eligibility".
   - 30-Day Pro Pass Unlocked badge.

3. **Campus Captain Mode:**
   - Campus Tag: "FAST-NUCES Islamabad — Campus Captain".
   - Leaderboard Position: "Rank #3 Nationwide — 1,400 Pts".
   - Active Mission Card: "Host Weekend Blitz Mock (+500 Pts)".
   - Recent Student Activations feed with animated live checkmarks.

4. **Arena Live Mode:**
   - Glowing Red "● LIVE ARENA" Badge with pulsing ping animation.
   - Active Participants Counter: "348 Students Competing".
   - Real-Time Mini Leaderboard with animated shifting rows.
   - Exam Meta Chips: "Mathematics & Physics · 60 Questions · 90 Minutes".

---

## 5. Animation & Motion Design Tokens

```css
/* Motion Curves & Durations */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-study-fluid: cubic-bezier(0.22, 1, 0.36, 1);

--motion-hover: 160ms;
--motion-card: 300ms;
--motion-page: 400ms;
--motion-counter: 800ms;
--motion-progress: 900ms;
```

- **Page Transitions:** Fade in + rise 12px over 400ms.
- **Lists & Grids:** Staggered item entrance by 60ms.
- **Number Tickers:** Smooth count-up easing over 800ms.
- **Accessibility:** Strictly honors `@media (prefers-reduced-motion: reduce)` by disabling translation and floating loops.

---

## 6. Layout Systems

### 6.1 Desktop Study Cockpit
- **Sidebar:** Glass floating panel (240px width, collapsible to 64px icon bar).
- **Header:** Sticky glass bar (64px height) with search, notifications bell, and user avatar menu.
- **Main Container:** Max-width 1280px, 12-column responsive grid with 20px-24px gaps.

### 6.2 Mobile Cockpit & Bottom Navigation
- **Top Bar:** 56px sticky glass bar with Boardly brand badge and quick profile trigger.
- **Bottom Navigation Bar:** Floating glass dock with 5 core actions (Dashboard, Practice, Tests, Arena, More).
- **"More" Sheet:** Smooth slide-up full glass modal housing: Chapter Map, Formula Vault, Paper Vault, Growth Analytics, Daily Limits, Smart Planner, University Explorer, Join Boardly Crew, Community WhatsApp link.
- **Touch Ergonomics:** All buttons $\ge 44\text{px}$, bottom spacing accounts for iOS `env(safe-area-inset-bottom)`.
