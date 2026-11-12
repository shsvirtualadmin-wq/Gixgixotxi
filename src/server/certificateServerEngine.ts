/**
 * BOARDLY — SERVER-SIDE CERTIFICATE RENDERER & PRIVATE SIGNATURE PROCESSOR
 *
 * Uses `sharp` and `pdf-lib` on the server to:
 * 1. Process uploaded admin signature images (PNG/JPG/WebP up to 2MB):
 *    - Strip white and near-white backgrounds to full transparency with smooth edge feathering.
 *    - Trim empty transparent margins.
 *    - Export a crisp transparent PNG Buffer for storage in private Cloudflare R2.
 * 2. Render the 1123 x 794 (A4 landscape) Certificate of Excellence from the real HTML/SVG template
 *    into both a high-resolution PNG Buffer and an A4 Landscape PDF Buffer (with frosted glass
 *    and pre-blurred glow layers baked in) for storage in private Cloudflare R2.
 */

import crypto from 'node:crypto';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  CERTIFICATE_WIDTH,
  CERTIFICATE_HEIGHT,
  buildCertificateSvgMarkup,
  buildCertificateHtmlDocument,
  formatCertificateDate,
  formatCertificateScoreText,
  type CertificateRenderInput,
} from '../lib/certificateRenderer';

export const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ProcessedSignatureResult {
  pngBuffer: Buffer;
  width: number;
  height: number;
  dataUrl: string;
}

/**
 * Strips white / near-white backgrounds from an uploaded signature image (PNG, JPG, WebP)
 * and trims empty margins, returning a clean transparent PNG buffer.
 */
