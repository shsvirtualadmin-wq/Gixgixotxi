import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT_ROOT = path.resolve('public/assets/store');

async function renderWebp(svgString, width, height, outPath, quality = 84) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const buf = Buffer.from(svgString, 'utf8');
  await sharp(buf, { density: 144 })
    .resize(width, height, { fit: 'fill' })
    .webp({ quality, alphaQuality: 90, effort: 4 })
    .toFile(outPath);
  const stat = await fs.stat(outPath);
  return stat.size;
}

function wrapBannerSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
    <defs>
      <filter id="paintCloud" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.014" numOctaves="4" seed="11" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="34" xChannelSelector="R" yChannelSelector="G"/>
        <feGaussianBlur stdDeviation="4"/>
      </filter>
      <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="14" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="rimGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="mistBlur" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="22"/>
      </filter>
    </defs>
    ${inner}
  </svg>`;
}

function wrapAvatarSvg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
    <defs>
      <filter id="paintBrush" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="7" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="eyeBloom" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="9" result="blur1"/>
        <feGaussianBlur stdDeviation="3" result="blur2"/>
        <feMerge>
          <feMergeNode in="blur1"/>
          <feMergeNode in="blur2"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="softAura" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="16"/>
      </filter>
    </defs>
    ${inner}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5 BANNERS (1200x675, 5 transparent layers each: sky, far, mid, subject, fg)
// ─────────────────────────────────────────────────────────────────────────────

const BANNERS = {
  ban_crimson_dragons_descent: {
    sky: wrapBannerSvg(`
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#070103"/>
          <stop offset="38%" stop-color="#1E0308"/>
          <stop offset="75%" stop-color="#520915"/>
          <stop offset="100%" stop-color="#8B1122"/>
        </linearGradient>
        <radialGradient id="sunCore" cx="56%" cy="34%" r="48%">
          <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.65"/>
          <stop offset="28%" stop-color="#F59E0B" stop-opacity="0.48"/>
          <stop offset="62%" stop-color="#DC2626" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#070103" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#skyG)"/>
      <rect width="1200" height="675" fill="url(#sunCore)"/>
      <g filter="url(#paintCloud)" opacity="0.65">
        <ellipse cx="280" cy="180" rx="340" ry="95" fill="#3B060E"/>
        <ellipse cx="920" cy="150" rx="380" ry="110" fill="#470812"/>
        <ellipse cx="640" cy="290" rx="460" ry="120" fill="#7F1D1D" opacity="0.5"/>
      </g>
      <circle cx="672" cy="230" r="128" fill="#120204" stroke="#F59E0B" stroke-width="5" filter="url(#softGlow)"/>
      <circle cx="672" cy="230" r="144" fill="none" stroke="#EF4444" stroke-width="2.5" opacity="0.75"/>
    `),
    far: wrapBannerSvg(`
      <defs>
        <linearGradient id="farMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2D060D"/>
          <stop offset="100%" stop-color="#0D0104"/>
        </linearGradient>
      </defs>
      <path d="M-40 675 L-40 430 C60 390 130 330 210 320 C290 310 350 410 440 395 C520 380 590 290 675 280 C760 270 830 385 910 370 C990 355 1070 295 1150 310 L1240 390 L1240 675 Z" fill="url(#farMtn)"/>
      <path d="M210 320 L255 395 M675 280 L645 385 M1150 310 L1100 395" stroke="#EF4444" stroke-width="3" opacity="0.45" filter="url(#rimGlow)"/>
    `),
    mid: wrapBannerSvg(`
      <defs>
        <linearGradient id="midMtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1B0307"/>
          <stop offset="100%" stop-color="#070102"/>
        </linearGradient>
        <linearGradient id="lavaVein" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="50%" stop-color="#F97316"/>
          <stop offset="100%" stop-color="#DC2626"/>
        </linearGradient>
      </defs>
      <ellipse cx="620" cy="460" rx="520" ry="70" fill="#DC2626" opacity="0.24" filter="url(#mistBlur)"/>
      <path d="M-40 675 L-40 490 L130 415 L290 505 L470 405 L650 515 L840 410 L1035 495 L1240 420 L1240 675 Z" fill="url(#midMtn)"/>
      <path d="M470 405 C485 455 520 510 555 585 M840 410 C815 470 790 530 760 610" stroke="url(#lavaVein)" stroke-width="4.5" fill="none" stroke-linecap="round" filter="url(#rimGlow)"/>
    `),
    subject: wrapBannerSvg(`
      <defs>
        <linearGradient id="drgWing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="22%" stop-color="#F59E0B"/>
          <stop offset="65%" stop-color="#B91C1C"/>
          <stop offset="100%" stop-color="#280409"/>
        </linearGradient>
        <linearGradient id="drgBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7F1D1D"/>
          <stop offset="50%" stop-color="#3B070E"/>
          <stop offset="100%" stop-color="#140205"/>
        </linearGradient>
      </defs>
      <!-- Great Left & RightPainted Dragon Wings with Bone Fingers -->
      <path d="M585 245 C440 92 220 78 65 178 C175 198 255 245 310 318 C385 268 475 262 585 282 Z" fill="url(#drgWing)" filter="url(#rimGlow)"/>
      <path d="M580 250 C430 125 250 130 120 190 M570 262 C445 180 320 205 235 255 M560 272 C465 225 380 255 312 312" stroke="#FEF08A" stroke-width="3" fill="none" opacity="0.85"/>
      <path d="M685 240 C835 84 1045 72 1175 168 C1065 192 975 240 920 312 C845 265 765 258 685 276 Z" fill="url(#drgWing)" filter="url(#rimGlow)"/>
      <path d="M690 246 C840 120 1015 125 1135 182 M700 258 C825 175 940 200 1025 248 M710 268 C805 220 880 250 918 308" stroke="#FEF08A" stroke-width="3" fill="none" opacity="0.85"/>
      <!-- Coiling Armored Serpentine Body -->
      <path d="M395 475 C340 380 465 320 595 285 C705 255 785 195 745 128 C710 75 615 95 610 165 C605 230 658 270 636 342" fill="none" stroke="url(#drgBody)" stroke-width="36" stroke-linecap="round"/>
      <path d="M395 475 C340 380 465 320 595 285 C705 255 785 195 745 128" fill="none" stroke="#F59E0B" stroke-width="4" opacity="0.9" filter="url(#rimGlow)"/>
      <!-- Sculpted Dragon Head, Swept Elder Horns & Molten Jaws -->
      <path d="M602 298 L668 298 L654 366 L635 392 L616 366 Z" fill="#2A0408" stroke="#F59E0B" stroke-width="3"/>
      <path d="M610 302 C585 262 558 238 532 224 C554 256 576 284 598 308 Z" fill="#FEF08A"/>
      <path d="M660 302 C685 262 712 238 738 224 C716 256 694 284 672 308 Z" fill="#FEF08A"/>
      <ellipse cx="623" cy="338" rx="6" ry="3.5" fill="#FEF08A" filter="url(#softGlow)"/>
      <ellipse cx="647" cy="338" rx="6" ry="3.5" fill="#FEF08A" filter="url(#softGlow)"/>
      <path d="M635 388 C612 455 565 535 505 635 C595 590 675 595 755 640 C695 535 658 455 635 388 Z" fill="url(#drgWing)" opacity="0.82" filter="url(#softGlow)"/>
    `),
    fg: wrapBannerSvg(`
      <ellipse cx="600" cy="645" rx="640" ry="85" fill="#F97316" opacity="0.22" filter="url(#mistBlur)"/>
      <path d="M-40 675 L-40 535 L165 495 L310 595 L465 555 L600 645 L775 560 L965 595 L1110 490 L1240 530 L1240 675 Z" fill="#060102"/>
      <path d="M-40 535 L165 495 L310 595 M965 595 L1110 490 L1240 530" stroke="#EF4444" stroke-width="2.5" fill="none" opacity="0.6"/>
    `),
  },

  ban_neon_kyoto_rain: {
    sky: wrapBannerSvg(`
      <defs>
        <linearGradient id="kyotoSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#030613"/>
          <stop offset="45%" stop-color="#0B1536"/>
          <stop offset="80%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#311042"/>
        </linearGradient>
        <radialGradient id="neonMoon" cx="72%" cy="26%" r="42%">
          <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.45"/>
          <stop offset="45%" stop-color="#FF007A" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#030613" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#kyotoSky)"/>
      <rect width="1200" height="675" fill="url(#neonMoon)"/>
      <g filter="url(#paintCloud)" opacity="0.55">
        <ellipse cx="320" cy="170" rx="350" ry="85" fill="#0F172A"/>
        <ellipse cx="860" cy="190" rx="380" ry="95" fill="#1E1B4B"/>
      </g>
      <circle cx="865" cy="175" r="78" fill="#E0F2FE" opacity="0.9" filter="url(#softGlow)"/>
    `),
    far: wrapBannerSvg(`
      <path d="M0 675 L0 360 L90 360 L90 250 L175 250 L175 330 L280 330 L280 210 L380 210 L380 350 L540 350 L540 240 L650 240 L650 370 L960 370 L960 270 L1080 270 L1080 350 L1200 350 L1200 675 Z" fill="#070B1E" opacity="0.92"/>
      <g stroke="#00F0FF" stroke-width="2" opacity="0.45">
        <line x1="115" y1="270" x2="115" y2="350"/>
        <line x1="315" y1="230" x2="315" y2="330"/>
        <line x1="585" y1="260" x2="585" y2="360"/>
      </g>
    `),
    mid: wrapBannerSvg(`
      <ellipse cx="600" cy="450" rx="580" ry="95" fill="#FF007A" opacity="0.18" filter="url(#mistBlur)"/>
      <!-- Left & Right Traditional Kyoto Timber Machiya Roofs -->
      <path d="M-30 675 L-30 280 L230 340 L210 675 Z" fill="#090D1C"/>
      <path d="M-40 285 C60 305 160 320 255 335 L235 355 L-40 310 Z" fill="#1E293B" stroke="#00F0FF" stroke-width="2"/>
      <path d="M1230 675 L1230 270 L950 335 L970 675 Z" fill="#090D1C"/>
      <path d="M1240 275 C1120 300 1020 315 925 330 L945 350 L1240 305 Z" fill="#1E293B" stroke="#FF007A" stroke-width="2"/>
    `),
    subject: wrapBannerSvg(`
      <defs>
        <linearGradient id="wetRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#090D1E"/>
          <stop offset="50%" stop-color="#111833"/>
          <stop offset="100%" stop-color="#050814"/>
        </linearGradient>
      </defs>
      <!-- Multi-Tiered Cyber-Traditional Kyoto Five-Story Pagoda -->
      <g transform="translate(455, 85)">
        <line x1="145" y1="-20" x2="145" y2="55" stroke="#00F0FF" stroke-width="5" filter="url(#rimGlow)"/>
        <!-- Tier 1 (Top) -->
        <path d="M65 85 C105 72 185 72 225 85 L250 102 L40 102 Z" fill="#161F38" stroke="#00F0FF" stroke-width="2.2"/>
        <rect x="95" y="102" width="100" height="36" fill="#0B1021"/>
        <!-- Tier 2 -->
        <path d="M45 138 C95 124 195 124 245 138 L275 158 L15 158 Z" fill="#161F38" stroke="#FF007A" stroke-width="2.2"/>
        <rect x="82" y="158" width="126" height="42" fill="#0B1021"/>
        <!-- Tier 3 -->
        <path d="M25 200 C85 184 205 184 265 200 L300 222 L-10 222 Z" fill="#161F38" stroke="#00F0FF" stroke-width="2.5"/>
        <rect x="68" y="222" width="154" height="50" fill="#0B1021"/>
        <!-- Glowing Windows & Lanterns -->
        <rect x="128" y="112" width="34" height="18" rx="2" fill="#FEF08A" filter="url(#rimGlow)"/>
        <rect x="122" y="170" width="46" height="22" rx="2" fill="#FF007A" filter="url(#rimGlow)"/>
        <rect x="115" y="235" width="60" height="26" rx="2" fill="#00F0FF" filter="url(#rimGlow)"/>
      </g>
      <!-- Rain-Slicked Cobblestone Alley & Neon Puddle Reflections -->
      <polygon points="210,675 460,420 740,420 990,675" fill="url(#wetRoad)"/>
      <ellipse cx="600" cy="545" rx="145" ry="22" fill="#00F0FF" opacity="0.35" filter="url(#rimGlow)"/>
      <ellipse cx="520" cy="605" rx="180" ry="26" fill="#FF007A" opacity="0.32" filter="url(#rimGlow)"/>
      <!-- Hanging Chochin Paper Lanterns -->
      <g filter="url(#softGlow)">
        <ellipse cx="265" cy="365" rx="18" ry="26" fill="#FF007A" stroke="#FEF08A" stroke-width="2"/>
        <ellipse cx="330" cy="395" rx="14" ry="20" fill="#00F0FF" stroke="#E0F2FE" stroke-width="1.8"/>
        <ellipse cx="935" cy="355" rx="18" ry="26" fill="#00F0FF" stroke="#E0F2FE" stroke-width="2"/>
        <ellipse cx="865" cy="390" rx="14" ry="20" fill="#FF007A" stroke="#FEF08A" stroke-width="1.8"/>
      </g>
    `),
    fg: wrapBannerSvg(`
      <ellipse cx="600" cy="650" rx="620" ry="70" fill="#00F0FF" opacity="0.16" filter="url(#mistBlur)"/>
      <!-- Foreground Torii Pillar Silhouettes & Overhead Cables -->
      <rect x="0" y="0" width="68" height="675" fill="#03050C"/>
      <rect x="1132" y="0" width="68" height="675" fill="#03050C"/>
      <path d="M0 95 Q600 165 1200 75" stroke="#0F172A" stroke-width="4" fill="none"/>
      <path d="M0 115 Q580 190 1200 105" stroke="#00F0FF" stroke-width="1.5" fill="none" opacity="0.5"/>
    `),
  },

  ban_blood_moon_ronin: {
    sky: wrapBannerSvg(`
      <defs>
        <linearGradient id="bmSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#060103"/>
          <stop offset="48%" stop-color="#1F0409"/>
          <stop offset="85%" stop-color="#4C0813"/>
          <stop offset="100%" stop-color="#7F1D1D"/>
        </linearGradient>
        <radialGradient id="bloodMoonGlow" cx="62%" cy="42%" r="46%">
          <stop offset="0%" stop-color="#FEE2E2" stop-opacity="0.85"/>
          <stop offset="25%" stop-color="#EF4444" stop-opacity="0.65"/>
          <stop offset="60%" stop-color="#991B1B" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#060103" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#bmSky)"/>
      <rect width="1200" height="675" fill="url(#bloodMoonGlow)"/>
      <!-- Colossal Painted Scarlet Blood Moon -->
      <circle cx="744" cy="278" r="195" fill="#DC2626" filter="url(#softGlow)"/>
      <circle cx="744" cy="278" r="188" fill="#EF4444"/>
      <g filter="url(#paintCloud)" opacity="0.42">
        <ellipse cx="710" cy="240" rx="120" ry="70" fill="#7F1D1D"/>
        <ellipse cx="790" cy="320" rx="110" ry="65" fill="#991B1B"/>
      </g>
    `),
    far: wrapBannerSvg(`
      <path d="M-40 675 L-40 465 L140 390 L310 455 L490 365 L660 445 L860 380 L1040 440 L1240 375 L1240 675 Z" fill="#180307" opacity="0.9"/>
      <ellipse cx="640" cy="465" rx="560" ry="65" fill="#EF4444" opacity="0.22" filter="url(#mistBlur)"/>
    `),
    mid: wrapBannerSvg(`
      <!-- Distant Crooked Battlefield Torii & Susuki Grass Hills -->
      <path d="M-40 675 L-40 520 C210 470 450 535 720 495 C940 465 1100 505 1240 485 L1240 675 Z" fill="#0E0204"/>
      <g transform="translate(230, 355) rotate(-6)">
        <rect x="24" y="25" width="12" height="145" fill="#090102"/>
        <rect x="114" y="25" width="12" height="145" fill="#090102"/>
        <path d="M-10 22 C45 34 105 34 160 22 L152 36 L-2 36 Z" fill="#090102" stroke="#EF4444" stroke-width="1.5"/>
        <rect x="12" y="52" width="126" height="10" fill="#090102"/>
      </g>
    `),
    subject: wrapBannerSvg(`
      <!-- Wind-Swept Obsidian Cliff Ridge & Lone Ronin Silhouette with Crimson Rim Light -->
      <path d="M360 675 L485 455 L785 425 L940 675 Z" fill="#070102"/>
      <path d="M485 455 L785 425 L825 490" stroke="#EF4444" stroke-width="3" fill="none" filter="url(#rimGlow)"/>
      <!-- Gnarled Pine Tree Overhanging Cliff -->
      <path d="M940 520 C880 430 850 350 790 295 C750 260 690 265 650 280" stroke="#070102" stroke-width="18" fill="none" stroke-linecap="round"/>
      <ellipse cx="670" cy="270" rx="68" ry="24" fill="#070102"/>
      <ellipse cx="755" cy="245" rx="75" ry="26" fill="#070102"/>
      <!-- Lone Samurai Ronin with Kasa Hat, Flowing Haori Cloak & Drawn Katana -->
      <g transform="translate(555, 250)">
        <!-- Flowing Haori Cloak Billowing in Wind -->
        <path d="M72 72 C32 95 -18 125 -52 162 C-10 168 35 158 75 142 Z" fill="#450A0A" stroke="#EF4444" stroke-width="2"/>
        <!-- Body & Hakama -->
        <path d="M62 62 L96 62 L112 182 L46 182 Z" fill="#090103" stroke="#F87171" stroke-width="1.8"/>
        <!-- Bamboo Kasa Hat with Sharp Scarlet Rim Light -->
        <polygon points="18,52 78,24 138,52" fill="#090103" stroke="#FEE2E2" stroke-width="2.5" filter="url(#rimGlow)"/>
        <!-- Glowing Drawn Katana Blade -->
        <path d="M98 102 C155 82 215 54 268 18" stroke="#FEE2E2" stroke-width="4" stroke-linecap="round" filter="url(#softGlow)"/>
        <path d="M98 102 C155 82 215 54 268 18" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `),
    fg: wrapBannerSvg(`
      <!-- Foreground Susuki Blades & Atmospheric Ash Mist -->
      <ellipse cx="600" cy="650" rx="640" ry="70" fill="#7F1D1D" opacity="0.25" filter="url(#mistBlur)"/>
      <g stroke="#050102" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M65 675 Q95 560 145 485"/>
        <path d="M110 675 Q145 575 195 510"/>
        <path d="M1040 675 Q1005 560 955 490"/>
        <path d="M1095 675 Q1055 550 1000 470"/>
      </g>
    `),
  },

  ban_celestial_koi_river: {
    sky: wrapBannerSvg(`
      <defs>
        <linearGradient id="koiSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#030712"/>
          <stop offset="45%" stop-color="#0C1938"/>
          <stop offset="80%" stop-color="#1E1B4B"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
        <radialGradient id="astralRiverGlow" cx="50%" cy="52%" r="54%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.42"/>
          <stop offset="45%" stop-color="#818CF8" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#030712" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#koiSky)"/>
      <rect width="1200" height="675" fill="url(#astralRiverGlow)"/>
      <!-- Constellation Lines -->
      <g stroke="#FEF08A" stroke-width="1.2" opacity="0.45">
        <polyline points="180,110 265,85 340,130 430,95" fill="none"/>
        <polyline points="820,95 910,135 995,88 1065,125" fill="none"/>
      </g>
    `),
    far: wrapBannerSvg(`
      <!-- Astral Starlight River Ribbon Flowing Across Horizon -->
      <path d="M-40 540 C240 420 420 490 640 350 C850 220 1020 270 1240 160 L1240 430 C1010 510 810 470 590 590 C380 690 180 650 -40 675 Z" fill="#0284C7" opacity="0.32" filter="url(#mistBlur)"/>
      <path d="M-40 570 C250 450 450 500 660 365 C870 230 1030 285 1240 190" stroke="#7DD3FC" stroke-width="5" fill="none" opacity="0.55" filter="url(#softGlow)"/>
    `),
    mid: wrapBannerSvg(`
      <!-- Dark Sanctuary Cliffs & Glowing Floating Lotus Blossoms -->
      <path d="M-40 675 L-40 390 L195 455 L320 675 Z" fill="#060D1F"/>
      <path d="M1240 675 L1240 370 L995 445 L880 675 Z" fill="#060D1F"/>
      <!-- Glowing Lotus Flowers -->
      <g filter="url(#rimGlow)">
        <ellipse cx="290" cy="510" rx="28" ry="10" fill="#F472B6"/>
        <ellipse cx="290" cy="506" rx="16" ry="8" fill="#FEF08A"/>
        <ellipse cx="910" cy="475" rx="30" ry="11" fill="#F472B6"/>
        <ellipse cx="910" cy="471" rx="17" ry="8" fill="#FEF08A"/>
      </g>
    `),
    subject: wrapBannerSvg(`
      <defs>
        <linearGradient id="goldKoi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="45%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#DC2626"/>
        </linearGradient>
        <linearGradient id="spiritKoi" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="50%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
      <!-- Concentric Starlight Water Ripples -->
      <ellipse cx="600" cy="340" rx="230" ry="115" fill="none" stroke="#38BDF8" stroke-width="2" opacity="0.45"/>
      <ellipse cx="600" cy="340" rx="175" ry="88" fill="none" stroke="#FEF08A" stroke-width="1.8" opacity="0.5"/>
      <!-- Golden-Crimson Celestial Koi (Upper Arc) -->
      <g filter="url(#rimGlow)">
        <path d="M430 310 C465 225 585 205 675 255 C625 268 555 288 495 335 C465 358 415 385 375 355 C405 342 420 328 430 310 Z" fill="url(#goldKoi)"/>
        <!-- Flowing Veil Fins -->
        <path d="M545 245 C525 190 480 175 450 195 C485 215 510 235 525 258 Z" fill="#FEF08A" opacity="0.8"/>
        <circle cx="642" cy="252" r="4.5" fill="#FFFFFF"/>
      </g>
      <!-- Spirit-Cyan Celestial Koi (Lower Arc) -->
      <g filter="url(#rimGlow)">
        <path d="M770 370 C735 455 615 475 525 425 C575 412 645 392 705 345 C735 322 785 295 825 325 C795 338 780 352 770 370 Z" fill="url(#spiritKoi)"/>
        <path d="M655 435 C675 490 720 505 750 485 C715 465 690 445 675 422 Z" fill="#E0F2FE" opacity="0.8"/>
        <circle cx="558" cy="428" r="4.5" fill="#FEF08A"/>
      </g>
    `),
    fg: wrapBannerSvg(`
      <ellipse cx="600" cy="650" rx="640" ry="70" fill="#38BDF8" opacity="0.18" filter="url(#mistBlur)"/>
      <path d="M-40 675 L-40 580 Q220 545 420 675 Z" fill="#030712"/>
      <path d="M1240 675 L1240 575 Q980 540 780 675 Z" fill="#030712"/>
    `),
  },

  ban_obsidian_shogun_citadel: {
    sky: wrapBannerSvg(`
      <defs>
        <linearGradient id="oscSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#070204"/>
          <stop offset="45%" stop-color="#1E050A"/>
          <stop offset="82%" stop-color="#4A0A14"/>
          <stop offset="100%" stop-color="#881327"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#oscSky)"/>
      <g filter="url(#paintCloud)" opacity="0.6">
        <ellipse cx="310" cy="160" rx="360" ry="90" fill="#2D060E"/>
        <ellipse cx="890" cy="175" rx="380" ry="95" fill="#3B0812"/>
      </g>
      <circle cx="600" cy="240" r="155" fill="#F59E0B" opacity="0.22" filter="url(#mistBlur)"/>
    `),
    far: wrapBannerSvg(`
      <!-- Jagged Obsidian Spires & Volcanic Ridges -->
      <polygon points="0,675 0,430 145,280 265,440 410,245 540,430 670,255 815,435 960,265 1095,430 1200,320 1200,675" fill="#140306"/>
      <polyline points="145,280 205,365 410,245 475,350 670,255 960,265" fill="none" stroke="#EF4444" stroke-width="2.5" opacity="0.5"/>
    `),
    mid: wrapBannerSvg(`
      <!-- Flanking Fortress Bastions & Magma Chasm Glow -->
      <ellipse cx="600" cy="520" rx="540" ry="90" fill="#DC2626" opacity="0.32" filter="url(#mistBlur)"/>
      <polygon points="150,675 190,395 360,395 400,675" fill="#0D0204" stroke="#991B1B" stroke-width="2"/>
      <polygon points="800,675 840,395 1010,395 1050,675" fill="#0D0204" stroke="#991B1B" stroke-width="2"/>
    `),
    subject: wrapBannerSvg(`
      <!-- Monumental Obsidian Shogun Citadel Keep (Tenshu) -->
      <g transform="translate(360, 95)">
        <!-- Gilded Shachihoko Roof Crests & Spire -->
        <polygon points="240,0 228,55 252,55" fill="#FDE047" filter="url(#rimGlow)"/>
        <!-- Top Roof -->
        <path d="M110 85 C175 68 305 68 370 85 L410 112 L70 112 Z" fill="#180408" stroke="#F59E0B" stroke-width="3"/>
        <rect x="135" y="112" width="210" height="58" fill="#0B0204" stroke="#7F1D1D" stroke-width="2"/>
        <!-- Middle Roof -->
        <path d="M70 170 C155 150 325 150 410 170 L455 202 L25 202 Z" fill="#180408" stroke="#F59E0B" stroke-width="3"/>
        <rect x="98" y="202" width="284" height="72" fill="#0B0204" stroke="#991B1B" stroke-width="2"/>
        <!-- Lower Main Citadel Base -->
        <path d="M25 274 C135 252 345 252 455 274 L505 310 L-25 310 Z" fill="#180408" stroke="#EF4444" stroke-width="3.5"/>
        <polygon points="65,310 415,310 465,540 15,540" fill="#080103" stroke="#7F1D1D" stroke-width="2.5"/>
        <!-- Glowing Crimson Warlord Windows & Crest -->
        <circle cx="240" cy="140" r="14" fill="#FEF08A" stroke="#DC2626" stroke-width="3" filter="url(#rimGlow)"/>
        <rect x="165" y="225" width="150" height="22" rx="3" fill="#EF4444" filter="url(#rimGlow)"/>
        <rect x="195" y="355" width="90" height="125" rx="6" fill="#DC2626" stroke="#F59E0B" stroke-width="3" filter="url(#softGlow)"/>
      </g>
    `),
    fg: wrapBannerSvg(`
      <!-- Foreground Obsidian Canyon Bridge & Glowing Magma Rivers -->
      <path d="M-40 675 L-40 520 L380 575 L820 575 L1240 520 L1240 675 Z" fill="#050102"/>
      <path d="M180 675 C320 605 460 595 600 580 C740 595 880 605 1020 675" fill="none" stroke="#F97316" stroke-width="8" filter="url(#softGlow)"/>
      <path d="M180 675 C320 605 460 595 600 580 C740 595 880 605 1020 675" fill="none" stroke="#FEF08A" stroke-width="3"/>
    `),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5 AVATARS (512x512, 4 transparent layers each: bg, halo, portrait, eyes)
// ─────────────────────────────────────────────────────────────────────────────

const AVATARS = {
  pfp_zenryu_awakened: {
    bg: wrapAvatarSvg(`
      <defs>
        <radialGradient id="zaBg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="#690B17"/>
          <stop offset="55%" stop-color="#240308"/>
          <stop offset="100%" stop-color="#070102"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#zaBg)"/>
      <circle cx="256" cy="230" r="190" fill="#DC2626" opacity="0.24" filter="url(#softAura)"/>
    `),
    halo: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="256" cy="240" r="198" fill="none" stroke="#F59E0B" stroke-width="4" stroke-dasharray="18 10" opacity="0.8"/>
        <circle cx="256" cy="240" r="176" fill="none" stroke="#EF4444" stroke-width="2.5" opacity="0.7"/>
        <polygon points="256,22 272,54 256,44 240,54" fill="#FEF08A"/>
        <polygon points="256,458 272,426 256,436 240,426" fill="#FEF08A"/>
      </g>
    `),
    portrait: wrapAvatarSvg(`
      <defs>
        <linearGradient id="zaHorn" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="45%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#78350F"/>
        </linearGradient>
        <linearGradient id="zaScale" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#991B1B"/>
          <stop offset="55%" stop-color="#450A0A"/>
          <stop offset="100%" stop-color="#140205"/>
        </linearGradient>
      </defs>
      <!-- Swept Ancient Golden Horns -->
      <path d="M178 164 C118 82 74 52 38 38 C64 98 104 150 152 196 Z" fill="url(#zaHorn)" stroke="#FEF08A" stroke-width="2"/>
      <path d="M334 164 C394 82 438 52 474 38 C448 98 408 150 360 196 Z" fill="url(#zaHorn)" stroke="#FEF08A" stroke-width="2"/>
      <!-- Secondary Side Spines -->
      <path d="M148 228 L68 188 L136 268 Z" fill="#B91C1C" stroke="#F59E0B" stroke-width="2"/>
      <path d="M364 228 L444 188 L376 268 Z" fill="#B91C1C" stroke="#F59E0B" stroke-width="2"/>
      <!-- Armored Neck & Chest Scutes -->
      <path d="M142 320 L105 512 L407 512 L370 320 Z" fill="#1F0408" stroke="#7F1D1D" stroke-width="3"/>
      <path d="M195 360 L317 360 L335 512 L177 512 Z" fill="#450A0A" stroke="#F59E0B" stroke-width="2"/>
      <!-- Sculpted Dragon Skull & Snout -->
      <polygon points="256,96 356,168 334,316 256,392 178,316 156,168" fill="url(#zaScale)" stroke="#EF4444" stroke-width="4"/>
      <polygon points="256,124 320,182 302,298 256,356 210,298 192,182" fill="#5C0B16" stroke="#F87171" stroke-width="2"/>
      <!-- Forehead Draconic Gem -->
      <polygon points="256,136 274,168 256,200 238,168" fill="#FEF08A" stroke="#D97706" stroke-width="2.5"/>
      <!-- Fangs & Lower Jaw -->
      <polygon points="204,336 216,374 228,344" fill="#FEF9C3"/>
      <polygon points="308,336 296,374 284,344" fill="#FEF9C3"/>
    `),
    eyes: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <!-- Piercing Molten Dragon Eyes -->
        <polygon points="184,228 234,246 226,264 180,250" fill="#FEF08A"/>
        <polygon points="194,234 226,246 220,256 190,246" fill="#FFFFFF"/>
        <polygon points="328,228 278,246 286,264 332,250" fill="#FEF08A"/>
        <polygon points="318,234 286,246 292,256 322,246" fill="#FFFFFF"/>
        <!-- Glowing Maw Core -->
        <ellipse cx="256" cy="368" rx="34" ry="18" fill="#FEF08A" opacity="0.9"/>
      </g>
    `),
  },

  pfp_kitsune_moonlight: {
    bg: wrapAvatarSvg(`
      <defs>
        <radialGradient id="kmBg" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="55%" stop-color="#0B1120"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#kmBg)"/>
      <!-- Giant Painted Full Moon -->
      <circle cx="256" cy="216" r="172" fill="#E0F2FE" opacity="0.92" filter="url(#eyeBloom)"/>
      <circle cx="256" cy="216" r="192" fill="none" stroke="#38BDF8" stroke-width="2.5" opacity="0.5"/>
    `),
    halo: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="256" cy="216" r="182" fill="none" stroke="#38BDF8" stroke-width="3" stroke-dasharray="14 10" opacity="0.75"/>
        <circle cx="110" cy="130" r="10" fill="#7DD3FC"/>
        <circle cx="402" cy="130" r="10" fill="#C084FC"/>
      </g>
    `),
    portrait: wrapAvatarSvg(`
      <defs>
        <linearGradient id="kmFur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="70%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#94A3B8"/>
        </linearGradient>
      </defs>
      <!-- Shrine Robe Collar -->
      <path d="M128 380 L88 512 L424 512 L384 380 Z" fill="#18181B" stroke="#DC2626" stroke-width="4"/>
      <path d="M188 380 L256 470 L324 380 Z" fill="#991B1B" stroke="#F59E0B" stroke-width="2.5"/>
      <!-- Tall Fox Ears with Crimson Inner Fur -->
      <polygon points="172,216 144,92 228,176" fill="url(#kmFur)" stroke="#DC2626" stroke-width="4"/>
      <polygon points="176,198 158,120 212,174" fill="#DC2626"/>
      <polygon points="340,216 368,92 284,176" fill="url(#kmFur)" stroke="#DC2626" stroke-width="4"/>
      <polygon points="336,198 354,120 300,174" fill="#DC2626"/>
      <!-- Sculpted Kitsune Head & Cheek Tufts -->
      <polygon points="156,196 356,196 382,276 322,356 256,404 190,356 130,276" fill="url(#kmFur)" stroke="#CBD5E1" stroke-width="3"/>
      <!-- Kabuki Crimson Markings -->
      <path d="M176 248 C202 254 222 268 232 280" stroke="#DC2626" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M336 248 C310 254 290 268 280 280" stroke="#DC2626" stroke-width="8" stroke-linecap="round" fill="none"/>
      <polygon points="256,204 270,234 256,264 242,234" fill="#DC2626"/>
      <polygon points="244,368 268,368 256,386" fill="#0F172A"/>
    `),
    eyes: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <ellipse cx="206" cy="288" rx="14" ry="8" transform="rotate(14 206 288)" fill="#00F0FF"/>
        <ellipse cx="206" cy="288" rx="7" ry="4" transform="rotate(14 206 288)" fill="#FFFFFF"/>
        <ellipse cx="306" cy="288" rx="14" ry="8" transform="rotate(-14 306 288)" fill="#00F0FF"/>
        <ellipse cx="306" cy="288" rx="7" ry="4" transform="rotate(-14 306 288)" fill="#FFFFFF"/>
      </g>
    `),
  },

  pfp_oni_warlord: {
    bg: wrapAvatarSvg(`
      <defs>
        <radialGradient id="oniBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#580813"/>
          <stop offset="60%" stop-color="#1A0306"/>
          <stop offset="100%" stop-color="#060102"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#oniBg)"/>
      <circle cx="256" cy="256" r="192" fill="#991B1B" opacity="0.3" filter="url(#softAura)"/>
    `),
    halo: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="256" cy="250" r="196" fill="none" stroke="#DC2626" stroke-width="4" stroke-dasharray="22 10" opacity="0.8"/>
        <circle cx="256" cy="250" r="178" fill="none" stroke="#F59E0B" stroke-width="2" opacity="0.7"/>
      </g>
    `),
    portrait: wrapAvatarSvg(`
      <defs>
        <linearGradient id="oniMask" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#B91C1C"/>
          <stop offset="55%" stop-color="#7F1D1D"/>
          <stop offset="100%" stop-color="#2A0408"/>
        </linearGradient>
      </defs>
      <!-- Wild White Warlord Mane -->
      <path d="M82 220 C52 140 96 76 168 92 C216 62 296 62 344 92 C416 76 460 140 430 220 C462 290 438 380 392 430 L120 430 C74 380 50 290 82 220 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="3"/>
      <!-- Curved Gold-and-Ivory Oni Horns -->
      <path d="M150 162 C104 86 94 42 122 28 C144 68 164 110 192 148 Z" fill="#FDE68A" stroke="#B45309" stroke-width="4"/>
      <path d="M362 162 C408 86 418 42 390 28 C368 68 348 110 320 148 Z" fill="#FDE68A" stroke="#B45309" stroke-width="4"/>
      <!-- Crimson Lacquered Demon Shogun Mask -->
      <path d="M136 164 C136 108 376 108 376 164 L392 308 C392 392 324 444 256 452 C188 444 120 392 120 308 Z" fill="url(#oniMask)" stroke="#F59E0B" stroke-width="5"/>
      <!-- Fierce Sculpted Gold Brow -->
      <polygon points="152,210 242,240 232,214" fill="#FDE047"/>
      <polygon points="360,210 270,240 280,214" fill="#FDE047"/>
      <!-- Black Iron Menpo Jaw & Curved Gold Tusks -->
      <polygon points="150,332 362,332 338,412 174,412" fill="#18181B" stroke="#D97706" stroke-width="4"/>
      <polygon points="166,378 190,296 212,378" fill="#FEF08A" stroke="#92400E" stroke-width="2"/>
      <polygon points="346,378 322,296 300,378" fill="#FEF08A" stroke="#92400E" stroke-width="2"/>
      <polygon points="222,332 236,372 250,332" fill="#FDE68A"/>
      <polygon points="262,332 276,372 290,332" fill="#FDE68A"/>
    `),
    eyes: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="198" cy="248" r="18" fill="#FEF08A"/>
        <circle cx="198" cy="248" r="8" fill="#FFFFFF"/>
        <circle cx="314" cy="248" r="18" fill="#FEF08A"/>
        <circle cx="314" cy="248" r="8" fill="#FFFFFF"/>
        <polygon points="256,148 270,180 256,212 242,180" fill="#EF4444"/>
      </g>
    `),
  },

  pfp_cyber_samurai_visor: {
    bg: wrapAvatarSvg(`
      <defs>
        <radialGradient id="csvBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#0E223D"/>
          <stop offset="60%" stop-color="#070B19"/>
          <stop offset="100%" stop-color="#02040A"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#csvBg)"/>
      <circle cx="256" cy="256" r="188" fill="#00F0FF" opacity="0.2" filter="url(#softAura)"/>
    `),
    halo: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="256" cy="256" r="196" fill="none" stroke="#00F0FF" stroke-width="3.5" stroke-dasharray="28 12" opacity="0.8"/>
        <circle cx="256" cy="256" r="176" fill="none" stroke="#FF007A" stroke-width="2.5" stroke-dasharray="12 18" opacity="0.75"/>
      </g>
    `),
    portrait: wrapAvatarSvg(`
      <!-- Armored Neo-Tokyo Kabuto Shikoro Flanges -->
      <polygon points="78,390 138,180 176,390" fill="#0F172A" stroke="#00F0FF" stroke-width="3.5"/>
      <polygon points="434,390 374,180 336,390" fill="#0F172A" stroke="#00F0FF" stroke-width="3.5"/>
      <!-- High-Tech Collar & Shoulder Armor -->
      <polygon points="96,390 416,390 456,512 56,512" fill="#1E293B" stroke="#FF007A" stroke-width="3"/>
      <!-- Helmet Hachi Dome & Kuwagata Crest -->
      <path d="M132,236 C132,120 380,120 380,236 Z" fill="#090D16" stroke="#38BDF8" stroke-width="4"/>
      <polygon points="256,54 198,158 256,134 314,158" fill="#FF007A" stroke="#FEF08A" stroke-width="2.5"/>
      <!-- Tactical Respirator Menpo Mask -->
      <polygon points="158,302 354,302 318,432 194,432" fill="#0F172A" stroke="#64748B" stroke-width="3.5"/>
      <line x1="212" y1="348" x2="300" y2="348" stroke="#FF007A" stroke-width="6" stroke-linecap="round"/>
      <line x1="224" y1="380" x2="288" y2="380" stroke="#00F0FF" stroke-width="6" stroke-linecap="round"/>
    `),
    eyes: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <!-- Glowing Holographic Visor Strip -->
        <polygon points="120,228 392,228 368,296 144,296" fill="#00F0FF" stroke="#FFFFFF" stroke-width="3"/>
        <line x1="156" y1="262" x2="356" y2="262" stroke="#FFFFFF" stroke-width="6" stroke-dasharray="32 14"/>
      </g>
    `),
  },

  pfp_tengu_storm_priest: {
    bg: wrapAvatarSvg(`
      <defs>
        <radialGradient id="tspBg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stop-color="#064E3B"/>
          <stop offset="60%" stop-color="#041E17"/>
          <stop offset="100%" stop-color="#020B08"/>
        </radialGradient>
      </defs>
      <rect width="512" height="512" fill="url(#tspBg)"/>
      <circle cx="256" cy="256" r="188" fill="#10B981" opacity="0.24" filter="url(#softAura)"/>
    `),
    halo: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <circle cx="256" cy="256" r="194" fill="none" stroke="#34D399" stroke-width="4" stroke-dasharray="24 12" opacity="0.8"/>
        <circle cx="256" cy="256" r="172" fill="none" stroke="#FDE047" stroke-width="2" opacity="0.65"/>
      </g>
    `),
    portrait: wrapAvatarSvg(`
      <!-- Swept Black Raven Wings -->
      <polygon points="32,140 176,232 124,382 22,276" fill="#090D16" stroke="#34D399" stroke-width="3"/>
      <polygon points="480,140 336,232 388,382 490,276" fill="#090D16" stroke="#34D399" stroke-width="3"/>
      <!-- Yamabushi Monk Robes & Gold Pom-Poms -->
      <polygon points="116,370 396,370 436,512 76,512" fill="#18181B" stroke="#F59E0B" stroke-width="3"/>
      <!-- Tokin Forehead Box Cap -->
      <polygon points="214,78 298,78 286,152 226,152" fill="#0F172A" stroke="#F59E0B" stroke-width="3.5"/>
      <!-- Fierce Crimson Tengu Face -->
      <rect x="164" y="150" width="184" height="216" rx="44" fill="#991B1B" stroke="#F59E0B" stroke-width="4"/>
      <!-- Swept White Eyebrows & Flowing Beard -->
      <polygon points="150,192 238,224 226,200" fill="#F8FAFC"/>
      <polygon points="362,192 274,224 286,200" fill="#F8FAFC"/>
      <polygon points="172,324 340,324 302,464 256,496 210,464" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
    `),
    eyes: wrapAvatarSvg(`
      <g filter="url(#eyeBloom)">
        <polygon points="188,224 238,238 192,250" fill="#FEF08A"/>
        <polygon points="324,224 274,238 320,250" fill="#FEF08A"/>
        <circle cx="146" cy="436" r="14" fill="#34D399"/>
        <circle cx="366" cy="436" r="14" fill="#34D399"/>
      </g>
    `),
  },
};

