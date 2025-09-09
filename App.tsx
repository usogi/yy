
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import type { ImgItem, CropBox } from './types';
import { uid, loadImage, enhanceImage } from './utils/common';
import { useAutoCropModel } from './hooks/useAutoCropModel';
import Header from './components/Header';
import FileDropzone from './components/FileDropzone';
import ImageEditor from './components/ImageEditor';
import Footer from './components/Footer';

export default function App() {
  const [items, setItems] = useState<ImgItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { isModelReady, predict } = useAutoCropModel();
  
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const updateItemCrop = (item: ImgItem, newCrop: CropBox, dimensions?: { width: number, height: number }) => {
    const history = (item.cropHistory || []).slice(0, (item.cropHistoryIndex ?? 0) + 1);
    history.push(newCrop);
    return {
      ...item,
      ...dimensions,
      crop: newCrop,
      cropHistory: history,
      cropHistoryIndex: history.length - 1,
      error: null, // Clear error on successful crop
    };
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const newItems: ImgItem[] = fileArray.map(file => ({
      id: uid(),
      file,
      url: URL.createObjectURL(file),
      status: 'loading',
      isProcessing: false,
      hasBeenManuallyAdjusted: false,
      enhance: true, // Default enhance to true for new images
    }));

    if (newItems.length > 0) {
      setItems(prevItems => [...prevItems, ...newItems]);
    }
    
    newItems.forEach(item => {
      loadImage(item.url)
        .then(img => {
          const { naturalWidth: width, naturalHeight: height } = img;
          const initialCrop = { x: 0, y: 0, w: width, h: height };
          setItems(prev => prev.map(i => i.id === item.id 
            ? { ...i, status: 'loaded', width, height, crop: initialCrop, cropHistory: [initialCrop], cropHistoryIndex: 0 } 
            : i
          ));
        })
        .catch(error => {
          console.error("Failed to load image:", item.file.name, error);
          setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
        });
    });
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems(prev => {
        const itemToRemove = prev.find(i => i.id === id);
        if (itemToRemove) {
          URL.revokeObjectURL(itemToRemove.url);
        }
        return prev.filter(x => x.id !== id);
    });
  }, []);

  const handleAutoCrop = useCallback(async (item: ImgItem) => {
    if (item.status !== 'loaded' || item.isProcessing) return;
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, isProcessing: true, error: null, hasBeenManuallyAdjusted: false } : x));
    try {
      const img = await loadImage(item.url);
      const box = await predict(img);
      setItems(prev => prev.map(x => x.id === item.id ? updateItemCrop(x, box, {width: img.naturalWidth, height: img.naturalHeight}) : x));
    } catch (error) {
      console.error("Error during auto-crop:", error);
      const errorMessage = "AI crop failed. Please try again.";
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, error: errorMessage } : x));
    } finally {
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, isProcessing: false } : x));
    }
  }, [predict]);

  const handleAutoCropAll = useCallback(async () => {
    const itemsToCrop = items.filter(i => i.status === 'loaded' && !i.isProcessing);
    if (itemsToCrop.length === 0) return;

    setIsBatchProcessing(true);
    setItems(prev => prev.map(item =>
      itemsToCrop.find(itc => itc.id === item.id) ? { ...item, isProcessing: true, error: null, hasBeenManuallyAdjusted: false } : item
    ));

    for (const item of itemsToCrop) {
      try {
        const img = await loadImage(item.url);
        const box = await predict(img); 
        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...updateItemCrop(i, box, { width: img.naturalWidth, height: img.naturalHeight }), isProcessing: false }
            : i
        ));
      } catch (error) {
        console.error(`Error auto-cropping ${item.file.name}:`, error);
        const errorMessage = "AI crop failed.";
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, isProcessing: false, error: errorMessage } : i
        ));
      }
    }

    setIsBatchProcessing(false);
  }, [items, predict]);

  const exportCropped = useCallback(async (item: ImgItem): Promise<Blob | null> => {
    if (!item || item.status !== 'loaded') return null;
    const img = await loadImage(item.url);
    const crop = item.crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    const cnv = document.createElement("canvas");
    cnv.width = crop.w;
    cnv.height = crop.h;
    const ctx = cnv.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
    
    let finalBlob: Blob | null = await new Promise(resolve => cnv.toBlob(b => resolve(b), 'image/png'));
    
    if (finalBlob && item.enhance) {
        finalBlob = await enhanceImage(finalBlob);
    }
    
    return finalBlob;
  }, []);

  const handleExportAll = useCallback(async () => {
    const zip = new JSZip();
    const itemsToExport = items.filter(i => i.status === 'loaded');
    for (const item of itemsToExport) {
      const blob = await exportCropped(item);
      if (blob) {
        const fileName = item.file.name.replace(/\.[^/.]+$/, "");
        // Enhanced images are always PNG
        const fileExtension = item.enhance ? 'png' : (item.file.type.split('/')[1] || 'png');
        zip.file(`TikCrop_${fileName}.${fileExtension}`, blob);
      }
    }
    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = "TikCrop_batch.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, [items, exportCropped]);

  const handleCropChange = useCallback((id: string, newCrop: CropBox) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, crop: newCrop, error: null } : item));
  }, []);
  
  const handleCropChangeEnd = useCallback((id:string) => {
    setItems(prev => {
        return prev.map(item => {
            if (item.id === id) {
                const updatedItem = updateItemCrop(item, item.crop!);
                return { ...updatedItem, hasBeenManuallyAdjusted: true };
            }
            return item;
        });
    });
  }, []);

  const handleUndo = useCallback((id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.cropHistory && item.cropHistoryIndex > 0) {
        const newIndex = item.cropHistoryIndex - 1;
        return { ...item, crop: item.cropHistory[newIndex], cropHistoryIndex: newIndex };
      }
      return item;
    }));
  }, []);

  const handleRedo = useCallback((id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id && item.cropHistory && item.cropHistoryIndex < item.cropHistory.length - 1) {
        const newIndex = item.cropHistoryIndex + 1;
        return { ...item, crop: item.cropHistory[newIndex], cropHistoryIndex: newIndex };
      }
      return item;
    }));
  }, []);
  
  const handleToggleEnhancement = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
        item.id === id ? { ...item, enhance: !item.enhance } : item
    ));
  }, []);

  const loadedItems = items.filter(item => item.status === 'loaded');
  const hasItems = items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-tiktok-bg text-gray-800 dark:text-tiktok-text-primary font-sans">
      <Header
        onAutoCropAll={handleAutoCropAll}
        onExportAll={handleExportAll}
        isProcessing={isBatchProcessing}
        isModelReady={isModelReady}
        hasItems={hasItems}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <FileDropzone onFiles={handleFiles} />
        
        {loadedItems.length > 0 && (
          <div className="flex flex-col items-center w-full gap-8 mt-8">
            {loadedItems.map(item => (
               <ImageEditor
                key={item.id}
                item={item}
                onCropChange={handleCropChange}
                onCropChangeEnd={() => handleCropChangeEnd(item.id)}
                onAutoCrop={() => handleAutoCrop(item)}
                onRemove={handleRemoveItem}
                onExport={exportCropped}
                isModelReady={isModelReady}
                onUndo={() => handleUndo(item.id)}
                onRedo={() => handleRedo(item.id)}
                canUndo={(item.cropHistoryIndex ?? 0) > 0}
                canRedo={(item.cropHistoryIndex ?? 0) < ((item.cropHistory?.length ?? 1) - 1)}
                onToggleEnhancement={handleToggleEnhancement}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