export async function processSignatureImageBuffer(
  rawBuffer: Buffer
): Promise<ProcessedSignatureResult> {
  if (!rawBuffer || rawBuffer.byteLength === 0) {
    throw new Error('Signature image buffer is empty.');
  }
  if (rawBuffer.byteLength > MAX_SIGNATURE_BYTES) {
    throw new Error('Signature file exceeds the 2 MB maximum size limit.');
  }

  // Decode into raw RGBA pixels (constraining max working size to 1200x600 for fast processing)
  const { data, info } = await sharp(rawBuffer)
    .rotate()
    .resize({
      width: 1200,
      height: 600,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 12) {
        pixels[idx + 3] = 0;
        continue;
      }

      // Perceived luminance & minimum channel check for white/near-white background removal
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const minChannel = Math.min(r, g, b);

      if (minChannel >= 236 || lum >= 242) {
        // Pure white or near-white paper background -> fully transparent
        pixels[idx + 3] = 0;
        continue;
      } else if (lum >= 205 && minChannel >= 190) {
        // Soft anti-aliased edge feathering between luminance 205..242
        const factor = Math.max(0, Math.min(1, (242 - lum) / 37));
        pixels[idx + 3] = Math.round(a * factor);
      }

      if (pixels[idx + 3] > 18) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If image had no non-white ink strokes, keep centered box so we don't fail on blank canvas test
  if (maxX < minX || maxY < minY) {
    minX = 0;
    minY = 0;
    maxX = Math.max(0, width - 1);
    maxY = Math.max(0, height - 1);
  }

  const pad = 8;
  const cropLeft = Math.max(0, minX - pad);
  const cropTop = Math.max(0, minY - pad);
  const cropWidth = Math.min(width - cropLeft, maxX - minX + 1 + pad * 2);
  const cropHeight = Math.min(height - cropTop, maxY - minY + 1 + pad * 2);

  const croppedPng = await sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .extract({
      left: cropLeft,
      top: cropTop,
      width: Math.max(1, cropWidth),
      height: Math.max(1, cropHeight),
    })
    .resize({
      width: 480,
      height: 160,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });

  return {
    pngBuffer: croppedPng.data,
    width: croppedPng.info.width,
    height: croppedPng.info.height,
    dataUrl: `data:image/png;base64,${croppedPng.data.toString('base64')}`,
  };
}

/**
 * Renders the Certificate of Excellence on the server from the real HTML/SVG template
 * into both a 1123x794 PNG Buffer and an A4 Landscape (1123x794) PDF Buffer.
 */
export async function renderCertificateFilesOnServer(
  input: CertificateRenderInput
): Promise<{
  pngBuffer: Buffer;
  pdfBuffer: Buffer;
  htmlString: string;
}> {
  const htmlString = buildCertificateHtmlDocument(input);
  const svgString = buildCertificateSvgMarkup(input);

  // 1. Render 1123 x 794 PNG from the SVG/HTML template via sharp
  const pngBuffer = await sharp(Buffer.from(svgString, 'utf8'), { density: 144 })
    .resize(CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 9, quality: 100 })
    .toBuffer();

  // 2. Build A4 Landscape (1123 x 794) PDF containing the high-res rendered certificate
  //    plus embedded searchable text metadata for serial, student name, mock title, and verify URL.
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Boardly Certificate of Excellence — ${input.serial}`);
  pdfDoc.setAuthor('Boardly (boardly.cfd)');
  pdfDoc.setSubject(
    `1st Position in ${input.grandLineTitle} — Awarded to ${input.studentName}`
  );
  pdfDoc.setKeywords([
    'Boardly',
    'Grand Line Mock',
    '1st Position',
    input.serial,
    input.studentName,
    input.grandLineTitle,
  ]);
  pdfDoc.setProducer('Boardly Certificate Engine');
  pdfDoc.setCreator('Boardly (boardly.cfd)');

  const page = pdfDoc.addPage([CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Write searchable text layer underneath so PDF readers/parsers can index serial, student, mock, and verify URL
  const verifyBase = (input.verifyBaseUrl || 'https://boardly.cfd').replace(/\/+$/, '');
  const verifyUrl = `${verifyBase}/verify/${input.serial}`;
  const scoreText = formatCertificateScoreText(input);
  const dateText = formatCertificateDate(input.issuedAt);

  page.drawText(`BOARDLY CERTIFICATE OF EXCELLENCE - 1ST POSITION`, {
    x: 104,
    y: 700,
    size: 10,
    font: fontMono,
    color: rgb(0.5, 0.5, 0.5),
    opacity: 0.01,
  });
  page.drawText(`Student: ${input.studentName}`, {
    x: 104,
    y: 680,
    size: 12,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.5),
    opacity: 0.01,
  });
  page.drawText(
    `Mock: ${input.grandLineTitle} | Score: ${scoreText} | Participants: ${input.participantsCount}`,
    {
      x: 104,
      y: 660,
      size: 10,
      font: fontBold,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.01,
    }
  );
  page.drawText(
    `Serial: ${input.serial} | Date: ${dateText} | Verify: ${verifyUrl} | Authorised by: ${
      input.signatoryName || 'Boardly'
    } (${input.signatoryTitle || 'Founder, Boardly'})`,
    {
      x: 104,
      y: 640,
      size: 10,
      font: fontMono,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.01,
    }
  );

  // Draw the full 1123 x 794 high-res certificate image (with frosted glass, blurred glows, signature, and QR)
  const embeddedPng = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(embeddedPng, {
    x: 0,
    y: 0,
    width: CERTIFICATE_WIDTH,
    height: CERTIFICATE_HEIGHT,
  });

  const pdfBytes = await pdfDoc.save();
  return {
    pngBuffer,
    pdfBuffer: Buffer.from(pdfBytes),
    htmlString,
  };
}

/**
 * Generates or verifies a short-lived HMAC-SHA256 signed download token for certificate PDF/PNG links
 * (used for email PNG previews and temporary Share links without ever making R2 files public).
 */
export function createSignedCertificateDownloadToken(params: {
  certificateId: string;
  format: 'pdf' | 'png';
  expiresAtMs?: number;
  secret?: string;
}): { token: string; exp: number } {
  const exp = params.expiresAtMs || Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days for email preview/share
  const secret = (params.secret || process.env.INTERNAL_EMAIL_SECRET || 'boardly_cert_hmac_v1').trim();
  const payload = `${params.certificateId}:${params.format}:${exp}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return { token: sig, exp };
}

export function verifySignedCertificateDownloadToken(params: {
  certificateId: string;
  format: 'pdf' | 'png';
  token: string;
  exp: number | string;
  secret?: string;
}): boolean {
  const expNum = Number(params.exp || 0);
  if (!Number.isFinite(expNum) || expNum < Date.now()) {
    return false;
  }
  const cleanToken = String(params.token || '').trim();
  if (!cleanToken) return false;
  const secret = (params.secret || process.env.INTERNAL_EMAIL_SECRET || 'boardly_cert_hmac_v1').trim();
  const payload = `${params.certificateId}:${params.format}:${expNum}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected));
  } catch {
    return false;
  }
}
