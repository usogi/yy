# TikCrop: AI-Powered Smart Cropping with On-Device Edge Detection

This project uses a local, privacy-first image processing engine to intelligently crop social media screenshots. The application has been engineered to run a computer vision pipeline directly in the user's browser, replacing a previous cloud-based AI service.

## 1. The On-Device Cropping Pipeline

The application's logic is built around a classic computer vision pipeline, implemented in TypeScript to run entirely on the client-side. This ensures user data never leaves their machine.

1.  **Image Upload**: Users upload one or more screenshots through the web interface. The files are loaded directly into the browser's memory.
2.  **On-Device Pre-processing**: For each "auto-crop" request, the image is processed through a series of filters:
    *   **Grayscale Conversion**: The image is converted from color to grayscale to simplify edge analysis.
    *   **Gaussian Blur**: A blur is applied to reduce noise and minor details, which helps in identifying major structural edges.
3.  **Edge & Contour Detection**:
    *   **Canny Edge Detector**: A simplified Canny edge detector (using a Sobel operator) is run on the processed image to produce a binary map of the most prominent edges.
    *   **Contour Finding**: The algorithm then analyzes the edge map to identify distinct, enclosed shapes or "contours."
4.  **Intelligent Selection**: The system calculates the bounding box for every contour found. It filters out small, irrelevant regions (like UI buttons or icons) based on a minimum area threshold and selects the largest remaining contour as the main content.
5.  **Non-Destructive Editing**: The application uses the coordinates of the selected bounding box to draw a crop suggestion over the original image. This approach is non-destructive, allowing the user to view the AI's suggestion and manually fine-tune the crop area as needed.
6.  **Client-Side Enhancement**: After a crop is finalized, the app uses a powerful client-side enhancement engine to improve the output quality.
    *   **Adaptive Upscaling**: If a cropped image is small (under 512px), it is automatically upscaled using a high-quality resampling algorithm.
    *   **Sharpening & Contrast**: It then applies precise sharpening and contrast filters to make the final image crisp and clear.

## 2. Key Features of the On-Device Engine

### Privacy & Performance
-   **100% Client-Side**: All image processing happens in the browser. No images are ever uploaded to a server, guaranteeing user privacy.
-   **No API Keys or Dependencies**: The removal of external API calls means the application is self-contained, easier to maintain, and has no associated running costs.
-   **Fast Local Processing**: Leverages modern browser performance for quick analysis without network latency.

### Quality & Intelligence
-   **Classic CV Pipeline**: Based on proven and reliable computer vision techniques for robust performance.
-   **Superior Image Quality**: The client-side enhancement pipeline ensures that even small, cropped selections look sharp and high-quality.
-   **Preserved User Control**: The core feature of non-destructive editing is maintained, giving users final control over the AI-suggested crop.

## 3. Why This is the "Best Version"

This implementation provides a robust and privacy-centric solution by:

1.  **Translating a standard OpenCV pipeline** into a browser-compatible format.
2.  **Ensuring absolute user privacy** by processing all data on-device.
3.  **Removing external dependencies**, which simplifies the architecture and eliminates potential points of failure or cost.
4.  **Maintaining a responsive UI** and preserving the essential non-destructive editing capabilities that give users final control over the output.