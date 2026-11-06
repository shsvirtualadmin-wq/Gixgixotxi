import { OgCardOptions } from './ogCardRenderer';
import { cleanPreviewText, normalizePreviewTitle, truncateAtWordBoundary } from './sharePreviewHelper';

/**
 * 5x7 dot-matrix bitmap glyphs for uppercase ASCII, digits, and punctuation.
 * Each glyph is 5 columns wide by 7 rows tall (row-major 5-bit masks).
 */
const GLYPHS_5X7: Record<string, number[]> = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b10010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  '3': [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  '5': [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b00001, 0b11110],
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  '.': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  ',': [0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
  ':': [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  '-': [0b00000, 0b00000, 0b00000, 0b11111, 0b00000, 0b00000, 0b00000],
  '|': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  '/': [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  '&': [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  '@': [0b01110, 0b10001, 0b10111, 0b10101, 0b10111, 0b10000, 0b01110],
  '(': [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ')': [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  '!': [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '?': [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  "'": [0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
};

function wrapPlainLines(text: string, maxCols: number, maxLines: number): string[] {
  const cleaned = cleanPreviewText(text, { stripUrls: true })
    .replace(/…/g, '...')
    .replace(/[·•–—]/g, '-')
    .toUpperCase();
  if (!cleaned) return [];

  const words = cleaned.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCols) {
      current = next;
    } else {
      if (lines.length === maxLines - 1) {
        const rest = [current, ...words.slice(i)].filter(Boolean).join(' ');
        lines.push(truncateAtWordBoundary(rest, maxCols).replace(/…/g, '...'));
        return lines;
      }
      if (current) {
        lines.push(current);
        current = word.slice(0, maxCols);
      } else {
        lines.push(word.slice(0, maxCols));
        current = '';
      }
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makePngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i);
  }
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  view.setUint32(8 + data.length, crc, false);
  return chunk;
}

async function deflateBytes(raw: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  await writer.write(raw);
  await writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Pure Web-API 1200x630 indexed-color PNG generator for Cloudflare Workers / Pages Functions
 * where native C++ `sharp` is unavailable. Produces a crisp Nothing OS dot-matrix share card.
 */
export async function renderBoardlyOgCardPngEdge(options: OgCardOptions): Promise<Uint8Array> {
  const width = 1200;
  const height = 630;

  // Palette (8-bit indexed PNG -> tiny, fast to encode):
  // 0: #07070A (background)
  // 1: #121218 (card interior)
  // 2: #27272A (grid / border)
  // 3: #D71921 (Boardly red accent)
  // 4: #FFFFFF (bright white title text)
  // 5: #A1A1AA (muted zinc subtitle text)
  const palette = new Uint8Array([
    0x07, 0x07, 0x0a,
    0x12, 0x12, 0x18,
    0x27, 0x27, 0x2a,
    0xd7, 0x19, 0x21,
    0xff, 0xff, 0xff,
    0xa1, 0xa1, 0xaa,
  ]);

  // Each scanline has 1 filter byte (0) + 1200 palette index bytes
  const stride = width + 1;
  const raw = new Uint8Array(stride * height);

  const setPixel = (x: number, y: number, colorIdx: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    raw[y * stride + 1 + x] = colorIdx;
  };

  const fillRect = (x0: number, y0: number, w: number, h: number, colorIdx: number) => {
    const xStart = Math.max(0, x0);
    const yStart = Math.max(0, y0);
    const xEnd = Math.min(width, x0 + w);
    const yEnd = Math.min(height, y0 + h);
    for (let y = yStart; y < yEnd; y++) {
      const rowOffset = y * stride + 1;
      raw.fill(colorIdx, rowOffset + xStart, rowOffset + xEnd);
    }
  };

  // Card background & border
  fillRect(0, 0, width, 8, 3); // Red top bar
  fillRect(36, 36, 1128, 558, 2); // Card border
  fillRect(38, 38, 1124, 554, 1); // Card inner

  // Subtle dot grid inside card
  for (let y = 56; y < 576; y += 28) {
    for (let x = 56; x < 1144; x += 28) {
      setPixel(x, y, 2);
      setPixel(x + 1, y, 2);
      setPixel(x, y + 1, 2);
    }
  }

  const drawText = (text: string, startX: number, startY: number, scale: number, colorIdx: number) => {
    const upper = text.toUpperCase();
    let cursorX = startX;
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      const glyph = GLYPHS_5X7[ch] || GLYPHS_5X7[' '];
      for (let r = 0; r < 7; r++) {
        const rowBits = glyph[r];
        for (let c = 0; c < 5; c++) {
          if ((rowBits >> (4 - c)) & 1) {
            fillRect(cursorX + c * scale, startY + r * scale, scale - (scale >= 5 ? 1 : 0), scale - (scale >= 5 ? 1 : 0), colorIdx);
          }
        }
      }
      cursorX += 6 * scale;
    }
  };

  const type = String(options.type || 'default').toLowerCase();
  const badge = cleanPreviewText(
    options.badge ||
      (type === 'test'
        ? 'GRAND LINE VERIFIED TEST'
        : type === 'post'
          ? 'BOARDLY COMMONS'
          : type === 'profile'
            ? 'BOARDLY STUDENT PROFILE'
            : 'BOARDLY ACADEMIC ARENA'),
    { maxChars: 38, stripUrls: true }
  );

  // Badge pill
  fillRect(80, 82, 16, 24, 3);
  drawText(badge, 108, 84, 3, 4);

  // Main Title
  const cleanTitle = normalizePreviewTitle(options.title || 'Boardly', { maxChars: 84 }) || 'Boardly';
  const titleLines = wrapPlainLines(cleanTitle, 28, 3);
  const titleScale = titleLines.length >= 3 ? 5 : 6;
  const titleYStart = titleLines.length >= 3 ? 175 : 195;
  titleLines.forEach((line, idx) => {
    drawText(line, 80, titleYStart + idx * (titleScale * 9 + 14), titleScale, 4);
  });

  // Subtitle
  const subtitle = cleanPreviewText(
    options.subtitle || 'Take this verified test and see where you rank on the national leaderboard.',
    { maxChars: 110, stripUrls: true }
  );
  const subLines = wrapPlainLines(subtitle, 54, 2);
  const subYStart = titleYStart + titleLines.length * (titleScale * 9 + 14) + 22;
  subLines.forEach((line, idx) => {
    drawText(line, 80, subYStart + idx * 32, 3, 5);
  });

  // Bottom divider & meta
  fillRect(80, 500, 1040, 2, 2);
  fillRect(80, 526, 10, 24, 3);
  const meta = cleanPreviewText(options.meta || 'BOARDLY.CFD', { maxChars: 48, stripUrls: true });
  drawText(meta, 102, 528, 3, 5);

  // Bottom right BOARDLY logo
  fillRect(940, 518, 36, 36, 3);
  drawText('B', 951, 526, 3, 4);
  drawText('BOARDLY', 990, 526, 3, 4);

  const compressed = await deflateBytes(raw);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8; // bit depth 8
  ihdr[9] = 3; // color type 3 = indexed palette
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makePngChunk('IHDR', ihdr);
  const plteChunk = makePngChunk('PLTE', palette);
  const idatChunk = makePngChunk('IDAT', compressed);
  const iendChunk = makePngChunk('IEND', new Uint8Array(0));

  const totalLen =
    signature.length + ihdrChunk.length + plteChunk.length + idatChunk.length + iendChunk.length;
  const png = new Uint8Array(totalLen);
  let pos = 0;
  for (const part of [signature, ihdrChunk, plteChunk, idatChunk, iendChunk]) {
    png.set(part, pos);
    pos += part.length;
  }
  return png;
}
