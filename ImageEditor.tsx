
import React from 'react';
import type { ImgItem, CropBox } from '../types';
import { useCropper } from '../hooks/useCropper';
import { CropIcon, DownloadIcon, ZoomInIcon, TrashIcon, UndoIcon, RedoIcon, SpinnerIcon, SparklesIcon } from './icons';

interface ImageEditorProps {
  item: ImgItem;
  onCropChange: (id: string, newCrop: CropBox) => void;
  onCropChangeEnd: () => void;
  onAutoCrop: () => void;
  onRemove: (id: string) => void;
  onExport: (item: ImgItem) => Promise<Blob | null>;
  isModelReady: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleEnhancement: (id: string) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ item, onCropChange, onCropChangeEnd, onAutoCrop, onRemove, onExport, isModelReady, onUndo, onRedo, canUndo, canRedo, onToggleEnhancement }) => {
  const {
    imgRef,
    containerRef,
    crop,
    scale,
    zoom,
    setZoom,
    dragging,
    handleMouseDown,
  } = useCropper({ item, onCropChange, onCropChangeEnd });

  const handleExportClick = async () => {
    const blob = await onExport(item);
    if (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      // Enhanced images are always PNG
      const extension = item.enhance ? 'png' : item.file.name.split('.').pop();
      a.download = `TikCrop_${item.file.name.replace(/\.[^/.]+$/, "")}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handles = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];
  const isProcessing = item.isProcessing ?? false;

  return (
    <section className="bg-white dark:bg-tiktok-surface rounded-xl border border-gray-200 dark:border-tiktok-border shadow-sm flex flex-col w-full max-w-lg">
      <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 dark:border-tiktok-border gap-2">
        <div className='flex-shrink-0'>
          <h2 className="font-semibold text-gray-800 dark:text-tiktok-text-primary text-base">Editor</h2>
          {item.error ? (
            <p className="text-xs text-red-500 font-semibold" title={item.error}>{item.error}</p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-tiktok-text-secondary truncate max-w-48" title={item.file.name}>{item.file.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
           <button onClick={onUndo} disabled={!canUndo || isProcessing} title="Undo" className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-tiktok-surface dark:border-tiktok-border dark:text-tiktok-text-secondary dark:hover:bg-tiktok-border">
            <UndoIcon className="w-4 h-4" />
          </button>
           <button onClick={onRedo} disabled={!canRedo || isProcessing} title="Redo" className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-tiktok-surface dark:border-tiktok-border dark:text-tiktok-text-secondary dark:hover:bg-tiktok-border">
            <RedoIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onRemove(item.id)} disabled={isProcessing} title="Remove" className="p-2 rounded-lg border border-gray-300 bg-white text-red-500 hover:bg-gray-100 transition-colors dark:bg-tiktok-surface dark:border-tiktok-border dark:hover:bg-tiktok-border disabled:opacity-50 disabled:cursor-not-allowed">
            <TrashIcon className="w-4 h-4" />
          </button>
          <button onClick={onAutoCrop} disabled={!isModelReady || isProcessing} title="Auto-crop" className="p-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 hover:bg-gray-700 transition-colors dark:bg-tiktok-accent dark:text-black dark:hover:bg-tiktok-accent-hover">
            {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <CropIcon className="w-4 h-4"/>}
          </button>
          <button onClick={handleExportClick} disabled={isProcessing} title="Download" className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors dark:bg-tiktok-surface dark:border-tiktok-border dark:text-tiktok-text-secondary dark:hover:bg-tiktok-border disabled:opacity-50 disabled:cursor-not-allowed">
            <DownloadIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

       <div className="p-2 flex items-center justify-center border-b border-gray-200 dark:border-tiktok-border gap-2">
            <ZoomInIcon className="w-5 h-5 text-gray-500 dark:text-tiktok-text-secondary flex-shrink-0" />
            <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full h-2 bg-gray-200 dark:bg-tiktok-border rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
        </div>
      
       <div className="p-3 border-b border-gray-200 dark:border-tiktok-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-gray-500 dark:text-tiktok-accent" />
            <span className="text-sm font-semibold text-gray-700 dark:text-tiktok-text-primary">Image Enhancement</span>
          </div>
          <div className="flex items-center">
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 dark:text-tiktok-text-secondary">
                  <input
                    type="checkbox"
                    checked={item.enhance ?? false}
                    onChange={() => onToggleEnhancement(item.id)}
                    className="w-4 h-4 rounded text-tiktok-accent bg-gray-100 border-gray-300 focus:ring-tiktok-accent dark:focus:ring-tiktok-accent dark:ring-offset-tiktok-surface dark:bg-tiktok-border dark:border-tiktok-border"
                  />
                  Sharpen & Contrast
              </label>
          </div>
       </div>

      <div ref={containerRef} className="relative p-2 grid place-items-center bg-gray-50/50 dark:bg-tiktok-bg/20 overflow-hidden flex-grow min-h-[250px]">
        <div className="relative inline-block transition-transform duration-200" style={{ 
            cursor: dragging ? 'grabbing' : 'default',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center'
        }}>
          <img ref={imgRef} src={item.url} alt="Editor preview" className="max-h-80 rounded-md shadow-md block" />
          {item.width && item.height && scale > 0 && (
            <div className="absolute top-0 left-0 w-full h-full">
              <svg width="100%" height="100%" viewBox={`0 0 ${item.width} ${item.height}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                  <mask id={`crop-mask-${item.id}`}>
                    <rect width={item.width} height={item.height} fill="white" />
                    <rect x={crop.x} y={crop.y} width={crop.w} height={crop.h} fill="black" />
                  </mask>
                </defs>
                <rect width={item.width} height={item.height} fill="rgba(0,0,0,0.5)" mask={`url(#crop-mask-${item.id})`} />
              </svg>
              <div
                className="absolute border-2 border-tiktok-accent cursor-move"
                style={{
                  left: `${crop.x * scale}px`,
                  top: `${crop.y * scale}px`,
                  width: `${crop.w * scale}px`,
                  height: `${crop.h * scale}px`,
                }}
                onMouseDown={(e) => !isProcessing && handleMouseDown(e, 'move')}
              >
                {handles.map(h => (
                  <div key={h} onMouseDown={(e) => !isProcessing && handleMouseDown(e, h)} className={`absolute w-3 h-3 bg-white rounded-full border-2 border-tiktok-accent handle-${h}`} />
                ))}
              </div>
              <style>{`
                .handle-tl { cursor: nwse-resize; top: -6px; left: -6px; }
                .handle-t { cursor: ns-resize; top: -6px; left: 50%; transform: translateX(-50%); }
                .handle-tr { cursor: nesw-resize; top: -6px; right: -6px; }
                .handle-l { cursor: ew-resize; top: 50%; left: -6px; transform: translateY(-50%); }
                .handle-r { cursor: ew-resize; top: 50%; right: -6px; transform: translateY(-50%); }
                .handle-bl { cursor: nesw-resize; bottom: -6px; left: -6px; }
                .handle-b { cursor: ns-resize; bottom: -6px; left: 50%; transform: translateX(-50%); }
                .handle-br { cursor: nwse-resize; bottom: -6px; right: -6px; }
              `}</style>
            </div>
          )}
        </div>
        {isProcessing && (
            <div className="absolute inset-0 bg-tiktok-surface/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-b-xl">
                <div className="flex flex-col items-center gap-2">
                    <SpinnerIcon className="w-8 h-8 text-tiktok-accent animate-spin" />
                    <p className="text-sm font-semibold text-tiktok-text-primary">AI Cropping...</p>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};

export default ImageEditor;
