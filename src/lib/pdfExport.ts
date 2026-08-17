import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use Vite bundled worker for instant local loading and exact version compatibility
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfExportOptions {
  pageNumber?: number;
  scale?: number; // default 2.5 for crisp high-resolution export
}

/**
 * Resolves any raw PDF storage URL (e.g. Cloudflare R2, Supabase, Google Drive)
 * to a CORS-safe proxy URL so that client-side fetch and PDF.js can load it without CORS blocks.
 */
export function resolveProxyPdfUrl(originalUrl: string): string {
  if (!originalUrl || typeof originalUrl !== 'string') return '';
  const trimmed = originalUrl.trim();

  // If already proxied, return as-is
  if (trimmed.startsWith('/api/resources/proxy') || trimmed.includes('/api/resources/proxy?url=')) {
    return trimmed;
  }

  // If relative URL (same-origin), return as-is
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  // If absolute cross-origin URL (e.g. pub-*.r2.dev, cloudflare, s3, etc.), wrap in proxy
  try {
    const parsed = new URL(trimmed);
    // If same origin as current browser window, don't proxy unless it's an external bucket
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return trimmed;
    }
    return `/api/resources/proxy?url=${encodeURIComponent(trimmed)}`;
  } catch {
    return `/api/resources/proxy?url=${encodeURIComponent(trimmed)}`;
  }
}

/**
 * Fetches PDF binary bytes with fallback between direct storage URL and verified proxy,
 * strictly verifying that the response is true binary PDF (%PDF-) and not an HTML SPA fallback.
 */
export async function fetchPdfBinary(fileUrl: string): Promise<Uint8Array> {
  if (!fileUrl || typeof fileUrl !== 'string') {
    throw new Error('Invalid or empty file URL provided.');
  }

  const rawUrl = fileUrl.trim();
  const candidateUrls: string[] = [];

  // 1. If it's a direct URL (e.g. pub-*.r2.dev, cloudflare, s3, relative /api/drive-file), prioritize direct fetch
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('/')) {
    candidateUrls.push(rawUrl);
  }

  // 2. Add proxied URL candidate for CORS safety
  const proxiedUrl = resolveProxyPdfUrl(rawUrl);
  if (proxiedUrl && !candidateUrls.includes(proxiedUrl)) {
    candidateUrls.push(proxiedUrl);
  }

  let lastError: any = null;

  for (let i = 0; i < candidateUrls.length; i++) {
    const url = candidateUrls[i];
    try {
      console.log(`[PDF Fetch Attempt ${i + 1}/${candidateUrls.length}] Requesting binary from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf,application/octet-stream,*/*',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} (${response.statusText})`);
      }

      // Check Content-Type if present
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html')) {
        throw new Error('Received HTML document instead of PDF binary (possible SPA fallback or redirect loop).');
      }

      const buffer = await response.arrayBuffer();
      if (!buffer || buffer.byteLength < 32) {
        throw new Error(`Received incomplete or truncated binary payload (${buffer?.byteLength || 0} bytes).`);
      }

      const uint8 = new Uint8Array(buffer);

      // Verify that this buffer contains the %PDF- magic signature in the first 1024 bytes
      const inspectLimit = Math.min(1024, uint8.byteLength);
      let headerAscii = '';
      for (let j = 0; j < inspectLimit; j++) {
        headerAscii += String.fromCharCode(uint8[j]);
      }

      const pdfIndex = headerAscii.indexOf('%PDF-');
      if (pdfIndex === -1) {
        const preview = headerAscii.substring(0, 64).replace(/[\r\n\t]+/g, ' ');
        throw new Error(`Payload does not contain %PDF- magic signature (preview: "${preview}").`);
      }

      // Extract first 8 bytes for logging
      const first8Ascii = Array.from(uint8.subarray(0, 8))
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('');
      const first8Hex = Array.from(uint8.subarray(0, 8))
        .map((b) => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
        .join(', ');

      console.log(
        `%c[PDF Fetch SUCCESS] Fetched ${uint8.byteLength.toLocaleString()} bytes. First 8 bytes: "${first8Ascii}" | Hex: [${first8Hex}] from: ${url}`,
        'color: #10b981; font-weight: bold;'
      );

      return uint8;
    } catch (err: any) {
      console.warn(`[PDF Fetch Attempt ${i + 1} Failed] ${url}:`, err?.message || err);
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message || "Couldn't fetch PDF document from storage. Please verify file availability."
  );
}

