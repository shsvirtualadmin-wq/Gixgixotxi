/**
 * Client-side Image Compression Utility for Boardly Commons
 * Compresses large images before upload:
 * - Max 1600px on the longest side
 * - JPEG quality ~ 0.8 (or preserve PNG if transparent)
 * - Skips non-images and GIFs (to preserve animation)
 * - Returns a compressed File object with updated size and name
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

export async function compressPhoto(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension || 1600;
  const quality = options.quality !== undefined ? options.quality : 0.8;

  // Only compress images; skip GIFs to avoid losing animated frames
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // If image is already smaller than maxDimension and size < 500 KB, keep original
      if (width <= maxDimension && height <= maxDimension && file.size <= 500 * 1024) {
        return resolve(file);
      }

      // Calculate scaled dimensions while preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output mime type
      const isPng = file.type === 'image/png';
      // For photos without transparency, JPEG provides superior compression
      const outputMime = isPng ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // If compression didn't save bytes and dimensions were unchanged, keep original
          if (blob.size >= file.size && width === img.width && height === img.height) {
            return resolve(file);
          }

          const extension = outputMime === 'image/jpeg' ? '.jpg' : '.png';
          const newName = file.name.replace(/\.[^.]+$/, '') + extension;

          const compressedFile = new File([blob], newName, {
            type: outputMime,
            lastModified: Date.now(),
          });

          console.log(
            `[ImageCompression] "${file.name}" compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(compressedFile.size / 1024).toFixed(0)}KB (${width}x${height})`
          );
          resolve(compressedFile);
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.warn(`[ImageCompression] Failed to load image "${file.name}" for compression, using original`);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
