import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionAppItem } from '../types';
import {
  X,
  Download,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Package,
  Layers,
  Smartphone,
  Tv,
  Monitor,
  Copy,
  Check,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  QrCode,
} from 'lucide-react';
import { getDownloadUrlForApp } from '../services/orionAppsService';

interface OrionAppDetailModalProps {
  app: OrionAppItem | null;
  onClose: () => void;
}

export const OrionAppDetailModal: React.FC<OrionAppDetailModalProps> = ({ app, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [authorCopied, setAuthorCopied] = useState(false);

  if (!app) return null;

  const downloadUrl = getDownloadUrlForApp(app);
  const screenshots = app.screenshots && app.screenshots.length > 0 ? app.screenshots : [];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (downloadUrl && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Platform detection helper
  const getPlatformInfo = () => {
    const p = (app.platform || '').toLowerCase();
    const c = (app.category || '').toLowerCase();
    const n = (app.name || '').toLowerCase();
    const d = (app.description || '').toLowerCase();
    const pkg = (app.packageName || '').toLowerCase();
    const fullText = `${n} ${c} ${p} ${pkg} ${d}`.toLowerCase();

    if (
      p.includes('tv') ||
      c.includes('tv') ||
      /\b(tv|smarttv|androidtv|firetv|stremio|kodi|smarttube|tivimate|cloudstream|tivi|leanback|television)\b/i.test(
        fullText
      )
    ) {
      return {
        label: 'Android TV',
        icon: <Tv className="w-3.5 h-3.5 text-purple-700 stroke-[2.5]" />,
      };
    }

    if (
      p.includes('pc') ||
      p.includes('desktop') ||
      c.includes('pc') ||
      c.includes('desktop') ||
      /\b(pc|desktop|windows|mac|linux|electron|termux|localsend|scrcpy|acode)\b/i.test(
        fullText
      )
    ) {
      return {
        label: 'PC / Desktop',
        icon: <Monitor className="w-3.5 h-3.5 text-blue-700 stroke-[2.5]" />,
      };
    }

    return {
      label: 'Android',
      icon: <Smartphone className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />,
    };
  };

  const platformInfo = getPlatformInfo();

  // Clean GitHub Username extraction helper
  const getCleanGitHubUsername = () => {
    const pkg = (app.packageName || '').toLowerCase();
    if (pkg === 'moe.rukamori.archivetune') {
      return 'RukaMori';
    }
    if (app.githubRepo) {
      const parts = app.githubRepo.split('/');
      if (parts.length > 0 && parts[0].trim()) {
        return parts[0].trim();
      }
    }
    if (app.author) {
      const cleanAuthor = app.author.replace(/[^a-zA-Z0-9_-]/g, '');
      if (cleanAuthor) return cleanAuthor;
    }
    return 'github';
  };

  const githubUsername = getCleanGitHubUsername();
  const authorName = (app.packageName || '').toLowerCase() === 'moe.rukamori.archivetune' 
    ? 'RukaMori' 
    : (app.author || 'Open Source Developer');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 select-none">
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-5 bg-[#FFE600] border-b-4 border-black flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-black overflow-hidden flex-shrink-0 bg-white shadow-[2px_2px_0px_#000]">
                {!imgError && app.icon ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-black text-[#FFE600] flex items-center justify-center font-black text-2xl">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h2 className="font-black text-lg sm:text-xl text-black truncate leading-tight">
                  {app.name}
                </h2>
                <p className="font-mono text-xs text-neutral-800 truncate">
                  Version: {app.version || 'Latest'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2 bg-white border-2 border-black rounded-xl text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                title="Share app"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white border-2 border-black rounded-xl text-black hover:bg-neutral-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 brutal-scroll">
            {/* Main Action Banner */}
            <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
                  <span className="font-black text-xs font-mono uppercase text-emerald-700">
                    Ready to Install
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-500">
                    • {app.size && app.size !== 'Varies' ? app.size : 'Android APK'}
                  </span>
                </div>
                <p className="font-mono text-xs text-neutral-600 mt-1">
                  Direct package release without trackers or third-party ads
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleDownload}
                  className="py-2.5 px-5 bg-[#FFE600] text-black border-2 border-black rounded-xl font-black text-xs sm:text-sm uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000] hover:bg-yellow-300 hover:scale-105 active:scale-95 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer w-full justify-center"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>DOWNLOAD APK</span>
                </button>
              </div>
            </div>

            {/* Publisher Info Card (Shows Avatar + Name + Convenient Click-to-Copy) */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-2.5 select-none">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <img
                  src={`https://github.com/${githubUsername}.png`}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=FFE600&color=000&bold=true`;
                  }}
                  alt={authorName}
                  className="w-10 h-10 rounded-xl border-2 border-black object-cover shadow-[1.5px_1.5px_0px_#000] pointer-events-none flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block leading-none">PUBLISHED BY</span>
                  <span className="font-black text-sm text-black block mt-0.5 truncate select-all" title={authorName}>{authorName}</span>
                </div>
              </div>

              {authorName && (
                <button
                  type="button"
                  onClick={() => {
                    const profileUrl = `https://github.com/${githubUsername}`;
                    navigator.clipboard.writeText(profileUrl);
                    setAuthorCopied(true);
                    setTimeout(() => setAuthorCopied(false), 1500);
                  }}
                  className={`py-1.5 px-2.5 sm:px-3 border-2 border-black rounded-xl text-[10px] font-mono font-black uppercase transition-all shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    authorCopied
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-[#FAF6EE] hover:bg-[#FFE600] text-black'
                  }`}
                  title="Copy GitHub Profile Link"
                >
                  {authorCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Quick QR Code Scan & Download Section */}
            <div className="bg-white border-2 border-black rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#000] select-none">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl border-2 border-black bg-[#FAF6EE] flex items-center justify-center flex-shrink-0 shadow-[1.5px_1.5px_0px_#000]">
                    <QrCode className="w-5 h-5 text-black stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase block leading-none">SCAN & INSTALL</span>
                    <span className="font-black text-sm text-black block mt-0.5 truncate">Download on Phone</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className={`py-1.5 px-2.5 sm:px-3 border-2 border-black rounded-xl text-[10px] font-mono font-black uppercase transition-all shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                    showQr
                      ? 'bg-[#FFE600] text-black'
                      : 'bg-[#FAF6EE] hover:bg-[#FFE600] text-black'
                  }`}
                  title="Toggle QR Code"
                >
                  <QrCode className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{showQr ? 'HIDE QR' : 'SHOW QR'}</span>
                </button>
              </div>

              <AnimatePresence>
                {showQr && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col items-center justify-center pt-3.5 text-center"
                  >
                    <div className="p-3 bg-[#FAF6EE] border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] mb-2 relative group overflow-hidden">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&color=000000&bgcolor=ffffff&data=${encodeURIComponent(downloadUrl)}`}
                        alt="Download QR Code"
                        className="w-32 h-32 object-contain pointer-events-none"
                      />
                    </div>
                    <p className="font-mono text-[10px] sm:text-xs text-neutral-600 max-w-xs mt-1 leading-relaxed">
                      Point your phone camera or QR scanner at the screen to instantly trigger direct APK download!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">CATEGORY</span>
                <span className="font-black text-xs sm:text-sm text-black truncate block mt-0.5">{app.category || 'Utility'}</span>
              </div>
              <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">VERSION</span>
                <span className="font-black text-xs sm:text-sm text-black truncate block mt-0.5">{app.version || 'Latest'}</span>
              </div>
              <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">PLATFORM</span>
                <div className="flex items-center gap-1 mt-0.5 font-black text-xs sm:text-sm text-black truncate">
                  {platformInfo.icon}
                  <span>{platformInfo.label}</span>
                </div>
              </div>
              <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block">SECURITY</span>
                <span className="font-black text-xs sm:text-sm text-emerald-700 truncate block mt-0.5">Verified Safe</span>
              </div>
            </div>

            {/* Applied Patches / Features */}
            {app.patches && app.patches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Sparkles className="w-4 h-4 text-[#FF5E00]" />
                  <h3 className="font-black text-xs uppercase tracking-wider text-black">
                    APPLIED PATCHES & MODS ({app.patches.length})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {app.patches.map((patch, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono font-bold bg-[#FFE600] border-2 border-black px-2.5 py-1 rounded-lg text-black shadow-[1.5px_1.5px_0px_#000]"
                    >
                      ✓ {patch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-black mb-2">
                ABOUT THIS APPLICATION
              </h3>
              <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-4 shadow-[2px_2px_0px_#000]">
                <p className="text-xs sm:text-sm font-sans text-neutral-800 leading-relaxed whitespace-pre-line">
                  {app.description || 'Open source modded Android application distributed directly from verified repositories.'}
                </p>
              </div>
            </div>

            {/* Screenshots Gallery with Click to Zoom (Lightbox) */}
            {screenshots.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-black text-xs uppercase tracking-wider text-black">
                    APP SCREENSHOTS ({screenshots.length}) • Click to enlarge
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500 font-bold">
                    Scroll horizontally
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 brutal-scroll">
                  {screenshots.map((src, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage(src)}
                      className="relative flex-shrink-0 w-36 sm:w-44 aspect-[9/16] bg-neutral-900 border-2 border-black rounded-2xl overflow-hidden shadow-[3px_3px_0px_#000] cursor-pointer transition-transform hover:scale-105 group"
                    >
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 bg-[#FFE600] border-2 border-black rounded-xl text-black shadow-[2px_2px_0px_#000]">
                          <Maximize2 className="w-4 h-4 stroke-[3]" />
                        </span>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Package details */}
            {app.packageName && (
              <div className="p-3 bg-neutral-100 border-2 border-black rounded-xl flex items-center justify-between text-xs font-mono text-neutral-700">
                <span className="font-bold">Package: {app.packageName}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(app.packageName || '');
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="p-1 hover:text-black cursor-pointer"
                  title="Copy package name"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-white border-t-2 border-black flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Orion Verified Package</span>
            </div>

            <button
              onClick={onClose}
              className="py-1.5 px-4 bg-black text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Screenshot Lightbox Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-black border-4 border-[#FFE600] rounded-3xl overflow-hidden shadow-[10px_10px_0px_#FFE600]"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 p-2.5 bg-[#FFE600] border-2 border-black rounded-xl text-black hover:bg-yellow-300 shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[3]" />
              </button>
              <img
                src={lightboxImage}
                alt="Enlarged Screenshot"
                className="max-w-full max-h-[85vh] object-contain mx-auto block"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
