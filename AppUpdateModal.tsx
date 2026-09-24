import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppUpdateInfo, ApkReleaseItem, formatUpdateDateTime } from '../services/updaterService';
import {
  X,
  Sparkles,
  Download,
  ExternalLink,
  RefreshCw,
  Package,
  Calendar,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  ArrowDown,
} from 'lucide-react';

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

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateInfo | null;
  isChecking: boolean;
  onCheckAgain: () => void;
  currentUser?: string;
  onOpenWebView?: (url: string, title?: string) => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  isChecking,
  onCheckAgain,
  currentUser = 'AlexJamesHQ',
  onOpenWebView,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);
  const [downloadedUrl, setDownloadedUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDownloadItem = (url: string, fileName: string) => {
    setDownloadingUrl(url);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }

    setTimeout(() => {
      // Trigger actual file download
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(url, '_blank');
      }

      setDownloadingUrl(null);
      setDownloadedUrl(url);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
      setTimeout(() => setDownloadedUrl(null), 3000);
    }, 1100);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '15.0 MB';
    return `${(bytes / 1000000).toFixed(1)} MB`;
  };

  const releases: ApkReleaseItem[] = (updateInfo?.allReleases ? updateInfo.allReleases : []).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-[#FAF6EE] rounded-2xl border-[3.5px] border-black p-4 sm:p-6 shadow-[8px_8px_0px_#000] z-10 animate-pop-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-black mb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base uppercase tracking-tight text-black leading-none">
                  APK Updates
                </h3>
                <span className="text-[10px] font-mono font-black bg-emerald-400 text-black border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                  LIVE
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-600 font-bold">
                @{currentUser} Latest Releases
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer active:translate-x-[1px] active:translate-y-[1px] shadow-[1px_1px_0px_#000]"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Real-time Status Bar */}
        <div className="mb-3 bg-white border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_#000] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-700 font-semibold truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <span className="truncate">Verified releases • Auto-sync with @{currentUser}</span>
          </div>
          <button
            onClick={onCheckAgain}
            disabled={isChecking}
            className="px-2 py-1 bg-[#FFE600] border border-black rounded-lg font-black text-[11px] uppercase flex items-center gap-1 hover:bg-yellow-300 active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0 ml-2"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* Content - releases with Date & Time */}
        <div className="flex-1 overflow-y-auto overscroll-contain brutal-scroll pr-1 space-y-3">
          {isChecking ? (
            <div className="py-14 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
              <p className="font-mono text-xs font-bold text-neutral-800">
                Checking GitHub for @{currentUser} APK releases...
              </p>
            </div>
          ) : releases.length > 0 ? (
            releases.map((rel, idx) => {
              const dt = formatUpdateDateTime(rel.publishedAt || rel.updatedAt);
              const isCopied = copiedUrl === rel.apkDownloadUrl;

              return (
                <div
                  key={`${rel.repoName}-${rel.tagName}-${idx}`}
                  className="bg-white border-2 border-black rounded-xl p-3.5 shadow-[3px_3px_0px_#000] space-y-2.5 transition-all hover:shadow-[4px_4px_0px_#000]"
                >
                  {/* Top Bar: Icon, Repo Name & Version */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#FFE600] border border-black flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_#000]">
                        <Package className="w-3.5 h-3.5 text-black" />
                      </span>
                      <h4 className="font-black text-sm text-black uppercase tracking-tight truncate">
                        {rel.repoName}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-[#FFE600]/40 border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000] flex-shrink-0">
                      {rel.tagName}
                    </span>
                  </div>

                  {/* Date & Time of Update */}
                  <div className="bg-[#FFFDF0] border border-black/40 rounded-xl p-2 font-mono text-[11px] text-neutral-800 flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 font-bold text-black">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{dt.formattedDate}</span>
                      <span className="text-neutral-400">•</span>
                      <Clock className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{dt.formattedTime}</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white border border-black/30 px-1.5 py-0.5 rounded text-neutral-700">
                      {dt.relative}
                    </span>
                  </div>

                  {/* APK or Package Info */}
                  <div className="bg-[#FAF6EE] border border-black/30 rounded-xl p-2.5 flex items-center justify-between font-mono text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-black text-black truncate">{rel.apkFileName}</p>
                      {/* No APK size */}
                    </div>
                    <span className={`text-[10px] font-bold border px-2 py-1 rounded flex-shrink-0 flex items-center gap-1 ${
                      rel.isApk || rel.apkFileName.toLowerCase().endsWith('.apk')
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                        : 'bg-amber-100 text-amber-800 border-amber-500'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{rel.isApk || rel.apkFileName.toLowerCase().endsWith('.apk') ? 'LATEST APK' : 'LATEST CODE'}</span>
                    </span>
                  </div>

                  {/* Release Notes */}
                  {rel.releaseNotes && (
                    <div className="bg-[#FFFDF0] border border-black/20 rounded-xl p-2.5 max-h-24 overflow-y-auto brutal-scroll font-mono text-[11px] text-neutral-700 leading-relaxed">
                      <p className="font-black text-black uppercase text-[9px] mb-0.5">Release Notes:</p>
                      <div className="whitespace-pre-line">{renderTextWithLinks(rel.releaseNotes)}</div>
                    </div>
                  )}

                  {/* Actions: Download & Secondary Links */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <motion.button
                      type="button"
                      onClick={() => handleDownloadItem(rel.apkDownloadUrl, rel.apkFileName)}
                      disabled={downloadingUrl === rel.apkDownloadUrl}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`py-2.5 px-3 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        downloadedUrl === rel.apkDownloadUrl
                          ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000]'
                          : downloadingUrl === rel.apkDownloadUrl
                          ? 'bg-neutral-200 text-neutral-600 shadow-[1px_1px_0px_#000] cursor-not-allowed'
                          : 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000] hover:bg-yellow-300'
                      }`}
                    >
                      {downloadedUrl === rel.apkDownloadUrl ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Started!</span>
                        </>
                      ) : downloadingUrl === rel.apkDownloadUrl ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ y: [0, -2, 0] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                          >
                            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                          </motion.div>
                          <span>{rel.isApk || rel.apkFileName.toLowerCase().endsWith('.apk') ? 'Download APK' : 'Download ZIP'}</span>
                        </>
                      )}
                    </motion.button>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(rel.apkDownloadUrl)}
                        className="flex-1 py-2 px-2 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1 shadow-[1px_1px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                        title="Copy direct download link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-700" />
                        )}
                        <span className="text-[10px]">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      <a
                        href={rel.githubReleaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-2 bg-[#FAF6EE] border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1 shadow-[1px_1px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] text-black no-underline cursor-pointer"
                        title="Open GitHub page"
                      >
                        <span className="text-[10px]">GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-2">
              <Package className="w-12 h-12 mx-auto text-neutral-400 mb-1" />
              <p className="font-black text-sm uppercase text-black">No APK Releases Found</p>
              <p className="font-mono text-xs text-neutral-600 max-w-xs mx-auto">
                No active GitHub releases with attached APK packages found for @{currentUser}.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t-2 border-black mt-3 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-mono text-neutral-600">
            Account: <b>@{currentUser}</b>
          </span>
          <button
            onClick={onCheckAgain}
            disabled={isChecking}
            className="py-1.5 px-3 bg-white border-2 border-black rounded-xl font-black text-xs uppercase inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check Updates</span>
          </button>
        </div>
      </div>
    </div>
  );
};

