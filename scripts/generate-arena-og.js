import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateArenaOg() {
  const width = 1200;
  const height = 630;

  // SVG canvas with Boardly Arena branding
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#060a1a"/>
        <stop offset="50%" stop-color="#0a1538"/>
        <stop offset="100%" stop-color="#050814"/>
      </linearGradient>
      <radialGradient id="blueGlow" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#1a6dff" stop-opacity="0.35"/>
        <stop offset="60%" stop-color="#1a6dff" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#060a1a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1a6dff" stop-opacity="0"/>
        <stop offset="50%" stop-color="#1a6dff" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#1a6dff" stop-opacity="0"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="600" cy="220" r="420" fill="url(#blueGlow)"/>

    <!-- Subtle Grid overlay -->
    <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
      ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="${height}"/>`).join('')}
      ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="${width}" y2="${i * 60}"/>`).join('')}
    </g>

    <!-- Top Badge -->
    <g transform="translate(600, 140)">
      <rect x="-140" y="-22" width="280" height="44" rx="22" fill="rgba(255,255,255,0.06)" stroke="#1a6dff" stroke-width="1.5"/>
      <circle cx="-100" cy="0" r="5" fill="#10b981"/>
      <text x="-85" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#93c5fd" letter-spacing="1">LIVE PRACTICE EVENT</text>
    </g>

    <!-- Main Title: Boardly Arena -->
    <text x="600" y="270" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-1">
      Boardly <tspan fill="#1a6dff">Arena</tspan>
    </text>

    <!-- Subtitle tagline -->
    <text x="600" y="340" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#60a5fa" letter-spacing="0.5">
      Live Timed MCQ Practice
    </text>

    <text x="600" y="400" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#cbd5e1" letter-spacing="0">
      Compete in live timed sessions · Instant scoring · Public rank leaderboard
    </text>

    <text x="600" y="445" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#94a3b8">
      Free for every student in Pakistan
    </text>

    <!-- Bottom separator line -->
    <rect x="250" y="500" width="700" height="2" fill="url(#lineGrad)"/>

    <!-- Footer metadata -->
    <text x="600" y="555" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748b" letter-spacing="0.5">
      boardly.cfd/arena · An independent practice event run by Boardly
    </text>
  </svg>
  `;

  const svgBuffer = Buffer.from(svg);
  const outPath1 = path.join(process.cwd(), 'public', 'og-arena.png');
  const outPath2 = path.join(process.cwd(), 'public', 'assets', 'boardly-arena-og.png');

  await sharp(svgBuffer).png().toFile(outPath1);
  await sharp(svgBuffer).png().toFile(outPath2);
  console.log('Successfully generated og-arena.png (1200x630)');
}

generateArenaOg().catch(console.error);
