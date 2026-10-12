import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function generateCrewOg() {
  const width = 1200;
  const height = 630;

  // Read logo if available as base64
  let logoBase64 = '';
  const logoPath = path.resolve(process.cwd(), 'public/assets/boardly-logo-transparent.png');
  if (fs.existsSync(logoPath)) {
    logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
  }

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#06061a"/>
        <stop offset="50%" stop-color="#0a0a24"/>
        <stop offset="100%" stop-color="#0e0a35"/>
      </linearGradient>

      <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#a78bfa"/>
        <stop offset="50%" stop-color="#6d4aff"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>

      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(109, 74, 255, 0.15)"/>
        <stop offset="100%" stop-color="rgba(79, 53, 245, 0.05)"/>
      </linearGradient>

      <radialGradient id="glowViolet" cx="30%" cy="40%" r="50%">
        <stop offset="0%" stop-color="rgba(109, 74, 255, 0.35)"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>

      <radialGradient id="glowBlue" cx="80%" cy="60%" r="50%">
        <stop offset="0%" stop-color="rgba(59, 130, 246, 0.25)"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>

      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
    
    <!-- Ambient Glows -->
    <rect width="${width}" height="${height}" fill="url(#glowViolet)"/>
    <rect width="${width}" height="${height}" fill="url(#glowBlue)"/>

    <!-- Subtle Grid Overlay -->
    <rect width="${width}" height="${height}" fill="url(#grid)"/>

    <!-- Outer Tech Border -->
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="28" fill="none" stroke="rgba(109, 74, 255, 0.25)" stroke-width="1.5"/>

    <!-- Top Badge -->
    <g transform="translate(80, 80)">
      <rect x="0" y="0" width="370" height="40" rx="20" fill="rgba(109, 74, 255, 0.2)" stroke="rgba(167, 139, 250, 0.4)" stroke-width="1"/>
      <circle cx="20" cy="20" r="5" fill="#38bdf8"/>
      <text x="36" y="25" fill="#c4b5fd" font-family="'Manrope', sans-serif" font-size="13" font-weight="700" letter-spacing="1">STUDENT CAMPUS AMBASSADOR PROGRAM</text>
    </g>

    <!-- Logo / Brand Crest on Top Right -->
    <g transform="translate(${width - 240}, 75)">
      ${logoBase64 ? `<image href="${logoBase64}" x="0" y="0" width="160" height="48" preserveAspectRatio="xMidYMid meet"/>` : `
        <rect x="0" y="0" width="140" height="44" rx="12" fill="rgba(255, 255, 255, 0.08)"/>
        <text x="70" y="28" text-anchor="middle" fill="#ffffff" font-family="'Sora', sans-serif" font-size="20" font-weight="800">BOARDLY</text>
      `}
    </g>

    <!-- Main Headline -->
    <g transform="translate(80, 210)">
      <text x="0" y="0" fill="#ffffff" font-family="'Sora', sans-serif" font-size="68" font-weight="800" letter-spacing="-0.5">BOARDLY <tspan fill="url(#brandGrad)">CREW</tspan></text>
      <text x="0" y="65" fill="#e2e8f0" font-family="'Sora', sans-serif" font-size="44" font-weight="700">Lead Your Campus. Empower Your Batch.</text>
      <text x="0" y="115" fill="#94a3b8" font-family="'Manrope', sans-serif" font-size="22" font-weight="400">Represent Pakistan's smartest test prep engine. Build authority, earn rewards &amp; unlock internships.</text>
    </g>

    <!-- 3 Stat / Benefit Pills -->
    <g transform="translate(80, 420)">
      <!-- Pill 1 -->
      <g transform="translate(0, 0)">
        <rect x="0" y="0" width="310" height="70" rx="18" fill="url(#cardGrad)" stroke="rgba(109, 74, 255, 0.3)" stroke-width="1.5"/>
        <text x="24" y="32" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700">30 DAYS FREE</text>
        <text x="24" y="54" fill="#cbd5e1" font-family="'Manrope', sans-serif" font-size="14" font-weight="500">Boardly Pro Access Unlocked</text>
      </g>

      <!-- Pill 2 -->
      <g transform="translate(330, 0)">
        <rect x="0" y="0" width="310" height="70" rx="18" fill="url(#cardGrad)" stroke="rgba(109, 74, 255, 0.3)" stroke-width="1.5"/>
        <text x="24" y="32" fill="#a78bfa" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700">VERIFIABLE CV</text>
        <text x="24" y="54" fill="#cbd5e1" font-family="'Manrope', sans-serif" font-size="14" font-weight="500">Official Leadership Credential</text>
      </g>

      <!-- Pill 3 -->
      <g transform="translate(660, 0)">
        <rect x="0" y="0" width="340" height="70" rx="18" fill="url(#cardGrad)" stroke="rgba(109, 74, 255, 0.3)" stroke-width="1.5"/>
        <text x="24" y="32" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="700">PAID INTERNSHIPS</text>
        <text x="24" y="54" fill="#cbd5e1" font-family="'Manrope', sans-serif" font-size="14" font-weight="500">For Top Performing Ambassadors</text>
      </g>
    </g>

    <!-- Footer URL -->
    <g transform="translate(80, 560)">
      <text x="0" y="0" fill="#64748b" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="600">boardly.cfd/crew</text>
      <text x="${width - 160}" y="0" text-anchor="end" fill="#64748b" font-family="'Manrope', sans-serif" font-size="15">An initiative by SHS Virtual Academy</text>
    </g>
  </svg>
  `;

  const outputPath = path.resolve(process.cwd(), 'public/assets/boardly-crew-og.png');
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`Successfully generated Crew OG image at: ${outputPath}`);
}

generateCrewOg().catch(console.error);
