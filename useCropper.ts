
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImgItem, CropBox } from '../types';

interface UseCropperProps {
  item: ImgItem;
  onCropChange: (id: string, newCrop: CropBox) => void;
  onCropChangeEnd: (id: string) => void;
}

export function useCropper({ item, onCropChange, onCropChangeEnd }: UseCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState<{ handle: string; startX: number; startY: number; startCrop: CropBox } | null>(null);

  const crop = item.crop ?? { x: 0, y: 0, w: item.width ?? 0, h: item.height ?? 0 };

  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current && item.width) {
        setScale(imgRef.current.offsetWidth / item.width);
      }
    };

    const imgElement = imgRef.current;
    if (imgElement?.complete) {
        updateScale();
    } else if (imgElement) {
        imgElement.onload = updateScale;
    }

    window.addEventListener('resize', updateScale);
    return () => {
        if(imgElement) imgElement.onload = null;
        window.removeEventListener('resize', updateScale);
    };
  }, [item.width]);

  const handleMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ handle, startX: e.clientX, startY: e.clientY, startCrop: crop });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !item.width || !item.height) return;

    const dx = (e.clientX - dragging.startX) / (scale * zoom);
    const dy = (e.clientY - dragging.startY) / (scale * zoom);
    let { x, y, w, h } = dragging.startCrop;

    if (dragging.handle.includes('l')) { w -= dx; x += dx; }
    if (dragging.handle.includes('r')) { w += dx; }
    if (dragging.handle.includes('t')) { h -= dy; y += dy; }
    if (dragging.handle.includes('b')) { h += dy; }
    if (dragging.handle === 'move') { x += dx; y += dy; }
    
    // Clamp values to be within image bounds
    const newW = Math.max(10, w);
    const newH = Math.max(10, h);
    const newX = Math.max(0, Math.min(x, item.width - (dragging.handle.includes('l') ? newW : w) ));
    const newY = Math.max(0, Math.min(y, item.height - (dragging.handle.includes('t') ? newH : h) ));
    
    let finalW = newW;
    if (newX + newW > item.width) {
        finalW = item.width - newX;
    }
    
    let finalH = newH;
    if (newY + newH > item.height) {
        finalH = item.height - newY;
    }
    
    onCropChange(item.id, { x: Math.round(newX), y: Math.round(newY), w: Math.round(finalW), h: Math.round(finalH) });
  }, [dragging, scale, item.width, item.height, onCropChange, item.id, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragging) {
        onCropChangeEnd(item.id);
    }
    setDragging(null);
  }, [dragging, onCropChangeEnd, item.id]);

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  return {
    imgRef,
    containerRef,
    crop,
    scale,
    zoom,
    setZoom,
    dragging,
    handleMouseDown,
  };
}