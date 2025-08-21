/**
 * Utility functions for image resizing
 */

interface ResizeOptions {
  width: number;
  height: number;
  quality?: number;
  format?: string;
}

/**
 * Resize an image file to specified dimensions
 * @param file - The image file to resize
 * @param options - Resize options including width, height, quality, and format
 * @returns Promise<File> - The resized image as a File object
 */
export const resizeImage = async (
  file: File,
  options: ResizeOptions
): Promise<File> => {
  const { width, height, quality = 0.9, format = 'image/jpeg' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Calculate aspect ratios
      const imgAspect = img.width / img.height;
      const targetAspect = width / height;

      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      // Crop to fit (maintain aspect ratio, fill entire canvas)
      if (imgAspect > targetAspect) {
        // Image is wider than target - crop width
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        // Image is taller than target - crop height
        drawHeight = width / imgAspect;
        offsetY = (height - drawHeight) / 2;
      }

      // Fill with white background (important for transparent images)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw the image
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a new File from the blob
            const resizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Calculate aspect ratios for cropping
      const imgAspect = img.width / img.height;
      const targetAspect = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // Crop to maintain aspect ratio
      if (imgAspect > targetAspect) {
        // Image is wider - crop from sides
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller - crop from top/bottom
        sourceHeight = img.width / targetAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw cropped image to fit exactly
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, width, height
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        format,
        quality
      );
    };
  });
};

/**
 * Resize image for talent headshots (400x400px)
 * @param file - The image file to resize
 * @returns Promise<File> - The resized image optimized for talent headshots
 */
export const resizeTalentHeadshot = (file: File): Promise<File> => {
  return resizeImage(file, {
    width: 400,
    height: 400,
    quality: 0.9,
    format: 'image/jpeg'
  });
};