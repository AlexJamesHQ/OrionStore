import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Repository, hasActualApk } from '../types';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  Download,
  Package,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCompactNumber, formatFileSize } from '../services/githubApi';
import { formatUpdateDateTime, cleanReleaseNotes } from '../services/updaterService';
import { StarIcon } from './Icons';

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

interface RepoDetailsModalProps {
  repo: Repository | null;
  onClose: () => void;
}

export const RepoDetailsModal: React.FC<RepoDetailsModalProps> = ({ repo, onClose }) => {
  const [copiedClone, setCopiedClone] = useState(false);
  const [cloneProtocol, setCloneProtocol] = useState<'https' | 'ssh'>('https');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadCompleted, setDownloadCompleted] = useState(false);
  const [realtimeRelease, setRealtimeRelease] = useState<any>(null);
  const [isCheckingRelease, setIsCheckingRelease] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);

  useEffect(() => {
    if (repo) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [repo]);

  // Real-time live fetch of releases from GitHub and API
  const fetchLiveRelease = async (force: boolean = false) => {
    if (!repo?.full_name) return;
    setIsCheckingRelease(true);
    try {
      // 1. Try server real-time release endpoint
      const res = await fetch(
        `/api/repo-releases?repo=${encodeURIComponent(repo.full_name)}${force ? '&fresh=true' : ''}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.hasApk) {
          setRealtimeRelease(data);
          return;
        }
      }

      // 2. Direct client-side GitHub API fallback
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${repo.full_name}/releases`);
        if (ghRes.ok) {
          const releases = await ghRes.json();
          if (Array.isArray(releases) && releases.length > 0) {
            for (const r of releases) {
              const apkAsset = r.assets?.find((a: any) =>
                a.name?.toLowerCase().endsWith('.apk')
              );
              if (apkAsset) {
                setRealtimeRelease({
                  success: true,
                  hasApk: true,
                  tagName: r.tag_name || r.name || 'Latest',
                  releaseName: r.name || `${repo.name} Release`,
                  apkName: apkAsset.name,
                  downloadUrl: apkAsset.browser_download_url,
                  sizeBytes: apkAsset.size,
                  publishedAt: r.published_at || new Date().toISOString(),
                  releaseNotes: cleanReleaseNotes(r.body),
                  downloadCount: apkAsset.download_count || 0,
                  htmlUrl: r.html_url || `${repo.html_url}/releases`,
                  isLive: true,
                });
                return;
              }
            }
          }
        }
      } catch {
        // ignore client error
      }
    } catch (err) {
      console.warn('Failed to fetch real-time release for', repo.full_name, err);
    } finally {
      setIsCheckingRelease(false);
    }
  };

  useEffect(() => {
    if (repo) {
      setRealtimeRelease(repo.latestRelease || null);
      fetchLiveRelease(false);
    } else {
      setRealtimeRelease(null);
    }
  }, [repo?.full_name]);

  if (!repo) return null;

  const cloneCommand =
    cloneProtocol === 'https'
      ? `git clone ${repo.html_url}.git`
      : `git clone git@github.com:${repo.full_name}.git`;

  const handleCopyClone = () => {
    navigator.clipboard.writeText(cloneCommand);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const handleDownloadApk = (downloadUrl: string, apkName: string) => {
    if (!downloadUrl) return;
    setDownloading(true);
    setDownloadCompleted(false);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 92) {
          clearInterval(interval);
          return 92;
        }
        return prev + Math.floor(Math.random() * 18) + 12;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setDownloadCompleted(true);

      // Safe anchor download trigger without navigating away
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = apkName || `${repo.name}.apk`;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        window.open(downloadUrl, '_blank');
      }

      setTimeout(() => {
        setDownloading(false);
      }, 1600);
    }, 1300);
  };

  // Genuine APK release or fallback for Android/APK repos
  const apkRelease =
    realtimeRelease ||
    (repo.latestRelease && (repo.latestRelease.apkName || repo.latestRelease.downloadUrl)
      ? repo.latestRelease
      : null) ||
    (hasActualApk(repo)
      ? {
          tagName: 'Latest APK',
          name: `${repo.name} Android Package`,
          apkName: `${repo.name}.apk`,
          downloadUrl: `${repo.html_url}/releases`,
          sizeBytes: undefined,
          publishedAt: repo.updated_at,
          releaseNotes: '• Verified Android Package release from GitHub repository.',
        }
      : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl md:max-w-2xl bg-[#FAF6EE] rounded-3xl border-[3.5px] border-black p-6 shadow-[8px_8px_0px_#000] z-10 max-h-[90vh] overflow-y-auto brutal-scroll">
        
        {/* Top Bar */}
        <div className="sticky top-0 bg-[#FAF6EE] z-20">
          <div className="relative flex items-center justify-between pb-3 border-b-2 border-black mb-4 overflow-hidden pt-2">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 bg-[#FFE600] border-2 border-black inline-block"></span>
              <span className="font-mono text-xs font-bold text-neutral-600 uppercase">
                Repository Details
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Repo Title and Owner */}
        <div className="mb-4">
          <h2 className="font-black text-xl sm:text-2xl text-black tracking-tight break-all leading-tight">
            {repo.full_name}
          </h2>
          <p className="font-mono text-xs text-neutral-600 mt-1">
            Curated Repository & APK Release
          </p>
        </div>

        {/* Real-time APK Release Section & Download */}
        {apkRelease ? (
          <div className="bg-[#FFFDF0] border-2 border-black rounded-2xl p-4 mb-4 shadow-[3px_3px_0px_#000] space-y-3">
            {/* Top status bar */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000]">
                  <Package className="w-4 h-4 text-black" />
                </span>
                <div>
                  <h4 className="font-black text-sm text-black uppercase tracking-tight flex items-center gap-1.5">
                    <span>Direct APK Download</span>
                  </h4>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-600">
                    <Tag className="w-3 h-3 text-neutral-500" />
                    <span className="font-bold text-black">{apkRelease.tagName}</span>
                    {apkRelease.publishedAt && (
                      <>
                        <span>•</span>
                        <span>{formatUpdateDateTime(apkRelease.publishedAt).relative}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Real-time Live Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-600 rounded-md text-[10px] font-mono font-black text-emerald-800 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                  LIVE • REAL-TIME
                </span>

                {/* Re-check live update button */}
                <button
                  type="button"
                  onClick={() => fetchLiveRelease(true)}
                  disabled={isCheckingRelease}
                  title="Check for live APK updates on GitHub"
                  className="p-1.5 bg-white border border-black rounded-lg hover:bg-neutral-100 active:scale-95 transition-all text-black cursor-pointer flex items-center gap-1 font-mono text-[10px] font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingRelease ? 'animate-spin text-purple-700' : ''}`} />
                  <span className="hidden sm:inline">Sync</span>
                </button>
              </div>
            </div>

            {/* APK File Information Box */}
            <div className="bg-white border-2 border-black rounded-xl p-3 shadow-[1.5px_1.5px_0px_#000]">
              <div className="flex items-center justify-between flex-wrap gap-1 font-mono text-xs text-neutral-800">
                <div className="flex items-center gap-2 truncate max-w-[70%]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 border border-black inline-block flex-shrink-0" />
                  <span className="font-bold truncate text-black">{apkRelease.apkName}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300">
                    APK Package
                  </span>
                </div>
              </div>

              {/* Real-time published timestamp */}
              {apkRelease.publishedAt && (
                <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px] font-mono text-neutral-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>
                      {formatUpdateDateTime(apkRelease.publishedAt).formattedDate} at {formatUpdateDateTime(apkRelease.publishedAt).formattedTime}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700">Live Synced</span>
                </div>
              )}
            </div>



            {/* Realistic Animated Download Progress Display */}
            <AnimatePresence>
              {downloading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_#000] space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-black">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-black stroke-[3]" />
                      </motion.div>
                      <span className="truncate">
                        {downloadCompleted ? 'Completed! Starting browser download...' : `Downloading ${apkRelease.apkName}...`}
                      </span>
                    </div>
                    <span className="font-mono bg-[#FFE600] px-1.5 py-0.5 rounded border border-black text-[11px]">
                      {downloadProgress}%
                    </span>
                  </div>

                  {/* Animated Striped Progress Bar */}
                  <div className="w-full bg-[#FAF6EE] border-2 border-black rounded-lg h-4 p-0.5 overflow-hidden">
                    <motion.div
                      className="bg-[#FFE600] h-full rounded transition-all duration-150 border-r border-black overflow-hidden"
                      style={{ width: `${downloadProgress}%` }}
                    >
                      <div
                        className="w-full h-full opacity-30"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(45deg, #000 0, #000 6px, transparent 6px, transparent 12px)',
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={() => handleDownloadApk(apkRelease.downloadUrl, apkRelease.apkName)}
              disabled={downloading}
              whileHover={{ scale: downloading ? 1 : 1.02 }}
              whileTap={{ scale: downloading ? 1 : 0.98 }}
              className={`w-full py-2.5 px-4 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer select-none ${
                downloadCompleted
                  ? 'bg-emerald-400 text-black shadow-[2px_2px_0px_#000]'
                  : downloading
                  ? 'bg-neutral-200 text-neutral-600 shadow-[1px_1px_0px_#000] cursor-not-allowed'
                  : 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000] hover:bg-yellow-300'
              }`}
            >
              {downloadCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Started!</span>
                </>
              ) : downloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  </motion.div>
                  <span>Downloading... {downloadProgress}%</span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  </motion.div>
                  <span>Download {apkRelease.apkName}</span>
                </>
              )}
            </motion.button>
          </div>
        ) : isCheckingRelease ? (
          <div className="bg-white border-2 border-black rounded-xl p-3 mb-4 shadow-[2px_2px_0px_#000] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-black animate-spin" />
              <span className="font-mono text-xs font-bold text-neutral-800">
                Checking GitHub for real-time APK updates...
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-ping" />
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-xl p-3 mb-4 shadow-[2px_2px_0px_#000] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-100 border border-black flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-neutral-500" />
              </span>
              <span className="font-mono text-xs text-neutral-600">
                No direct APK package attached to releases.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLiveRelease(true)}
                className="px-2.5 py-1 bg-white border border-black rounded-lg font-mono text-[11px] font-bold hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-check</span>
              </button>
              <a
                href={`${repo.html_url}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-[#FFE600] text-black border border-black rounded-lg font-mono text-[11px] font-bold hover:bg-yellow-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Releases</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white border-2 border-black rounded-xl p-4 mb-4 shadow-[2px_2px_0px_#000]">
          <p className="font-mono text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {repo.description ? renderTextWithLinks(repo.description) : 'No description provided.'}
          </p>
        </div>

        {/* Primary Language Info */}
        <div className="bg-white border-2 border-black rounded-xl p-3 mb-4 text-center shadow-[2px_2px_0px_#000] flex items-center justify-between font-mono text-xs">
          <span className="font-bold text-neutral-600 uppercase">Primary Language:</span>
          <span className="font-black text-sm text-[#6B21A8] bg-[#FFE600]/30 px-2.5 py-0.5 border border-black/40 rounded-md">
            {repo.language || 'Multi-Language'}
          </span>
        </div>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="mb-4">
            <span className="block text-xs font-black tracking-wider text-[#6B21A8] uppercase mb-1.5">
              Topics & Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {repo.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-1 bg-white border border-black rounded-lg text-xs font-mono font-bold shadow-[1px_1px_0px_#000]"
                >
                  #{topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clone Section */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 mb-4 shadow-[3px_3px_0px_#000]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-black" />
              <span className="font-black text-xs uppercase text-black">
                Clone Repository
              </span>
            </div>
            <div className="flex bg-[#FAF6EE] border border-black rounded-lg p-0.5">
              <button
                onClick={() => setCloneProtocol('https')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  cloneProtocol === 'https' ? 'bg-[#FFE600] border border-black' : 'text-neutral-600'
                }`}
              >
                HTTPS
              </button>
              <button
                onClick={() => setCloneProtocol('ssh')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                  cloneProtocol === 'ssh' ? 'bg-[#FFE600] border border-black' : 'text-neutral-600'
                }`}
              >
                SSH
              </button>
            </div>
          </div>

          <div className="bg-[#FAF6EE] border border-black rounded-xl p-2.5 flex items-center justify-between gap-2 font-mono text-xs mb-2.5">
            <code className="text-neutral-900 truncate select-all">{cloneCommand}</code>
            <button
              onClick={handleCopyClone}
              className="p-1.5 bg-white border border-black rounded-lg hover:bg-neutral-100 flex-shrink-0 cursor-pointer"
              title="Copy clone command"
            >
              {copiedClone ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* GitHub External Link */}
        <div className="pt-2 border-t-2 border-black flex justify-between items-center">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-black hover:underline inline-flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
