import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Ensure PDF.js worker is registered with Vite bundled worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
  totalPages?: number;
  magicHeader?: string;
  fileSizeBytes?: number;
}

/**
 * Validates the raw binary header of a PDF file to check for standard %PDF- magic bytes.
 * Valid PDF files must begin with '%PDF-1.x' or '%PDF-2.x' in the first 1024 bytes
 * and must not be empty or truncated (< 64 bytes).
 */
export function validatePdfMagicBytes(
  data: ArrayBuffer | Uint8Array | Buffer
): { isValid: boolean; error?: string; magicHeader?: string } {
  if (!data) {
    return {
      isValid: false,
      error: 'Upload failed — file appears corrupted, please try again',
    };
  }

  const byteLength = 'byteLength' in data ? data.byteLength : (data as any).length || 0;

  if (byteLength < 64) {
    return {
      isValid: false,
      error: 'Upload failed — file appears corrupted, please try again',
    };
  }

  // Inspect the first 1024 bytes (or full length if smaller)
  const inspectLength = Math.min(1024, byteLength);
  const bytes =
    data instanceof Uint8Array
      ? data.subarray(0, inspectLength)
      : new Uint8Array(data, 0, inspectLength);

  // Convert bytes to string
  let headerText = '';
  for (let i = 0; i < inspectLength; i++) {
    headerText += String.fromCharCode(bytes[i]);
  }

  const pdfIndex = headerText.indexOf('%PDF-');
  if (pdfIndex === -1) {
    return {
      isValid: false,
      error: 'Upload failed — file appears corrupted, please try again',
    };
  }

  const magicHeader = headerText.substring(pdfIndex, Math.min(pdfIndex + 8, headerText.length));

  return {
    isValid: true,
    magicHeader,
  };
}

/**
 * Performs comprehensive client-side PDF verification:
 * 1. Checks minimum size and %PDF- magic byte signature.
 * 2. Parses document tree and cross-reference tables using PDF.js.
 * 3. Attempts to load page 1 to ensure the stream dictionary is valid.
 *
 * If any check fails, returns isValid: false with the required standard error message.
 */
export async function validatePdfFile(
  fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array
): Promise<PdfValidationResult> {
  try {
    let arrayBuffer: ArrayBuffer;
    let byteLength = 0;

    if (fileOrBuffer instanceof File || fileOrBuffer instanceof Blob) {
      byteLength = fileOrBuffer.size;
      if (byteLength < 64) {
        return {
          isValid: false,
          error: 'Upload failed — file appears corrupted, please try again',
          fileSizeBytes: byteLength,
        };
      }
      arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else if (fileOrBuffer instanceof Uint8Array) {
      byteLength = fileOrBuffer.byteLength;
      arrayBuffer = fileOrBuffer.buffer.slice(
        fileOrBuffer.byteOffset,
        fileOrBuffer.byteOffset + fileOrBuffer.byteLength
      );
    } else {
      byteLength = fileOrBuffer.byteLength;
      arrayBuffer = fileOrBuffer;
    }

    // Step 1: Magic Bytes Check
    const magicCheck = validatePdfMagicBytes(arrayBuffer);
    if (!magicCheck.isValid) {
      return {
        isValid: false,
        error: 'Upload failed — file appears corrupted, please try again',
        fileSizeBytes: byteLength,
      };
    }

    // Step 2: Open and parse with PDF.js
    const uint8Data = new Uint8Array(arrayBuffer.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
      enableXfa: false,
      stopAtErrors: true,
    });

    const doc = await loadingTask.promise;

    if (!doc || typeof doc.numPages !== 'number' || doc.numPages < 1) {
      return {
        isValid: false,
        error: 'Upload failed — file appears corrupted, please try again',
        fileSizeBytes: byteLength,
      };
    }

    // Step 3: Test loading the first page to guarantee structure integrity
    try {
      const page1 = await doc.getPage(1);
      if (!page1) {
        return {
          isValid: false,
          error: 'Upload failed — file appears corrupted, please try again',
          fileSizeBytes: byteLength,
        };
      }
    } catch (pageErr) {
      console.warn('[validatePdfFile] Failed to parse page 1 of PDF:', pageErr);
      return {
        isValid: false,
        error: 'Upload failed — file appears corrupted, please try again',
        fileSizeBytes: byteLength,
      };
    }

    return {
      isValid: true,
      totalPages: doc.numPages,
      magicHeader: magicCheck.magicHeader,
      fileSizeBytes: byteLength,
    };
  } catch (err: any) {
    console.warn('[validatePdfFile] PDF validation failed:', err?.message || err);
    return {
      isValid: false,
      error: 'Upload failed — file appears corrupted, please try again',
    };
  }
}
