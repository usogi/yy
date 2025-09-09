
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileDropzoneProps {
  onFiles: (files: FileList | File[]) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [onFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
    }
    // Reset the input so the user can select the same file again
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center bg-white dark:bg-tiktok-surface transition-all duration-300 ${isDragging ? 'border-tiktok-accent bg-indigo-50 dark:bg-tiktok-accent/10' : 'border-gray-300 dark:border-tiktok-border'}`}
    >
      <div className="flex flex-col items-center">
        <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="font-semibold text-gray-700 dark:text-tiktok-text-primary mb-2">Drop one or more screenshots here</p>
        <p className="text-sm text-gray-500 dark:text-tiktok-text-secondary mb-4">or</p>
        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-800 text-white font-semibold cursor-pointer hover:bg-gray-700 dark:bg-tiktok-accent dark:text-black dark:hover:bg-tiktok-accent-hover transition-transform hover:scale-105">
          Select Files
          <input type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
        </label>
        <p className="text-xs text-gray-400 dark:text-tiktok-text-secondary mt-4">Powered by on-device edge detection for privacy-first cropping.</p>
      </div>
    </div>
  );
};

export default FileDropzone;