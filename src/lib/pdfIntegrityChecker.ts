import { fetchPdfBinary } from './pdfExport';
import { validatePdfFile, validatePdfMagicBytes, PdfValidationResult } from './pdfValidator';
import { ResourceItem } from '../types';

export interface IntegrityCheckItem {
  id: string;
  title: string;
  category?: string;
  subject?: string;
  targetClass?: string;
  fileUrl: string;
  fileSize?: string | number;
  status: 'healthy' | 'corrupted' | 'unreachable';
  errorDetails?: string;
  totalPages?: number;
  magicHeader?: string;
  checkedAt: string;
  durationMs: number;
}

export interface LibraryIntegrityReport {
  timestamp: string;
  totalScanned: number;
  healthyCount: number;
  corruptedCount: number;
  unreachableCount: number;
  items: IntegrityCheckItem[];
  corruptedItems: IntegrityCheckItem[];
}

/**
 * Checks the integrity of a single stored PDF file by downloading and verifying its binary structure.
 */
export async function checkSinglePdfIntegrity(
  fileUrl: string,
  metadata?: { id?: string; title?: string; category?: string; subject?: string; targetClass?: string; size?: string | number }
): Promise<IntegrityCheckItem> {
  const startTime = Date.now();
  const id = metadata?.id || fileUrl;
  const title = metadata?.title || 'Untitled PDF';

  if (!fileUrl) {
    return {
      id,
      title,
      category: metadata?.category,
      subject: metadata?.subject,
      targetClass: metadata?.targetClass,
      fileUrl: '',
      fileSize: metadata?.size,
      status: 'unreachable',
      errorDetails: 'Missing file URL',
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  try {
    const bytes = await fetchPdfBinary(fileUrl);
    const durationFetch = Date.now() - startTime;

    if (!bytes || bytes.byteLength === 0) {
      return {
        id,
        title,
        category: metadata?.category,
        subject: metadata?.subject,
        targetClass: metadata?.targetClass,
        fileUrl,
        fileSize: metadata?.size,
        status: 'corrupted',
        errorDetails: 'File in storage is 0 bytes (empty file)',
        checkedAt: new Date().toISOString(),
        durationMs: durationFetch,
      };
    }

    // Step 1: Magic Bytes Check
    const magicCheck = validatePdfMagicBytes(bytes);
    if (!magicCheck.isValid) {
      return {
        id,
        title,
        category: metadata?.category,
        subject: metadata?.subject,
        targetClass: metadata?.targetClass,
        fileUrl,
        fileSize: metadata?.size || `${(bytes.byteLength / 1024).toFixed(1)} KB`,
        status: 'corrupted',
        errorDetails: 'Invalid PDF header: missing %PDF- magic bytes (corrupted upload)',
        checkedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }

    // Step 2: PDF.js Structure Check
    const validation: PdfValidationResult = await validatePdfFile(bytes);
    const totalDuration = Date.now() - startTime;

    if (!validation.isValid) {
      return {
        id,
        title,
        category: metadata?.category,
        subject: metadata?.subject,
        targetClass: metadata?.targetClass,
        fileUrl,
        fileSize: metadata?.size || `${(bytes.byteLength / 1024).toFixed(1)} KB`,
        status: 'corrupted',
        errorDetails: validation.error || 'Invalid PDF structure: file corrupted during upload',
        checkedAt: new Date().toISOString(),
        durationMs: totalDuration,
      };
    }

    return {
      id,
      title,
      category: metadata?.category,
      subject: metadata?.subject,
      targetClass: metadata?.targetClass,
      fileUrl,
      fileSize: metadata?.size || `${(bytes.byteLength / 1024).toFixed(1)} KB`,
      status: 'healthy',
      totalPages: validation.totalPages,
      magicHeader: validation.magicHeader,
      checkedAt: new Date().toISOString(),
      durationMs: totalDuration,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network / Storage access error';
    const isCorrupted = errorMsg.includes('Invalid PDF') || errorMsg.includes('PDF structure') || errorMsg.includes('empty');

    return {
      id,
      title,
      category: metadata?.category,
      subject: metadata?.subject,
      targetClass: metadata?.targetClass,
      fileUrl,
      fileSize: metadata?.size,
      status: isCorrupted ? 'corrupted' : 'unreachable',
      errorDetails: errorMsg,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Runs a background or on-demand library-wide integrity scan across all resources.
 * Supports concurrent batching and live progress callback.
 */
export async function runLibraryIntegrityScan(
  resources: Array<{ id: string; title: string; file_url: string; category?: string; subject?: string; class?: string; file_size?: string; size?: number | string }>,
  options?: {
    concurrency?: number;
    onProgress?: (scanned: number, total: number, current: IntegrityCheckItem) => void;
    signal?: AbortSignal;
  }
): Promise<LibraryIntegrityReport> {
  const total = resources.length;
  const concurrency = options?.concurrency || 3;
  const results: IntegrityCheckItem[] = [];

  let currentIndex = 0;

  async function worker() {
    while (currentIndex < total) {
      if (options?.signal?.aborted) break;
      const index = currentIndex++;
      const res = resources[index];
      if (!res) continue;

      const checkResult = await checkSinglePdfIntegrity(res.file_url, {
        id: res.id,
        title: res.title,
        category: res.category,
        subject: res.subject,
        targetClass: res.class,
        size: res.file_size || res.size,
      });

      results.push(checkResult);
      if (options?.onProgress) {
        options.onProgress(results.length, total, checkResult);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const corruptedItems = results.filter(r => r.status === 'corrupted');
  const corruptedCount = corruptedItems.length;
  const unreachableCount = results.filter(r => r.status === 'unreachable').length;

  return {
    timestamp: new Date().toISOString(),
    totalScanned: results.length,
    healthyCount,
    corruptedCount,
    unreachableCount,
    items: results,
    corruptedItems,
  };
}
