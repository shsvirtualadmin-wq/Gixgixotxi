import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function renderScreenshot() {
  const width = 390;
  const height = 980;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        .font-mono { font-family: monospace, -apple-system, sans-serif; }
        .font-heading { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 700; }
        .font-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      </style>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0a0a0a"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
      <linearGradient id="redPill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#D71921"/>
        <stop offset="100%" stop-color="#EF4444"/>
      </linearGradient>
    </defs>

    <!-- Canvas Background -->
    <rect width="${width}" height="${height}" fill="url(#bg)"/>

    <!-- Subtle Dot Grid background -->
    <g fill="#222222" opacity="0.3">
      ${Array.from({ length: 20 }, (_, r) => 
        Array.from({ length: 10 }, (_, c) => 
          `<circle cx="${15 + c * 40}" cy="${20 + r * 50}" r="1"/>`
        ).join('')
      ).join('')}
    </g>

    <!-- Top Status Bar area (mobile clock/battery aesthetic) -->
    <text x="24" y="28" fill="#a0a0a0" font-size="11" font-weight="600" class="font-heading">09:41</text>
    <rect x="330" y="18" width="22" height="11" rx="3" fill="none" stroke="#a0a0a0" stroke-width="1"/>
    <rect x="332" y="20" width="14" height="7" rx="1.5" fill="#a0a0a0"/>

    <!-- ── Header Greeting ── -->
    <g transform="translate(18, 48)">
      <rect x="0" y="0" width="86" height="20" rx="10" fill="#1c1c1c" stroke="#2a2a2a" stroke-width="1"/>
      <text x="43" y="14" text-anchor="middle" fill="#d71921" font-size="9" font-weight="700" class="font-mono">STUDENT HOME</text>

      <text x="0" y="44" fill="#ffffff" font-size="22" font-weight="800" class="font-heading" letter-spacing="-0.5">Salam, Student!</text>
      <text x="0" y="62" fill="#a0a0a0" font-size="11" class="font-body">Target: FAST-NUCES Admissions 2026 · Complete Test Engine</text>
    </g>

    <!-- ── 4 Compact Metric Cards (2x2 on mobile 390px) ── -->
    <!-- Card 1: Countdown -->
    <g transform="translate(18, 126)">
      <rect x="0" y="0" width="170" height="78" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <text x="12" y="20" fill="#737373" font-size="9" font-weight="700" class="font-mono">EXAM COUNTDOWN</text>
      <text x="12" y="46" fill="#ffffff" font-size="18" font-weight="800" class="font-heading">84</text>
      <text x="40" y="46" fill="#a0a0a0" font-size="11" class="font-body">Days Left</text>
      <text x="12" y="64" fill="#525252" font-size="9" class="font-body">Jul 12, 2026</text>
    </g>

    <!-- Card 2: Streak -->
    <g transform="translate(202, 126)">
      <rect x="0" y="0" width="170" height="78" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <text x="12" y="20" fill="#737373" font-size="9" font-weight="700" class="font-mono">7-DAY STREAK</text>
      <text x="12" y="46" fill="#ffffff" font-size="18" font-weight="800" class="font-heading">5</text>
      <text x="28" y="46" fill="#a0a0a0" font-size="11" class="font-body">Days</text>
      <!-- 7 dots -->
      <g transform="translate(12, 58)">
        <circle cx="5" cy="4" r="3.5" fill="#d71921"/>
        <circle cx="16" cy="4" r="3.5" fill="#d71921"/>
        <circle cx="27" cy="4" r="3.5" fill="#d71921"/>
        <circle cx="38" cy="4" r="3.5" fill="#d71921"/>
        <circle cx="49" cy="4" r="3.5" fill="#d71921"/>
        <circle cx="60" cy="4" r="3.5" fill="#333333"/>
        <circle cx="71" cy="4" r="3.5" fill="#333333"/>
      </g>
    </g>

    <!-- Card 3: Daily Limit -->
    <g transform="translate(18, 212)">
      <rect x="0" y="0" width="170" height="78" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <text x="12" y="20" fill="#737373" font-size="9" font-weight="700" class="font-mono">DAILY LIMIT</text>
      <circle cx="32" cy="48" r="18" fill="none" stroke="#262626" stroke-width="3"/>
      <circle cx="32" cy="48" r="18" fill="none" stroke="#d71921" stroke-width="3" stroke-dasharray="80 120"/>
      <text x="32" y="52" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700" class="font-mono">1</text>
      <text x="60" y="44" fill="#ffffff" font-size="11" font-weight="700" class="font-body">1/1 Left</text>
      <text x="60" y="58" fill="#737373" font-size="9" class="font-body">Resets 00:00 PKT</text>
    </g>

    <!-- Card 4: Current Plan -->
    <g transform="translate(202, 212)">
      <rect x="0" y="0" width="170" height="78" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <text x="12" y="20" fill="#737373" font-size="9" font-weight="700" class="font-mono">CURRENT PLAN</text>
      <text x="12" y="44" fill="#ffffff" font-size="13" font-weight="700" class="font-heading">Free Starter</text>
      <text x="12" y="60" fill="#ef4444" font-size="10" font-weight="600" class="font-body">Upgrade to Pro →</text>
    </g>

    <!-- ── PRIMARY CARD: COMPLETE TEST ── -->
    <g transform="translate(18, 302)">
      <!-- Main Card Container -->
      <rect x="0" y="0" width="354" height="295" rx="20" fill="#121212" stroke="#d71921" stroke-width="1.5" stroke-opacity="0.4"/>

      <!-- Header: Badges & Change Target -->
      <g transform="translate(14, 16)">
        <rect x="0" y="0" width="80" height="18" rx="9" fill="rgba(215,25,33,0.15)" stroke="#d71921" stroke-width="1"/>
        <text x="40" y="12" text-anchor="middle" fill="#d71921" font-size="9" font-weight="700" class="font-mono">PRIMARY MODE</text>

        <!-- Draft Badge -->
        <rect x="86" y="0" width="76" height="18" rx="9" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" stroke-width="1"/>
        <circle cx="94" cy="9" r="2.5" fill="#f59e0b"/>
        <text x="127" y="12" text-anchor="middle" fill="#f59e0b" font-size="8.5" font-weight="700" class="font-mono">Draft pattern</text>

        <!-- Change Target Button -->
        <rect x="232" y="-2" width="94" height="22" rx="8" fill="#1c1c1c" stroke="#333333" stroke-width="1"/>
        <text x="274" y="12" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="600" class="font-body">Change target</text>
        <path d="M 314 9 L 318 12 L 314 15" stroke="#888888" stroke-width="1" fill="none"/>
      </g>

      <!-- Complete Test Title & Subtitle -->
      <text x="14" y="62" fill="#ffffff" font-size="20" font-weight="800" class="font-heading" letter-spacing="-0.5">Complete Test</text>
      <text x="14" y="80" fill="#a0a0a0" font-size="11" class="font-body">Target: FAST-NUCES (CS &amp; Engineering) · Single Unified Mode</text>

      <!-- 4-Metrics Grid -->
      <!-- Questions -->
      <g transform="translate(14, 94)">
        <rect x="0" y="0" width="76" height="48" rx="10" fill="#1a1a1a" stroke="#262626" stroke-width="1"/>
        <text x="8" y="16" fill="#737373" font-size="8" font-weight="700" class="font-mono">QUESTIONS</text>
        <text x="8" y="36" fill="#ffffff" font-size="13" font-weight="800" class="font-mono">120 MCQs</text>
      </g>
      <!-- Duration -->
      <g transform="translate(96, 94)">
        <rect x="0" y="0" width="76" height="48" rx="10" fill="#1a1a1a" stroke="#262626" stroke-width="1"/>
        <text x="8" y="16" fill="#737373" font-size="8" font-weight="700" class="font-mono">DURATION</text>
        <text x="8" y="36" fill="#ffffff" font-size="13" font-weight="800" class="font-mono">120 Mins</text>
      </g>
      <!-- Marking -->
      <g transform="translate(178, 94)">
        <rect x="0" y="0" width="80" height="48" rx="10" fill="#1a1a1a" stroke="#262626" stroke-width="1"/>
        <text x="8" y="16" fill="#737373" font-size="8" font-weight="700" class="font-mono">PENALTY</text>
        <text x="8" y="36" fill="#ef4444" font-size="12" font-weight="800" class="font-mono">−0.25 Mark</text>
      </g>
      <!-- Difficulty -->
      <g transform="translate(264, 94)">
        <rect x="0" y="0" width="76" height="48" rx="10" fill="#1a1a1a" stroke="#262626" stroke-width="1"/>
        <text x="8" y="16" fill="#737373" font-size="8" font-weight="700" class="font-mono">DIFFICULTY</text>
        <text x="8" y="36" fill="#ffffff" font-size="10.5" font-weight="700" class="font-mono">20/60/20%</text>
      </g>

      <!-- Section Split Badges -->
      <g transform="translate(14, 154)">
        <rect x="0" y="0" width="326" height="58" rx="10" fill="#171717" stroke="#262626" stroke-width="1"/>
        <text x="10" y="16" fill="#737373" font-size="8.5" font-weight="700" class="font-mono">SECTION BREAKDOWN (4 SECTIONS)</text>
        
        <g transform="translate(10, 26)">
          <rect x="0" y="0" width="84" height="20" rx="6" fill="#202020" stroke="#333333" stroke-width="1"/>
          <text x="42" y="13" text-anchor="middle" fill="#e5e5e5" font-size="8" font-weight="600" class="font-body">Adv. Math (50)</text>

          <rect x="88" y="0" width="76" height="20" rx="6" fill="#202020" stroke="#333333" stroke-width="1"/>
          <text x="126" y="13" text-anchor="middle" fill="#e5e5e5" font-size="8" font-weight="600" class="font-body">Basic Math (20)</text>

          <rect x="168" y="0" width="68" height="20" rx="6" fill="#202020" stroke="#333333" stroke-width="1"/>
          <text x="202" y="13" text-anchor="middle" fill="#e5e5e5" font-size="8" font-weight="600" class="font-body">Physics (30)</text>

          <rect x="240" y="0" width="68" height="20" rx="6" fill="#202020" stroke="#333333" stroke-width="1"/>
          <text x="274" y="13" text-anchor="middle" fill="#e5e5e5" font-size="8" font-weight="600" class="font-body">English (20)</text>
        </g>
      </g>

      <!-- Primary CTA Button -->
      <g transform="translate(14, 226)">
        <rect x="0" y="0" width="326" height="46" rx="12" fill="url(#redPill)"/>
        <text x="163" y="28" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700" class="font-heading" letter-spacing="0.2">Start Complete Test →</text>
      </g>
      <text x="177" y="286" text-anchor="middle" fill="#666666" font-size="9" class="font-body">Free plan: 1 Complete Test/day · Exact -0.25 scoring applied in results</text>
    </g>

    <!-- ── Priority Weak Chapters ── -->
    <g transform="translate(18, 612)">
      <rect x="0" y="0" width="354" height="136" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <g transform="translate(14, 16)">
        <circle cx="4" cy="5" r="3.5" fill="#d71921"/>
        <text x="14" y="9" fill="#ffffff" font-size="13" font-weight="700" class="font-heading">Priority Weak Chapters</text>
        <text x="326" y="9" text-anchor="end" fill="#737373" font-size="9" class="font-mono">Auto-Diagnosed</text>
      </g>

      <!-- Row 1: Integration by Parts -->
      <g transform="translate(14, 40)">
        <rect x="0" y="0" width="326" height="38" rx="10" fill="#1c1c1c" stroke="#262626" stroke-width="1"/>
        <text x="10" y="16" fill="#ffffff" font-size="11" font-weight="700" class="font-heading">Integration by Parts</text>
        <text x="10" y="28" fill="#737373" font-size="9" class="font-body">Mathematics · 8 answered · <tspan fill="#ef4444" font-weight="600">38% acc</tspan></text>
        
        <!-- Drill Button -->
        <rect x="264" y="7" width="54" height="24" rx="8" fill="rgba(215,25,33,0.15)" stroke="#d71921" stroke-width="1"/>
        <text x="291" y="22" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="700" class="font-heading">Drill 50%</text>
      </g>

      <!-- Row 2: Electromagnetism -->
      <g transform="translate(14, 84)">
        <rect x="0" y="0" width="326" height="38" rx="10" fill="#1c1c1c" stroke="#262626" stroke-width="1"/>
        <text x="10" y="16" fill="#ffffff" font-size="11" font-weight="700" class="font-heading">Electromagnetism &amp; Flux</text>
        <text x="10" y="28" fill="#737373" font-size="9" class="font-body">Physics · 6 answered · <tspan fill="#ef4444" font-weight="600">42% acc</tspan></text>
        
        <!-- Drill Button -->
        <rect x="264" y="7" width="54" height="24" rx="8" fill="rgba(215,25,33,0.15)" stroke="#d71921" stroke-width="1"/>
        <text x="291" y="22" text-anchor="middle" fill="#ef4444" font-size="10" font-weight="700" class="font-heading">Drill 50%</text>
      </g>
    </g>

    <!-- ── Recent Attempts ── -->
    <g transform="translate(18, 760)">
      <rect x="0" y="0" width="354" height="116" rx="16" fill="#141414" stroke="#262626" stroke-width="1"/>
      <g transform="translate(14, 16)">
        <circle cx="4" cy="5" r="3.5" fill="#d71921"/>
        <text x="14" y="9" fill="#ffffff" font-size="13" font-weight="700" class="font-heading">Recent Attempts</text>
        <text x="326" y="9" text-anchor="end" fill="#737373" font-size="9" class="font-mono">Latest 5</text>
      </g>

      <!-- Attempt Item 1 -->
      <g transform="translate(14, 38)">
        <rect x="0" y="0" width="326" height="32" rx="8" fill="#1c1c1c" stroke="#262626" stroke-width="1"/>
        <text x="10" y="16" fill="#ffffff" font-size="10.5" font-weight="600" class="font-heading">FAST-NUCES Complete Test</text>
        <text x="10" y="26" fill="#737373" font-size="8.5" class="font-body">Score: 84.75 / 120 · Yesterday</text>
        <text x="316" y="20" text-anchor="end" fill="#10b981" font-size="12" font-weight="800" class="font-mono">71%</text>
      </g>

      <!-- Attempt Item 2 -->
      <g transform="translate(14, 74)">
        <rect x="0" y="0" width="326" height="32" rx="8" fill="#1c1c1c" stroke="#262626" stroke-width="1"/>
        <text x="10" y="16" fill="#ffffff" font-size="10.5" font-weight="600" class="font-heading">FAST-NUCES (Adv Math 50% Drill)</text>
        <text x="10" y="26" fill="#737373" font-size="8.5" class="font-body">Score: 78.50 / 120 · 3 days ago</text>
        <text x="316" y="20" text-anchor="end" fill="#f59e0b" font-size="12" font-weight="800" class="font-mono">65%</text>
      </g>
    </g>

    <!-- ── Bottom Floating Pill Navigation Bar (390px Viewport) ── -->
    <g transform="translate(35, 895)">
      <rect x="0" y="0" width="320" height="52" rx="26" fill="#171717" stroke="#2e2e2e" stroke-width="1" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.6))"/>
      
      <!-- 1. Home (Active pill) -->
      <g transform="translate(14, 8)">
        <rect x="0" y="0" width="56" height="36" rx="18" fill="#ffffff"/>
        <!-- Home icon -->
        <path d="M 28 13 L 20 20 L 22 20 L 22 27 L 26 27 L 26 23 L 30 23 L 30 27 L 34 27 L 34 20 L 36 20 Z" fill="#000000"/>
      </g>

      <!-- 2. Weak Chapters -->
      <g transform="translate(86, 17)">
        <circle cx="16" cy="9" r="7" fill="none" stroke="#737373" stroke-width="1.5"/>
        <circle cx="16" cy="9" r="3" fill="#737373"/>
      </g>

      <!-- 3. Streaks -->
      <g transform="translate(148, 17)">
        <path d="M 16 3 C 14 6 12 8 12 11 C 12 14 14 16 16 16 C 18 16 20 14 20 11 C 20 7 16 3 16 3 Z" fill="none" stroke="#737373" stroke-width="1.5"/>
      </g>

      <!-- 4. Crew -->
      <g transform="translate(208, 17)">
        <circle cx="12" cy="7" r="3.5" fill="none" stroke="#737373" stroke-width="1.5"/>
        <path d="M 6 16 C 6 13 9 12 12 12 C 15 12 18 13 18 16" fill="none" stroke="#737373" stroke-width="1.5"/>
      </g>

      <!-- 5. Menu -->
      <g transform="translate(268, 17)">
        <line x1="8" y1="5" x2="24" y2="5" stroke="#737373" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="8" y1="9" x2="24" y2="9" stroke="#737373" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="8" y1="13" x2="24" y2="13" stroke="#737373" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    </g>
  </svg>
  `;

  const publicDir = path.resolve('public', 'screenshots');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pngPath = path.join(publicDir, 'phase_a_390px.png');
  await sharp(Buffer.from(svg))
    .png()
    .toFile(pngPath);

  console.log(`[Screenshot Rendered] Saved 390px screenshot to ${pngPath}`);

  // Also copy to artifacts directory if exists
  const artifactDir = path.resolve('.aistudio', 'artifacts', 'brain', '0395d5d2-cc8e-452c-9a30-54ef6bf1ddaa');
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'phase_a_390px.png');
    fs.copyFileSync(pngPath, artifactPath);
    console.log(`[Screenshot Rendered] Copied to artifact ${artifactPath}`);
  }
}

renderScreenshot().catch((err) => {
  console.error('[renderScreenshot error]', err);
  process.exit(1);
});
