import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_DOTS = [
  // B - Stem columns and bowls (x <= 456)
  [315, 361], [315, 389], [315, 417], [315, 445], [315, 472], [315, 500], [315, 527], [315, 555],
  [344, 361], [344, 389], [344, 417], [344, 445], [344, 472], [344, 500], [344, 527], [344, 555],
  [372, 361], [372, 389], [372, 445], [372, 555],
  [400, 361], [400, 389], [400, 445], [400, 472], [400, 555],
  [428, 361], [428, 389], [428, 445], [428, 472], [428, 555],
  [455, 418], [455, 473], [456, 389], [456, 500], [456, 528],
  // o
  [596, 507], [597, 448], [597, 478],
  [621, 418], [621, 536],
  [649, 418], [649, 536],
  [677, 418], [677, 536],
  [705, 418], [705, 536],
  [732, 449], [732, 478], [732, 507],
  // a
  [785, 507],
  [813, 476], [813, 536], [814, 417],
  [841, 476], [841, 536], [843, 417],
  [869, 476], [869, 535], [872, 417],
  [898, 476], [898, 535], [900, 417],
  [926, 446], [926, 476], [926, 506], [926, 535],
  // r
  [996, 418], [996, 449], [996, 480], [996, 510], [996, 538],
  [1026, 417],
  [1056, 417],
  [1086, 417],
  [1110, 444],
  // d
  [1155, 507], [1156, 446], [1156, 477],
  [1189, 536], [1190, 418],
  [1217, 536], [1218, 418],
  [1244, 418], [1244, 536],
  [1271, 536],
  [1298, 348], [1298, 380], [1298, 413], [1298, 445], [1298, 478], [1298, 509], [1298, 536],
  // l
  [1361, 348], [1361, 380], [1361, 412], [1361, 443], [1361, 474], [1361, 505], [1361, 535],
  [1392, 535],
  // y
  [1432, 419], [1432, 448], [1432, 477], [1432, 506],
  [1454, 538], [1463, 606],
  [1485, 538], [1493, 605],
  [1515, 538], [1523, 605],
  [1559, 419], [1559, 448], [1559, 477], [1559, 507], [1559, 538], [1559, 569],
];

function buildSvg(redColor, letterColor) {
  const boxHtml = `
    <rect
      x="228"
      y="286"
      width="319"
      height="322"
      rx="76"
      ry="76"
      fill="none"
      stroke="${redColor}"
      stroke-width="12"
    />
  `;

  const dotsHtml = LOGO_DOTS.map(([cx, cy]) => {
    const isB = cx <= 456;
    const color = isB ? redColor : letterColor;
    return `<circle cx="${cx}" cy="${cy}" r="13.5" fill="${color}" />`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="178 270 1440 360" width="480" height="120">
  <g>
    ${boxHtml}
    ${dotsHtml}
  </g>
</svg>`;
}

async function main() {
  const outDir = path.resolve('public', 'email');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Red and White for dark background (default)
  const defaultSvg = buildSvg('#E11D2A', '#FFFFFF');
  const defaultPngPath = path.join(outDir, 'boardly-logo.png');
  await sharp(Buffer.from(defaultSvg))
    .png({ compressionLevel: 9 })
    .toFile(defaultPngPath);
  console.log('Generated:', defaultPngPath);

  // 2. Red and Dark charcoal for light background
  const darkSvg = buildSvg('#E11D2A', '#111114');
  const darkPngPath = path.join(outDir, 'boardly-logo-dark.png');
  await sharp(Buffer.from(darkSvg))
    .png({ compressionLevel: 9 })
    .toFile(darkPngPath);
  console.log('Generated:', darkPngPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
