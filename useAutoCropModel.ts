
import { useState, useCallback } from 'react';
import { suggestCropWithEdgeDetection } from '../services/localSmartCrop';
import type { CropBox } from '../types';

export function useAutoCropModel() {
  const [isModelReady, setIsModelReady] = useState(true); // Always ready for local processing

  const predict = useCallback(async (img: HTMLImageElement): Promise<CropBox> => {
    if (!isModelReady) {
      throw new Error("Processing engine is not ready.");
    }

    const { naturalWidth: w, naturalHeight: h } = img;
    const fallbackCrop = { x: 0, y: 0, w: w, h: h };

    // Call the local service to get crop coordinates
    const suggestedCrop = await suggestCropWithEdgeDetection(img);

    if (!suggestedCrop) {
      console.warn("Local edge detection did not return a valid crop, using fallback.");
      return fallbackCrop;
    }
    
    // Ensure the crop dimensions are valid
    if (suggestedCrop.w <= 0 || suggestedCrop.h <= 0) {
        console.error("Invalid crop dimensions returned, using fallback.");
        return fallbackCrop;
    }

    // Add a small margin for better aesthetics, but ensure it stays within bounds
    const padding = Math.min(suggestedCrop.w, suggestedCrop.h) * 0.02;
    const finalCrop: CropBox = {
        x: Math.max(0, Math.round(suggestedCrop.x - padding)),
        y: Math.max(0, Math.round(suggestedCrop.y - padding)),
        w: Math.round(suggestedCrop.w + padding * 2),
        h: Math.round(suggestedCrop.h + padding * 2),
    };
    
    // Final check to ensure the padded crop does not exceed image boundaries
    if (finalCrop.x + finalCrop.w > w) {
        finalCrop.w = w - finalCrop.x;
    }
    if (finalCrop.y + finalCrop.h > h) {
        finalCrop.h = h - finalCrop.y;
    }

    return finalCrop;
  }, [isModelReady]);

  return { isModelReady, predict };
}