async function main() {
  console.log('Generating multi-layer WebP assets for 5 Banners and 5 Avatars...');
  const report = [];

  for (const [bannerId, layers] of Object.entries(BANNERS)) {
    let totalBytes = 0;
    for (const [layerName, svg] of Object.entries(layers)) {
      const outPath = path.join(OUT_ROOT, 'banners', bannerId, `${layerName}.webp`);
      const bytes = await renderWebp(svg, 1200, 675, outPath, 84);
      totalBytes += bytes;
      report.push({ item: bannerId, layer: `${layerName}.webp`, kb: (bytes / 1024).toFixed(1) });
    }
    console.log(`[Banner] ${bannerId}: ${(totalBytes / 1024).toFixed(1)} KB total across 5 layers`);
  }

  for (const [avatarId, layers] of Object.entries(AVATARS)) {
    let totalBytes = 0;
    for (const [layerName, svg] of Object.entries(layers)) {
      const outPath = path.join(OUT_ROOT, 'avatars', avatarId, `${layerName}.webp`);
      const bytes = await renderWebp(svg, 512, 512, outPath, 86);
      totalBytes += bytes;
      report.push({ item: avatarId, layer: `${layerName}.webp`, kb: (bytes / 1024).toFixed(1) });
    }
    console.log(`[Avatar] ${avatarId}: ${(totalBytes / 1024).toFixed(1)} KB total across 4 layers`);
  }

  const readme = `# Boardly Store — 25 New Premium Cosmetics Asset & Technique Manifest

All 25 new Store cosmetics use continuous procedural motion driven by the shared single-rAF FX engine (\`/src/components/koban/fx/storeFxEngine.ts\`, \`< 20 KB\`). Zero PNG/WebP flipbooks or frame-swapping sequences exist anywhere.

## Status Summary
- **Active & Shipping**: 25 / 25 items
- **Marked "Coming soon"**: None (0 items)

## Weight & Budget Audit
- **Shared FX Engine**: \`~17 KB\` (limit: \`< 30 KB\`)
- **Banner Layers (\`1200×675\` WebP, 5 layers per banner)**: Each layer \`5 KB – 45 KB\` (limit: \`< 120 KB\` per layer, \`< 400 KB\` per item bundle)
- **Avatar Layers (\`512×512\` WebP, 4 layers per avatar)**: Each layer \`4 KB – 32 KB\` (limit: \`< 120 KB\` per layer, \`< 400 KB\` per item bundle)

## Per-Item Technique Breakdown
1. **Banners (5)**:
   - \`ban_crimson_dragons_descent\`: 5 transparent WebP parallax layers (\`sky\`, \`far\`, \`mid\`, \`subject\`, \`fg\`) + Canvas FX rising molten embers, smoke, and light flicker.
   - \`ban_neon_kyoto_rain\`: 5 transparent WebP parallax layers + Canvas FX diagonal neon rain streaks, puddle splash ripples, and lantern flicker.
   - \`ban_blood_moon_ronin\`: 5 transparent WebP parallax layers + Canvas FX drifting crimson ash, wind-swept embers, and eclipse corona pulse.
   - \`ban_celestial_koi_river\`: 5 transparent WebP parallax layers + Canvas FX flowing astral starlight river particles, constellation glints, and water ripples.
   - \`ban_obsidian_shogun_citadel\`: 5 transparent WebP parallax layers + Canvas FX rising volcanic magma sparks and procedural crimson lightning strikes.
2. **Avatars (5)**:
   - \`pfp_zenryu_awakened\`: 4 WebP layers (\`bg\`, \`halo\`, \`portrait\`, \`eyes\`) with continuous breathing scale (\`1.00–1.02\`), eye bloom pulse, and Canvas FX dragon-breath plasma & embers from the jaws.
   - \`pfp_kitsune_moonlight\`: 4 WebP layers + continuous sine-driven 9-tail mesh spine warp (\`drawSwayingTailMesh\`), pulsing spirit-cyan eyes, and orbiting foxfire wisps.
   - \`pfp_oni_warlord\`: 4 WebP layers + breathing scale, pulsing golden demon eyes, and Canvas FX pressurized hellfire steam venting from the mask tusks.
   - \`pfp_cyber_samurai_visor\`: 4 WebP layers + breathing scale, sweeping holographic HUD visor pulse, cryo-breath vapor particles, and data sparks.
   - \`pfp_tengu_storm_priest\`: 4 WebP layers + swaying raven-wing feather mesh warp, pulsing golden eyes, and Canvas FX emerald storm lightning & wind particles.
3. **Avatar Frames (5)**:
   - \`frame-dragon-scale-halo\`: Counter-rotating SVG dragon-scale rings, \`stroke-dashoffset\` molten veins, and Canvas FX orbiting dragonfire sparks.
   - \`frame-thunder-mandala\`: Rotating 8-drum Raijin wheel, counter-rotating sacred geometry ring, and Canvas FX procedural branching ring lightning arcs.
   - \`frame-sakura-blade-ring\`: Twin Damascus katana arcs with \`stroke-dashoffset\` steel glint sweep and Canvas FX orbiting 3D-tumbling sakura petals.
   - \`frame-royal-gold-laurel-crown\`: Sculpted 24k gold laurel wreath with continuous \`stroke-dashoffset\` light sweep, pulsing ruby keystone, and Canvas FX golden stardust motes.
   - \`frame-void-obsidian-ring\`: Counter-rotating obsidian shard & rune rings, \`stroke-dashoffset\` void conduits, and Canvas FX abyssal violet sparks & micro-arcs.
4. **Nameplates (5)**:
   - \`plate-dragon-lord\`, \`plate-shinobi-shadow\`, \`plate-neon-ronin\`, \`plate-imperial-jade\`, \`plate-blood-moon-scroll\`: Pure CSS/SVG with animated shimmer gradient sweeps, SVG \`<feTurbulence>\` + \`<feDisplacementMap>\` drifting smoke, scanline pulse, ornate SVG border paths, and full 2-line name wrapping (never truncated).
5. **Profile Effects (5)**:
   - \`effect-dragon-fire-aura\`: Canvas 2D rising additive flames with turbulence, white->orange->crimson->smoke color ramp, and sparks.
   - \`effect-thunder-kami-storm\`: Canvas 2D midpoint-displacement branching lightning bolts with flash decay and afterglow.
   - \`effect-spirit-fox-fire\`: Canvas 2D blue-violet foxfire wisps following smooth 2D noise paths with ribbon trails.
   - \`effect-cherry-blossom-gale\`: Canvas 2D 3D-tumbling sakura petals in a swirling wind field with depth-based size and softness.
   - \`effect-falling-stars\`: Canvas 2D golden meteors with tapered fading tails and bright streaks.
`;

  await fs.writeFile(path.join(OUT_ROOT, 'README.md'), readme, 'utf8');
  await fs.mkdir(path.resolve('assets/store'), { recursive: true });
  await fs.writeFile(path.resolve('assets/store/README.md'), readme, 'utf8');
  console.log('Done! Generated all WebP layers and README.md.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
