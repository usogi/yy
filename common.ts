export const uid = (): string => Math.random().toString(36).substring(2, 11);

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
}

export function imageElementToBase64(img: HTMLImageElement, mimeType: string = 'image/png'): { base64: string; mimeType: string } {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0);
    
    // Use the provided mimeType to preserve original format, default to PNG.
    const dataUrl = canvas.toDataURL(mimeType); 
    const base64 = dataUrl.split(',')[1];
    
    return { base64, mimeType };
}

/**
 * Performs an in-memory crop of an HTMLImageElement and returns a new cropped image as a base64 string.
 * @param img The source image element.
 * @param crop The crop box in absolute pixel values.
 * @param mimeType The desired output MIME type.
 * @returns A base64 string of the cropped image.
 */
export function cropImageElement(img: HTMLImageElement, crop: { x: number; y: number; w: number; h: number }, mimeType: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = crop.w;
    canvas.height = crop.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context for cropping');
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    return canvas.toDataURL(mimeType).split(',')[1];
}


/**
 * Applies an advanced enhancement pipeline to an image blob.
 * @param blob The input image blob.
 * @returns A promise that resolves to the enhanced image blob (always PNG).
 */
export async function enhanceImage(blob: Blob): Promise<Blob> {
    let img = await loadImage(URL.createObjectURL(blob));
    URL.revokeObjectURL(img.src);

    let canvas = document.createElement('canvas');
    let w = img.width;
    let h = img.height;
    canvas.width = w;
    canvas.height = h;
    
    let ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get canvas context for enhancement');

    // Step 1: Adaptive Upscaling (Simulating Real-ESRGAN for small images)
    const upscaleFactor = 2;
    if (h < 512 || w < 512) {
        const upscaledCanvas = document.createElement('canvas');
        const upscaledW = w * upscaleFactor;
        const upscaledH = h * upscaleFactor;
        upscaledCanvas.width = upscaledW;
        upscaledCanvas.height = upscaledH;
        const upscaledCtx = upscaledCanvas.getContext('2d');
        if (!upscaledCtx) throw new Error('Could not get canvas context for upscaling');
        
        // Use high-quality resampling, equivalent to Lanczos interpolation for browsers
        upscaledCtx.imageSmoothingEnabled = true;
        upscaledCtx.imageSmoothingQuality = 'high';
        upscaledCtx.drawImage(img, 0, 0, upscaledW, upscaledH);
        
        // The upscaled canvas becomes the new source
        canvas = upscaledCanvas;
        ctx = upscaledCtx;
        w = upscaledW;
        h = upscaledH;
    } else {
        // If not upscaling, draw the original image to the main canvas
        ctx.drawImage(img, 0, 0);
    }
    
    let imageData = ctx.getImageData(0, 0, w, h);
    let data = imageData.data;

    // Step 2: Apply sharpening using a convolution kernel
    const sharpenedData = new Uint8ClampedArray(data.length);
    const kernel = [
         0, -1,  0,
        -1,  5, -1,
         0, -1,  0
    ];
    
    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) { // For R, G, B channels
            let sum = 0;
            for (let k = -1; k <= 1; k++) {
                for (let l = -1; l <= 1; l++) {
                    const x = (i/4) % w + l;
                    const y = Math.floor((i/4) / w) + k;
                    if (x >= 0 && x < w && y >= 0 && y < h) {
                        const p = (y * w + x) * 4;
                        sum += data[p + c] * kernel[(k+1) * 3 + (l+1)];
                    }
                }
            }
            sharpenedData[i + c] = Math.max(0, Math.min(255, sum));
        }
        sharpenedData[i + 3] = data[i + 3]; // Alpha channel
    }
    data = sharpenedData;
    
    // Step 3: Apply contrast and brightness adjustments
    const alpha = 1.05; // Contrast
    const beta = 10;    // Brightness
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, alpha * data[i] + beta));
        data[i+1] = Math.max(0, Math.min(255, alpha * data[i+1] + beta));
        data[i+2] = Math.max(0, Math.min(255, alpha * data[i+2] + beta));
    }
    
    ctx.putImageData(new ImageData(data, w, h), 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(resultBlob => {
            if (resultBlob) {
                resolve(resultBlob);
            } else {
                reject(new Error('Failed to create blob from enhanced canvas.'));
            }
        }, 'image/png', 1); // Export as high-quality PNG
    });
}
