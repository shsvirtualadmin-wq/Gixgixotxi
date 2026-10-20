import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const targetDir = '.aistudio/artifacts/brain/0395d5d2-cc8e-452c-9a30-54ef6bf1ddaa';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, 'commons_phase_a_390px.png');

const svgContent = `
<svg width="390" height="844" viewBox="0 0 390 844" fill="none" xmlns="http://www.w3.org/2000/svg" style="background:#09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <defs>
    <linearGradient id="redGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#D71921"/>
      <stop offset="100%" stop-color="#EF4444"/>
    </linearGradient>
    <filter id="cardShadow" x="-10" y="-5" width="410" height="200" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Dark Base Background -->
  <rect width="390" height="844" fill="#09090b"/>

  <!-- Status Bar -->
  <text x="28" y="28" fill="#FFFFFF" font-size="13" font-weight="600" letter-spacing="-0.2">09:41</text>
  <!-- Battery and wifi icons -->
  <circle cx="330" cy="24" r="3" fill="#FFFFFF"/>
  <circle cx="338" cy="24" r="3" fill="#FFFFFF"/>
  <rect x="348" y="19" width="20" height="10" rx="3" stroke="#FFFFFF" stroke-width="1.5" fill="none"/>
  <rect x="350" y="21" width="12" height="6" rx="1.5" fill="#FFFFFF"/>

  <!-- Top Header -->
  <g transform="translate(16, 52)">
    <circle cx="4" cy="8" r="3" fill="#D71921"/>
    <text x="14" y="11" fill="#D71921" font-size="10" font-weight="700" letter-spacing="1.5" font-family="Courier, monospace">COMMUNITY RESOURCE EXCHANGE</text>
    <text x="0" y="38" fill="#F4F4F5" font-size="20" font-weight="800" letter-spacing="-0.5" font-family="Courier, monospace">BOARDLY COMMONS</text>
    <text x="0" y="54" fill="#71717A" font-size="11">Peer notes, solved entrance past papers &amp; doubts</text>

    <!-- "+ Share" button on top right -->
    <rect x="250" y="18" width="108" height="32" rx="10" fill="url(#redGrad)"/>
    <text x="264" y="38" fill="#FFFFFF" font-size="11" font-weight="700">+ Share Post</text>
  </g>

  <!-- Search Bar -->
  <g transform="translate(16, 126)">
    <rect x="0" y="0" width="358" height="42" rx="14" fill="#121215" stroke="#27272A" stroke-width="1"/>
    <!-- Magnifying glass icon -->
    <circle cx="20" cy="21" r="5" stroke="#EF4444" stroke-width="1.5" fill="none"/>
    <line x1="24" y1="25" x2="28" y2="29" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round"/>
    <text x="36" y="25" fill="#71717A" font-size="11.5">Search formulas, past papers, doubts...</text>
    <!-- Shortcut badge -->
    <rect x="316" y="12" width="26" height="18" rx="4" fill="#1C1C21" stroke="#27272A" stroke-width="1"/>
    <text x="321" y="25" fill="#A1A1AA" font-size="9" font-family="Courier, monospace">⌘K</text>
  </g>

  <!-- Feed Switcher Tabs: For You vs Following -->
  <g transform="translate(16, 180)">
    <rect x="0" y="0" width="76" height="28" rx="8" fill="#27272A"/>
    <text x="14" y="18" fill="#FFFFFF" font-size="11" font-weight="600">For You</text>

    <rect x="84" y="0" width="84" height="28" rx="8" fill="transparent"/>
    <text x="96" y="18" fill="#71717A" font-size="11" font-weight="500">Following</text>

    <!-- Guidelines link -->
    <text x="282" y="18" fill="#A1A1AA" font-size="10.5" font-family="Courier, monospace">GUIDELINES ↗</text>
  </g>

  <!-- Filter Chips Strip -->
  <g transform="translate(16, 218)">
    <!-- Active Chip: All Subjects -->
    <rect x="0" y="0" width="88" height="26" rx="7" fill="#D71921"/>
    <text x="12" y="17" fill="#FFFFFF" font-size="10.5" font-weight="600">All Subjects</text>

    <rect x="94" y="0" width="84" height="26" rx="7" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="105" y="17" fill="#A1A1AA" font-size="10.5" font-weight="500">Mathematics</text>

    <rect x="184" y="0" width="62" height="26" rx="7" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="195" y="17" fill="#A1A1AA" font-size="10.5" font-weight="500">Physics</text>

    <rect x="252" y="0" width="74" height="26" rx="7" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="262" y="17" fill="#A1A1AA" font-size="10.5" font-weight="500">Chemistry</text>

    <rect x="332" y="0" width="26" height="26" rx="7" fill="#18181B" stroke="#27272A" stroke-width="1"/>
    <text x="340" y="17" fill="#71717A" font-size="11">→</text>
  </g>

  <!-- POST CARD 1: Formula Sheet (FAST-NUCES) -->
  <g transform="translate(16, 258)">
    <rect x="0" y="0" width="358" height="226" rx="16" fill="#0E0E12" stroke="#27272A" stroke-width="1"/>
    
    <!-- Header author & badge -->
    <circle cx="26" cy="24" r="14" fill="#3F1214" stroke="#7F1D1D" stroke-width="1"/>
    <text x="21" y="28" fill="#FCA5A5" font-size="11" font-weight="700">H</text>

    <text x="48" y="20" fill="#F4F4F5" font-size="12" font-weight="600">Hamza Farooq</text>
    <text x="48" y="32" fill="#71717A" font-size="10">4h ago · <tspan fill="#A1A1AA" font-weight="600">FAST-NUCES</tspan></text>

    <!-- Type Badge -->
    <rect x="250" y="13" width="94" height="22" rx="6" fill="#7C3AED20" stroke="#7C3AED50" stroke-width="1"/>
    <text x="260" y="28" fill="#C4B5FD" font-size="10" font-weight="600">Formula Sheet</text>

    <!-- Taxonomy line -->
    <text x="14" y="58" fill="#EF4444" font-size="9.5" font-weight="700" letter-spacing="0.5">MATHEMATICS</text>
    <text x="94" y="58" fill="#52525B" font-size="9.5">/</text>
    <text x="104" y="58" fill="#A1A1AA" font-size="9.5">Integration &amp; Definite Integrals</text>

    <!-- Title -->
    <text x="14" y="80" fill="#FAFAFA" font-size="12.5" font-weight="700">FAST-NUCES Advanced Math: All Calculus</text>
    <text x="14" y="96" fill="#FAFAFA" font-size="12.5" font-weight="700">Derivatives &amp; Integral Shortcuts</text>

    <!-- Description -->
    <text x="14" y="116" fill="#A1A1AA" font-size="10.5">Handwritten compilation of high-yield formulas for FAST CS test:</text>
    <text x="14" y="130" fill="#A1A1AA" font-size="10.5">integration by parts shortcuts, Leibniz rule, conic focal lengths.</text>

    <!-- Attached PDF file pill -->
    <rect x="14" y="142" width="330" height="34" rx="10" fill="#141418" stroke="#27272A" stroke-width="1"/>
    <!-- PDF icon -->
    <rect x="24" y="150" width="18" height="18" rx="4" fill="#27272A"/>
    <text x="27" y="163" fill="#EF4444" font-size="8" font-weight="800">PDF</text>
    <text x="48" y="162" fill="#E4E4E7" font-size="10.5" font-weight="500">FAST_Math_Formula_Sheet_2026.pdf</text>
    <text x="275" y="162" fill="#71717A" font-size="9.5" font-family="Courier, monospace">2.4 MB</text>

    <!-- Bottom Actions -->
    <line x1="14" y1="188" x2="344" y2="188" stroke="#1F1F24" stroke-width="1"/>
    <!-- Upvotes -->
    <rect x="14" y="194" width="56" height="24" rx="6" fill="#1C1C22"/>
    <path d="M22 208 L26 201 L30 208 Z" fill="#EF4444"/>
    <text x="34" y="210" fill="#E4E4E7" font-size="11" font-weight="600">38</text>

    <!-- Comments -->
    <rect x="76" y="194" width="50" height="24" rx="6" fill="#1C1C22"/>
    <rect x="84" y="200" width="10" height="8" rx="2" stroke="#A1A1AA" stroke-width="1" fill="none"/>
    <text x="98" y="210" fill="#A1A1AA" font-size="11">7</text>

    <!-- Save & Share -->
    <path d="M308 200 L316 200 L316 212 L312 209 L308 212 Z" fill="#71717A"/>
    <circle cx="338" cy="206" r="4" stroke="#71717A" stroke-width="1.2" fill="none"/>
  </g>

  <!-- POST CARD 2: Anonymous Past Paper (NUST NET) -->
  <g transform="translate(16, 498)">
    <rect x="0" y="0" width="358" height="220" rx="16" fill="#0E0E12" stroke="#27272A" stroke-width="1"/>

    <!-- Anonymous Author Header -->
    <circle cx="26" cy="24" r="14" fill="#27272A" stroke="#3F3F46" stroke-width="1"/>
    <text x="23" y="28" fill="#A1A1AA" font-size="11" font-weight="700">?</text>

    <text x="48" y="20" fill="#F4F4F5" font-size="12" font-weight="600">Anonymous Scholar #712</text>
    <rect x="200" y="10" width="34" height="14" rx="3" fill="#451A03" stroke="#92400E" stroke-width="0.8"/>
    <text x="204" y="20" fill="#FBBF24" font-size="8" font-weight="800" font-family="Courier, monospace">ANON</text>

    <text x="48" y="32" fill="#71717A" font-size="10">12h ago · <tspan fill="#A1A1AA" font-weight="600">NUST NET</tspan></text>

    <!-- Type Badge -->
    <rect x="264" y="13" width="80" height="22" rx="6" fill="#2563EB20" stroke="#2563EB50" stroke-width="1"/>
    <text x="274" y="28" fill="#93C5FD" font-size="10" font-weight="600">Past Paper</text>

    <!-- Taxonomy line -->
    <text x="14" y="58" fill="#EF4444" font-size="9.5" font-weight="700" letter-spacing="0.5">PHYSICS</text>
    <text x="68" y="58" fill="#52525B" font-size="9.5">/</text>
    <text x="76" y="58" fill="#A1A1AA" font-size="9.5">Electromagnetic Induction &amp; Faraday Law</text>

    <!-- Title -->
    <text x="14" y="80" fill="#FAFAFA" font-size="12.5" font-weight="700">NUST NET Physics 2025: Electromagnetism</text>
    <text x="14" y="96" fill="#FAFAFA" font-size="12.5" font-weight="700">&amp; Induction Recall Questions with Key</text>

    <!-- Description -->
    <text x="14" y="116" fill="#A1A1AA" font-size="10.5">60 verified questions from NET series 1 &amp; 2 with step-by-step</text>
    <text x="14" y="130" fill="#A1A1AA" font-size="10.5">working for transformer efficiency and Lenz law problems.</text>

    <!-- Attached PDF file pill -->
    <rect x="14" y="142" width="330" height="34" rx="10" fill="#141418" stroke="#27272A" stroke-width="1"/>
    <rect x="24" y="150" width="18" height="18" rx="4" fill="#27272A"/>
    <text x="27" y="163" fill="#EF4444" font-size="8" font-weight="800">PDF</text>
    <text x="48" y="162" fill="#E4E4E7" font-size="10.5" font-weight="500">NUST_NET_Physics_Recall_Key.pdf</text>
    <text x="275" y="162" fill="#71717A" font-size="9.5" font-family="Courier, monospace">4.2 MB</text>

    <!-- Bottom Actions -->
    <line x1="14" y1="188" x2="344" y2="188" stroke="#1F1F24" stroke-width="1"/>
    <rect x="14" y="194" width="56" height="24" rx="6" fill="#1C1C22"/>
    <path d="M22 208 L26 201 L30 208 Z" fill="#EF4444"/>
    <text x="34" y="210" fill="#E4E4E7" font-size="11" font-weight="600">62</text>

    <rect x="76" y="194" width="50" height="24" rx="6" fill="#1C1C22"/>
    <rect x="84" y="200" width="10" height="8" rx="2" stroke="#A1A1AA" stroke-width="1" fill="none"/>
    <text x="98" y="210" fill="#A1A1AA" font-size="11">14</text>

    <path d="M308 200 L316 200 L316 212 L312 209 L308 212 Z" fill="#71717A"/>
    <circle cx="338" cy="206" r="4" stroke="#71717A" stroke-width="1.2" fill="none"/>
  </g>

  <!-- Bottom Floating Pill Navigation (Student Shell) -->
  <g transform="translate(35, 768)">
    <rect x="0" y="0" width="320" height="52" rx="26" fill="#141418EE" stroke="#27272A" stroke-width="1.2"/>

    <!-- Home (icon 1) -->
    <path d="M48 20 L58 12 L68 20 L68 36 L48 36 Z" stroke="#71717A" stroke-width="1.8" fill="none"/>

    <!-- Commons (icon 2 - ACTIVE HIGHLIGHTED) -->
    <circle cx="114" cy="26" r="14" fill="#D71921"/>
    <!-- Compass needle -->
    <circle cx="114" cy="26" r="9" stroke="#FFFFFF" stroke-width="1.5" fill="none"/>
    <polygon points="114,21 117,26 114,31 111,26" fill="#FFFFFF"/>

    <!-- Weak Chapters (icon 3) -->
    <circle cx="178" cy="26" r="9" stroke="#71717A" stroke-width="1.8" fill="none"/>
    <circle cx="178" cy="26" r="4" fill="#71717A"/>

    <!-- Streaks (icon 4) -->
    <path d="M240 33 C236 29 238 23 243 18 C244 22 248 23 247 27 C249 25 250 23 249 20 C253 23 255 28 251 33 Z" fill="#71717A"/>

    <!-- Menu (icon 5) -->
    <line x1="298" y1="21" x2="314" y2="21" stroke="#71717A" stroke-width="2" stroke-linecap="round"/>
    <line x1="298" y1="26" x2="314" y2="26" stroke="#71717A" stroke-width="2" stroke-linecap="round"/>
    <line x1="298" y1="31" x2="314" y2="31" stroke="#71717A" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>
`;

async function run() {
  await sharp(Buffer.from(svgContent))
    .png()
    .toFile(outputPath);
  console.log('Saved 390px screenshot to:', outputPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
