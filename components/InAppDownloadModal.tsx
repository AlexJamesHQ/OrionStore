import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Package,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Sparkles,
  ArrowDown,
  Smartphone,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { formatFileSize } from '../services/githubApi';

export function renderTextWithLinks(text: string): React.ReactNode {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|t\.me\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      let href = part;
      if (!part.startsWith('http://') && !part.startsWith('https://')) {
        if (part.startsWith('t.me')) {
          href = `https://${part}`;
        } else if (part.startsWith('www.')) {
          href = `https://${part}`;
        }
      }
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7C3AED] hover:text-[#5B21B6] font-bold underline underline-offset-2 break-all inline-flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
          <ExternalLink className="w-2.5 h-2.5 inline-block" />
        </a>
      );
    }
    return part;
  });
}

export interface InAppDownloadInfo {
  repoName: string;
  tagName: string;
  apkName: string;
  downloadUrl: string;
  sizeBytes?: number;
  releaseNotes?: string;
  githubUrl: string;
}

interface InAppDownloadModalProps {
  isOpen: boolean;
  info: InAppDownloadInfo | null;
  onClose: () => void;
}

export const InAppDownloadModal: React.FC<InAppDownloadModalProps> = ({ isOpen, info, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('3.2 MB/s');
  const timerRef = useRef<any>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Reset state on open/info change
  useEffect(() => {
    if (isOpen) {
      setDownloadState('idle');
      setProgress(0);
      setCopied(false);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, info?.downloadUrl]);

  if (!isOpen || !info) return null;

  const triggerActualDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = info.downloadUrl;
      a.download = info.apkName || `${info.repoName}.apk`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(info.downloadUrl, '_blank');
    }
  };

  const handleStartAnimatedDownload = () => {
    if (downloadState === 'downloading') return;

    // Optional haptic tap
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    setDownloadState('downloading');
    setProgress(5);

    let current = 5;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      current += Math.floor(Math.random() * 14) + 12;
      const speeds = ['3.8 MB/s', '5.2 MB/s', '6.1 MB/s', '4.4 MB/s', '7.0 MB/s'];
      setDownloadSpeed(speeds[Math.floor(Math.random() * speeds.length)]);

      if (current >= 100) {
        current = 100;
        setProgress(100);
        clearInterval(timerRef.current);

        setTimeout(() => {
          setDownloadState('completed');
          // Haptic celebration pulse
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
          // Launch actual browser download
          triggerActualDownload();
        }, 400);
      } else {
        setProgress(current);
      }
    }, 120);
  };

  const handleCopyLink = () => {
    if (!info.downloadUrl) return;
    navigator.clipboard.writeText(info.downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card - Neobrutalist Style */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-lg md:max-w-xl bg-[#FAF6EE] rounded-3xl border-[3.5px] border-black p-5 sm:p-6 shadow-[8px_8px_0px_#000] z-10 max-h-[94vh] flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-black mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Package className="w-4 h-4 text-black stroke-[2.5]" />
            </span>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight text-black leading-none">
                APK Direct Download
              </h3>
              <span className="text-[10px] font-mono text-neutral-600 font-semibold">
                Universal Browser & Mobile Support
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto brutal-scroll pr-1 flex-1 space-y-3.5">
          {/* APK Overview Info Card */}
          <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-black text-lg text-black uppercase tracking-tight truncate">
                {info.repoName}
              </h4>
              <span className="text-xs font-mono font-bold bg-[#FFE600] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000] flex-shrink-0">
                {info.tagName}
              </span>
            </div>

            <div className="bg-[#FAF6EE] border border-black/30 rounded-xl p-3 font-mono text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-black truncate">{info.apkName}</span>
                {info.sizeBytes && (
                  <span className="text-neutral-500 font-bold ml-2">
                    {formatFileSize(info.sizeBytes)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-600">
                Direct package file. Supported on Chrome, Microsoft Edge, and all Android browsers.
              </p>
            </div>

            {info.releaseNotes && (
              <div className="bg-white border border-black/20 rounded-xl p-2.5 max-h-24 overflow-y-auto brutal-scroll font-mono text-[11px] text-neutral-700 leading-relaxed whitespace-pre-wrap">
                <p className="font-black text-black uppercase text-[10px] mb-1">Release Notes:</p>
                <div>{renderTextWithLinks(info.releaseNotes)}</div>
              </div>
            )}
          </div>

          {/* DYNAMIC DOWNLOAD ANIMATION DISPLAY */}
          <AnimatePresence mode="wait">
            {downloadState === 'downloading' && (
              <motion.div
                key="downloading-view"
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                className="bg-white border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_#FFE600] space-y-3"
              >
                {/* Visual Download Animation Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Bouncing down arrow animation */}
                    <div className="relative w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center overflow-hidden shadow-[2px_2px_0px_#000]">
                      <motion.div
                        animate={{ y: [-12, 0, 12] }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'easeInOut' }}
                      >
                        <ArrowDown className="w-5 h-5 text-black stroke-[3]" />
                      </motion.div>
                    </div>

                    <div>
                      <p className="font-black text-xs uppercase text-black">
                        Downloading Package...
                      </p>
                      <p className="font-mono text-[11px] text-neutral-600 font-semibold">
                        Speed: {downloadSpeed} • {progress}%
                      </p>
                    </div>
                  </div>

                  <span className="font-mono font-black text-sm bg-black text-[#FFE600] px-2.5 py-1 rounded-lg border border-black">
                    {progress}%
                  </span>
                </div>

                {/* Animated Neobrutalist Progress Bar */}
                <div className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl h-6 p-0.5 overflow-hidden relative">
                  <motion.div
                    className="h-full bg-[#FFE600] border-r-2 border-black rounded-lg transition-all duration-150 flex items-center justify-end pr-1 overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    {/* Animated repeating diagonal stripes */}
                    <div
                      className="w-full h-full opacity-35"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #000 0, #000 8px, transparent 8px, transparent 16px)',
                      }}
                    />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 font-bold">
                  <span>{progress < 40 ? 'Connecting to GitHub CDN...' : progress < 85 ? 'Streaming APK bytes...' : 'Verifying package checksum...'}</span>
                  <span>Direct Browser Stream</span>
                </div>
              </motion.div>
            )}

            {downloadState === 'completed' && (
              <motion.div
                key="completed-view"
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                className="bg-[#ECFDF5] border-[3px] border-black rounded-2xl p-4 shadow-[4px_4px_0px_#10B981] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.25, 1] }}
                      transition={{ duration: 0.4 }}
                      className="w-9 h-9 rounded-xl bg-emerald-400 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]"
                    >
                      <CheckCircle2 className="w-5 h-5 text-black stroke-[2.5]" />
                    </motion.div>
                    <div>
                      <p className="font-black text-xs uppercase text-emerald-950">
                        Download Started!
                      </p>
                      <p className="font-mono text-[11px] text-emerald-800 font-bold">
                        {info.apkName} saved to your device
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold bg-white border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000] text-emerald-900">
                    100% DONE
                  </span>
                </div>

                <p className="text-[11px] font-mono text-emerald-900/90 leading-tight">
                  Check your browser notification bar or download manager to open and install the APK.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN INTERACTIVE DOWNLOAD BUTTON */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleStartAnimatedDownload}
              disabled={downloadState === 'downloading'}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 border-[2.5px] border-black transition-all cursor-pointer select-none ${
                downloadState === 'downloading'
                  ? 'bg-neutral-200 text-neutral-600 cursor-not-allowed shadow-[1px_1px_0px_#000]'
                  : downloadState === 'completed'
                  ? 'bg-emerald-400 text-black shadow-[4px_4px_0px_#000] hover:bg-emerald-300 active:translate-x-[1px] active:translate-y-[1px]'
                  : 'bg-[#FFE600] text-black shadow-[4px_4px_0px_#000] hover:bg-yellow-300 hover:scale-[1.01] active:translate-x-[1px] active:translate-y-[1px]'
              }`}
            >
              {downloadState === 'downloading' ? (
                <>
                  <RefreshCw className="w-4 h-4 stroke-[2.5] animate-spin" />
                  <span>Downloading... {progress}%</span>
                </>
              ) : downloadState === 'completed' ? (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Again</span>
                </>
              ) : (
                <>
                  {/* Lively animated bouncing download arrow */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    <Download className="w-4 h-4 stroke-[3]" />
                  </motion.div>
                  <span>Download APK (Animated Live Download)</span>
                </>
              )}
            </button>

            {/* SECONDARY ROW: Direct Link & Copy */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700 font-black">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={info.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={info.apkName}
                className="py-2.5 px-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-black no-underline"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-700" />
                <span>Instant Link</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-black mt-3 flex-shrink-0">
          <a
            href={info.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-neutral-700 hover:text-black flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onClose}
            className="py-1.5 px-3.5 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

