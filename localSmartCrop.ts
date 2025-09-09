import type { CropBox } from '../types';

/**
 * Converts image data to grayscale.
 * @param imageData The original color image data.
 * @returns A new object containing grayscale pixel data.
 */
function toGrayscale(imageData: ImageData): { data: Uint8ClampedArray, width: number, height: number } {
    const { data, width, height } = imageData;
    const grayData = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i+1] + data[i+2]) / 3;
        grayData[i / 4] = avg;
    }
    return { data: grayData, width, height };
}

/**
 * Applies a Gaussian blur to grayscale image data.
 * This is a simplified implementation.
 * @param gray A grayscale image data object.
 * @returns A new object with the blurred grayscale data.
 */
function gaussianBlur(gray: { data: Uint8ClampedArray, width: number, height: number }): { data: Uint8ClampedArray, width: number, height: number } {
    const { data, width, height } = gray;
    const blurredData = new Uint8ClampedArray(width * height);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1]; // 3x3 kernel
    const kernelWeight = 16;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const val = data[(y + ky) * width + (x + kx)];
                    const weight = kernel[(ky + 1) * 3 + (kx + 1)];
                    sum += val * weight;
                }
            }
            blurredData[y * width + x] = sum / kernelWeight;
        }
    }
    return { data: blurredData, width, height };
}

/**
 * A simplified Canny edge detector using Sobel operator and thresholding.
 * @param gray A blurred, grayscale image data object.
 * @param threshold The sensitivity threshold for edge detection.
 * @returns A binary image data object with detected edges.
 */
function cannyEdgeDetector(gray: { data: Uint8ClampedArray, width: number, height: number }, threshold: number): { data: Uint8ClampedArray, width: number, height: number } {
    const { data, width, height } = gray;
    const edgeData = new Uint8ClampedArray(width * height).fill(0);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const val = data[(y + ky) * width + (x + kx)];
                    gx += val * sobelX[(ky + 1) * 3 + (kx + 1)];
                    gy += val * sobelY[(ky + 1) * 3 + (kx + 1)];
                }
            }
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            if (magnitude > threshold) {
                edgeData[y * width + x] = 255;
            }
        }
    }
    return { data: edgeData, width, height };
}

/**
 * Finds connected components (contours) in a binary image.
 * @param binaryImage A binary image data object (edges).
 * @returns An array of contours, where each contour is an array of points.
 */
function findContours(binaryImage: { data: Uint8ClampedArray, width: number, height: number }): {x: number, y: number}[][] {
    const { data, width, height } = binaryImage;
    const visited = new Uint8ClampedArray(width * height);
    const contours: {x: number, y: number}[][] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            if (data[index] === 255 && !visited[index]) {
                const contour = [];
                const queue = [{x, y}];
                visited[index] = 1;

                while (queue.length > 0) {
                    const point = queue.shift()!;
                    contour.push(point);

                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = point.x + dx;
                            const ny = point.y + dy;
                            const nIndex = ny * width + nx;

                            if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
                                data[nIndex] === 255 && !visited[nIndex]) {
                                visited[nIndex] = 1;
                                queue.push({x: nx, y: ny});
                            }
                        }
                    }
                }
                contours.push(contour);
            }
        }
    }
    return contours;
}

/**
 * Calculates the bounding rectangle for a contour.
 * @param contour An array of points.
 * @returns A CropBox representing the bounding rectangle.
 */
function getBoundingRect(contour: {x: number, y: number}[]): CropBox {
    if (contour.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const point of contour) {
        if (point.x < minX) minX = point.x;
        if (point.y < minY) minY = point.y;
        if (point.x > maxX) maxX = point.x;
        if (point.y > maxY) maxY = point.y;
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Merges two bounding boxes into one that encompasses both.
 */
function mergeRects(r1: CropBox, r2: CropBox): CropBox {
    const x = Math.min(r1.x, r2.x);
    const y = Math.min(r1.y, r2.y);
    const w = Math.max(r1.x + r1.w, r2.x + r2.w) - x;
    const h = Math.max(r1.y + r1.h, r2.y + r2.h) - y;
    return { x, y, w, h };
}

/**
 * Checks if two bounding boxes are close enough to be merged.
 */
function shouldMerge(r1: CropBox, r2: CropBox, margin: number): boolean {
    const expandedR1 = {
        x: r1.x - margin,
        y: r1.y - margin,
        w: r1.w + 2 * margin,
        h: r1.h + 2 * margin,
    };
    
    return (
        expandedR1.x < r2.x + r2.w &&
        expandedR1.x + expandedR1.w > r2.x &&
        expandedR1.y < r2.y + r2.h &&
        expandedR1.y + expandedR1.h > r2.y
    );
}

/**
 * Iteratively merges nearby bounding boxes until no more merges are possible.
 */
function mergeNearbyBoxes(boxes: CropBox[], imgWidth: number, imgHeight: number): CropBox[] {
    if (boxes.length < 2) return boxes;

    const margin = Math.min(imgWidth, imgHeight) * 0.05; // 5% of smaller dimension as merge distance
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                if (shouldMerge(boxes[i], boxes[j], margin)) {
                    boxes[i] = mergeRects(boxes[i], boxes[j]);
                    boxes.splice(j, 1);
                    merged = true;
                    break; 
                }
            }
            if (merged) break;
        }
    }
    return boxes;
}

/**
 * Suggests a crop for an image using an on-device edge detection pipeline.
 * This function mirrors the logic from the user-provided Python/OpenCV script.
 * @param img The HTMLImageElement to process.
 * @returns A promise that resolves to the suggested CropBox or null.
 */
export async function suggestCropWithEdgeDetection(img: HTMLImageElement): Promise<CropBox | null> {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get canvas context");

        const { naturalWidth: width, naturalHeight: height } = img;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height);

        const grayData = toGrayscale(imageData);
        const blurredData = gaussianBlur(grayData);

        const thresholds = [30, 70];
        let allContours: {x: number, y: number}[][] = [];

        console.log("Experimenting with Canny thresholds:", thresholds);

        for (const threshold of thresholds) {
            const edgeData = cannyEdgeDetector(blurredData, threshold);
            const contours = findContours(edgeData);
            console.log(`Found ${contours.length} contours with threshold ${threshold}`);
            allContours = allContours.concat(contours);
        }

        if (allContours.length === 0) {
            console.warn("No contours found across all thresholds.");
            return null;
        }

        const boxes: CropBox[] = allContours.map(getBoundingRect);
        
        // Use a relative area threshold instead of a fixed one
        const minArea = (width * height) * 0.015;
        let validBoxes = boxes.filter(box => box.w * box.h > minArea);

        if (validBoxes.length === 0) {
            console.warn("Edge detection did not find any significant content areas.");
            return null;
        }

        // Merge nearby boxes to group related content
        let mergedBoxes = mergeNearbyBoxes(validBoxes, width, height);

        if (mergedBoxes.length === 0) {
            return null;
        }

        // Return the box with the largest area after merging
        const bestBox = mergedBoxes.reduce((largest, current) => {
            return (current.w * current.h > largest.w * largest.h) ? current : largest;
        });
        
        // Final sanity check: if the crop is >95% of the image, it's likely a failure.
        const bestBoxArea = bestBox.w * bestBox.h;
        const imageArea = width * height;
        if (bestBoxArea / imageArea > 0.95) {
            console.warn("Best crop is nearly the full image, falling back.");
            return null;
        }

        return bestBox;
    } catch (error) {
        console.error("Error during local smart crop:", error);
        return null;
    }
}