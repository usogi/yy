
import React from 'react';
import { LogoIcon, MoonIcon, SunIcon } from './icons';

interface HeaderProps {
  onAutoCropAll: () => void;
  onExportAll: () => void;
  isProcessing: boolean;
  isModelReady: boolean;
  hasItems: boolean;
  theme: string;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAutoCropAll, onExportAll, isProcessing, isModelReady, hasItems, theme, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-tiktok-surface/80 backdrop-blur-lg border-b border-gray-200 dark:border-tiktok-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <LogoIcon className="h-8 w-8 text-gray-800 dark:text-tiktok-text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-tiktok-text-primary">
              TikCrop
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
                onClick={onToggleTheme}
                title="Toggle theme"
                className="p-2 rounded-full text-gray-500 dark:text-tiktok-text-secondary hover:bg-gray-100 dark:hover:bg-tiktok-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-tiktok-bg"
            >
                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={onAutoCropAll}
              disabled={!hasItems || isProcessing || !isModelReady}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 dark:bg-tiktok-accent dark:text-black dark:hover:bg-tiktok-accent-hover dark:focus:ring-tiktok-accent"
            >
              {isProcessing ? "Processing..." : "Auto-crop All"}
            </button>
            <button
              onClick={onExportAll}
              disabled={!hasItems}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-tiktok-surface dark:border-tiktok-border dark:text-tiktok-text-secondary dark:hover:bg-tiktok-border"
            >
              Download ZIP
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;