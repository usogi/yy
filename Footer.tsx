
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm text-gray-500 dark:text-tiktok-text-secondary text-center">
      <p>&copy; {new Date().getFullYear()} TikCrop. Privacy-first, AI-powered.</p>
    </footer>
  );
};

export default Footer;