/**
 * Loads a PDF document and renders the specified page (or page 1) to a high-resolution canvas,
 * then returns a data URL or triggers a download.
 */
export async function exportPdfPageToImage(
  pdfUrl: string,
  pageNumber = 1,
  scale = 2.5
): Promise<{ dataUrl: string; width: number; height: number; totalPages: number }> {
  const pdfBytes = await fetchPdfBinary(pdfUrl);

  const loadingTask = pdfjsLib.getDocument({
    data: pdfBytes,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
    enableXfa: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const targetPageNumber = Math.min(Math.max(1, pageNumber), totalPages);
  const page = await pdf.getPage(targetPageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    throw new Error('Canvas 2D context is not available');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill background with clean white for sharp document print fidelity
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    canvas: canvas,
    viewport: viewport,
  };

  await page.render(renderContext as any).promise;

  const dataUrl = canvas.toDataURL('image/png', 1.0);
  return { dataUrl, width: canvas.width, height: canvas.height, totalPages };
}

/**
 * Opens a PDF document URL in the user's default system external browser (Chrome/Safari/Edge/etc.)
 * bypassing in-app webviews or embedded iframe containers.
 */
export function openExternalPdfBrowser(fileUrl: string) {
  if (!fileUrl) return;
  const rawUrl = fileUrl.trim();

  try {
    // 1. Direct window.open with _blank and security attributes
    const opened = window.open(rawUrl, '_blank', 'noopener,noreferrer');
    
    // 2. If popup blocked or within strict webview, simulate standard user link click
    if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = rawUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  } catch (err) {
    console.error('[openExternalPdfBrowser] Failed to open external browser:', err);
    try {
      const anchor = document.createElement('a');
      anchor.href = rawUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      window.location.href = rawUrl;
    }
  }
}

/**
 * Forces a real native file download of a PDF document using Blob + URL.createObjectURL(),
 * ensuring the browser / OS prompts the native download manager (e.g. Android "Open with / Save to Drive")
 * instead of navigating to or opening a new browser tab.
 */
export async function downloadPdfDocument(fileUrl: string, title: string): Promise<void> {
  if (!fileUrl) {
    throw new Error('No document URL provided for download.');
  }

  // 1. Format clean filename and ensure .pdf extension
  let safeTitle = (title || 'document').trim().replace(/[/\\?%*:|"<>]/g, '_');
  if (!safeTitle.toLowerCase().endsWith('.pdf')) {
    safeTitle += '.pdf';
  }

  try {
    // 2. Fetch the true binary bytes using our robust fetchPdfBinary helper (which handles directs, CORS proxy, and verifies %PDF-)
    const pdfBytes = await fetchPdfBinary(fileUrl);
    
    // 3. Create a same-origin Blob with MIME type application/pdf
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    // 4. Create and trigger a programmatic anchor click with the download attribute
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeTitle;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 5. Cleanup the object URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (err: any) {
    console.warn('[downloadPdfDocument] Blob download failed, falling back to direct attachment link:', err);
    // Fallback: Trigger download via backend proxy endpoint with Content-Disposition: attachment
    const encodedUrl = encodeURIComponent(fileUrl);
    const encodedName = encodeURIComponent(safeTitle);
    const proxyDownloadUrl = `/api/resources/proxy?url=${encodedUrl}&download=1&filename=${encodedName}`;
    
    const fallbackLink = document.createElement('a');
    fallbackLink.href = proxyDownloadUrl;
    fallbackLink.download = safeTitle;
    fallbackLink.target = '_self';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.style.display = 'none';
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}

/**
 * Downloads a rendered data URL as a PNG file.
 */
export function downloadDataUrlAsFile(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
