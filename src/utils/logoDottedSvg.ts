/**
 * Generates pure vector dot-matrix coordinates of the official Boardly logo.
 * Uses the exact 116 circular dots from Logo.tsx (boxed 'B' + 'oardly' wordmark)
 * and samples the outer rounded-rectangle box around the 'B' into matching circular dots,
 * yielding a 100% vector dot-matrix logo that can be drawn directly into jsPDF or SVG.
 */

export const BOARDLY_LOGO_DOTS: readonly [number, number][] = [
  // B - Stem columns and bowls
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

/**
 * Pre-computed sampled perimeter dots for the outer rounded box around the 'B'
 * rect: x=228, y=286, width=319, height=322, rx=76, ry=76
 */
export const BOX_OUTLINE_DOTS: readonly [number, number][] = (() => {
  const dots: [number, number][] = [];
  const x0 = 228;
  const y0 = 286;
  const w = 319;
  const h = 322;
  const r = 76;
  const step = 26;

  // Top edge (x from 304 to 471)
  for (let x = x0 + r; x <= x0 + w - r; x += step) {
    dots.push([Math.round(x), y0]);
  }
  // Top-right corner arc (-90 deg to 0 deg)
  for (let a = -Math.PI / 2 + 0.35; a < 0; a += 0.35) {
    dots.push([
      Math.round(x0 + w - r + r * Math.cos(a)),
      Math.round(y0 + r + r * Math.sin(a)),
    ]);
  }
  // Right edge (y from 362 to 532)
  for (let y = y0 + r; y <= y0 + h - r; y += step) {
    dots.push([x0 + w, Math.round(y)]);
  }
  // Bottom-right corner arc (0 deg to 90 deg)
  for (let a = 0.35; a < Math.PI / 2; a += 0.35) {
    dots.push([
      Math.round(x0 + w - r + r * Math.cos(a)),
      Math.round(y0 + h - r + r * Math.sin(a)),
    ]);
  }
  // Bottom edge (x from 471 down to 304)
  for (let x = x0 + w - r; x >= x0 + r; x -= step) {
    dots.push([Math.round(x), y0 + h]);
  }
  // Bottom-left corner arc (90 deg to 180 deg)
  for (let a = Math.PI / 2 + 0.35; a < Math.PI; a += 0.35) {
    dots.push([
      Math.round(x0 + r + r * Math.cos(a)),
      Math.round(y0 + h - r + r * Math.sin(a)),
    ]);
  }
  // Left edge (y from 532 down to 362)
  for (let y = y0 + h - r; y >= y0 + r; y -= step) {
    dots.push([x0, Math.round(y)]);
  }
  // Top-left corner arc (180 deg to 270 deg)
  for (let a = Math.PI + 0.35; a < (3 * Math.PI) / 2; a += 0.35) {
    dots.push([
      Math.round(x0 + r + r * Math.cos(a)),
      Math.round(y0 + r + r * Math.sin(a)),
    ]);
  }

  return dots;
})();

/**
 * Returns a standalone SVG string of the Boardly logo with every element drawn as circular dots.
 * @param color Fill color (e.g. '#000000', '#ffffff', '#D71921')
 * @param opacity Optional opacity attribute
 */
export function getBoardlyDottedLogoSvg(color = '#000000', opacity = 1): string {
  const boxCircles = BOX_OUTLINE_DOTS.map(
    ([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="9.5" fill="${color}" />`
  ).join('');

  const letterCircles = BOARDLY_LOGO_DOTS.map(
    ([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="13" fill="${color}" />`
  ).join('');

  return `<svg role="img" aria-label="Boardly" viewBox="0 0 1768 824" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}; display: block; width: 100%; height: auto;"><g>${boxCircles}${letterCircles}</g></svg>`;
}

/**
 * Draws the exact Boardly dot-matrix logo (both the boxed 'B' icon and the 'oardly' wordmark)
 * directly as pure vector circles onto a jsPDF document.
 *
 * Because it uses native vector circles (`doc.circle(cx, cy, r, 'F')`), it stays 100% sharp
 * at any zoom level, requires zero DOM nodes or canvas bitmaps, and renders in < 0.2ms per page.
 *
 * @param doc jsPDF instance
 * @param x Top-left X coordinate in mm
 * @param y Top-left Y coordinate in mm
 * @param width Target width in mm (height is automatically scaled by 824 / 1768 to preserve exact proportions)
 * @param rgb Fill RGB tuple — e.g. [235, 235, 235] for 8% black on white paper, or [255, 255, 255] for white banner logo
 */
export function drawVectorDottedLogoOnPdf(
  doc: {
    setFillColor: (r: number, g: number, b: number) => void;
    circle: (x: number, y: number, r: number, style?: string) => void;
  },
  x: number,
  y: number,
  width: number,
  rgb: [number, number, number]
): void {
  const scale = width / 1768;
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);

  const boxDotRadius = 9.5 * scale;
  for (const [cx, cy] of BOX_OUTLINE_DOTS) {
    doc.circle(x + cx * scale, y + cy * scale, boxDotRadius, 'F');
  }

  const letterDotRadius = 13 * scale;
  for (const [cx, cy] of BOARDLY_LOGO_DOTS) {
    doc.circle(x + cx * scale, y + cy * scale, letterDotRadius, 'F');
  }
}
