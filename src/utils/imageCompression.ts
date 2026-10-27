/**
 * Client-side Image Compression Utility for Boardly Commons
 * Compresses large images before upload:
 * - Max 1600px on the longest side
 * - Non-blocking with a strict timeout fallback to original file
 * - Uses WebP/JPEG for PNG screenshots (which ignores quality in canvas.toBlob('image/png'))
 * - Skips non-images and GIFs (to preserve animation)
 * - Returns a compressed File object or falls back to original File on any failure/timeout
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
  timeoutMs?: number;
}

/**
 * Checks whether a canvas image contains any non-opaque (transparent) pixels
 * by sampling on a tiny 64x64 offscreen canvas.
 */
function hasTransparentPixels(source: HTMLImageElement | ImageBitmap): boolean {
  try {
    const sampleSize = 64;
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = sampleSize;
    sampleCanvas.height = sampleSize;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return false;
    sampleCtx.drawImage(source, 0, 0, sampleSize, sampleSize);
    const data = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function compressPhotoInternal(
  file: File,
  maxDimension: number,
  quality: number
): Promise<File> {
  return new Promise((resolve) => {
    // Yield to UI thread first so file selection remains non-blocking
    setTimeout(() => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const origWidth = img.naturalWidth || img.width;
          const origHeight = img.naturalHeight || img.height;
          let width = origWidth;
          let height = origHeight;

          // If image is already smaller than maxDimension and size <= 300 KB, keep original
          if (width <= maxDimension && height <= maxDimension && file.size <= 300 * 1024) {
            return resolve(file);
          }

          // Calculate scaled dimensions while preserving aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.max(1, Math.round((height * maxDimension) / width));
              width = maxDimension;
            } else {
              width = Math.max(1, Math.round((width * maxDimension) / height));
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          const isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
          const hasAlpha = isPng ? hasTransparentPixels(img) : false;

          // If opaque PNG screenshot or JPEG, fill white background before drawing so JPEG/WebP has no black artifacts
          if (!hasAlpha) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Note: canvas.toBlob(..., 'image/png', quality) ignores quality and is very slow on screenshots.
          // Use image/webp (supports both alpha and lossy quality) or image/jpeg for opaque images.
          const preferredMime = hasAlpha ? 'image/webp' : 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }

              // If compression didn't reduce file size, keep original file
              if (blob.size >= file.size) {
                return resolve(file);
              }

              const actualMime = blob.type || preferredMime;
              const compressedFile = new File([blob], file.name, {
                type: actualMime,
                lastModified: Date.now(),
              });

              console.log(
                `[ImageCompression] "${file.name}" compressed (${actualMime}): ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB (${width}x${height})`
              );
              resolve(compressedFile);
            },
            preferredMime,
            quality
          );
        } catch (err) {
          console.warn(`[ImageCompression] Error compressing "${file.name}", using original:`, err);
          resolve(file);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(objectUrl);
        console.warn(`[ImageCompression] Failed to decode image "${file.name}", using original:`, err);
        resolve(file);
      };

      img.src = objectUrl;
    }, 0);
  });
}

export async function compressPhoto(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension || 1600;
  const quality = options.quality !== undefined ? options.quality : 0.82;
  const timeoutMs = options.timeoutMs || 4000;

  const isImage =
    file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

  // Skip non-images and GIFs (to preserve animation)
  if (!isImage || file.type === 'image/gif' || /\.gif$/i.test(file.name)) {
    return file;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<File>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `[ImageCompression] Compression timed out after ${timeoutMs}ms for "${file.name}", falling back to original file (${(file.size / 1024).toFixed(1)}KB).`
      );
      resolve(file);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([
      compressPhotoInternal(file, maxDimension, quality),
      timeoutPromise,
    ]);
    return result;
  } catch (err) {
    console.warn(`[ImageCompression] Unexpected error for "${file.name}", falling back to original:`, err);
    return file;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

