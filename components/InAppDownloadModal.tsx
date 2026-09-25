import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionAppItem } from '../types';
import { Download, Check, X, Sparkles, ShieldCheck, HardDrive, RefreshCw, Smartphone, ExternalLink } from 'lucide-react';
import { getDownloadUrlForApp } from '../services/orionAppsService';

export type InAppDownloadInfo = any;

interface InAppDownloadModalProps {
  app: OrionAppItem | null;
  onClose: () => void;
}

export const InAppDownloadModal: React.FC<InAppDownloadModalProps> = ({ app, onClose }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'downloading' | 'completed'>('downloading');

  useEffect(() => {
    if (!app) return;
    setProgress(0);
    setStatus('downloading');

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('completed');
          return 100;
        }
        return prev + Math.floor(Math.random() * 18) + 12;
      });
    }, 220);

    return () => clearInterval(interval);
  }, [app]);

  if (!app) return null;

  const downloadUrl = getDownloadUrlForApp(app);

  const handleDownloadFromGitHub = () => {
    if (downloadUrl && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://github.com/search?q=${encodeURIComponent(app.name)}`, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_#000] text-black overflow-hidden flex flex-col items-center text-center"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-[#FAF6EE] border-2 border-black rounded-xl hover:bg-neutral-100 cursor-pointer shadow-[2px_2px_0px_#000]"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>

        {/* App Icon */}
        <div className="w-16 h-16 rounded-2xl border-2 border-black overflow-hidden bg-[#FAF6EE] shadow-[3px_3px_0px_#000] mb-3 mt-1">
          <img
            src={app.icon}
            alt={app.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/icon.png';
            }}
          />
        </div>

        <h3 className="font-black text-xl text-black tracking-tight mb-1">
          Downloading {app.name}
        </h3>
        <p className="font-mono text-xs text-neutral-600 mb-5">
          {app.packageName || 'org.orionstore.apk'} • {app.size || 'Verified APK'}
        </p>

        {/* Download Animation & Progress Bar */}
        <div className="w-full bg-[#FAF6EE] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] mb-5">
          <div className="flex items-center justify-between font-mono text-xs font-bold mb-2">
            <span>{status === 'downloading' ? 'Fetching APK from GitHub Release...' : 'Download Ready!'}</span>
            <span className="text-[#6B21A8]">{Math.min(100, progress)}%</span>
          </div>

          <div className="w-full bg-neutral-200 border-2 border-black rounded-full h-4 overflow-hidden p-0.5">
            <motion.div
              className="bg-[#FFE600] h-full rounded-full border-r-2 border-black transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-2">
            <span>Source: Official GitHub Releases</span>
            <span>{status === 'downloading' ? 'Direct CDN' : 'Ready'}</span>
          </div>
        </div>

        {/* Action Button */}
        {status === 'completed' ? (
          <button
            onClick={handleDownloadFromGitHub}
            className="w-full py-3 bg-[#FFE600] border-2 border-black rounded-2xl font-black text-sm uppercase shadow-[3px_3px_0px_#000] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            <span>Download from GitHub / Chrome</span>
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 bg-neutral-200 border-2 border-black rounded-2xl font-black text-sm uppercase opacity-70 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Preparing Download URL...</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
