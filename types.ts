

export type ImgItem = {
  id: string;
  file: File;
  url: string;
  status: 'loading' | 'loaded' | 'error';
  width?: number;
  height?: number;
  crop?: CropBox;
  cropHistory?: CropBox[];
  cropHistoryIndex?: number;
  isProcessing?: boolean;
  error?: string | null;
  hasBeenManuallyAdjusted?: boolean;
  enhance?: boolean;
};

export type CropBox = { 
  x: number; 
  y: number; 
  w: number; 
  h: number 
};
