import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
} from 'lucide-react';
import { formatCompactNumber, formatFileSize } from '../services/githubApi';
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
  const [readme, setReadme] = useState<string | null>(null);
  const [loadingReadme, setLoadingReadme] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

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

  useEffect(() => {
    if (!repo) return;
    setReadme(null);
    setLoadingReadme(true);
    fetch(`https://api.github.com/repos/${repo.full_name}/readme`, {
      headers: { Accept: 'application/vnd.github.v3.raw' },
    })
      .then((res) => (res.ok ? res.text() : null))
      .then(setReadme)
      .catch((err) => {
        console.warn('Failed to fetch README', err);
        setReadme('');
      })
      .finally(() => setLoadingReadme(false));
  }, [repo]);

  useEffect(() => {
    const handleScroll = (e: any) => {
      const container = e.target;
      if (!container) return;
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      setReadingProgress((scrollTop / scrollHeight) * 100);
    };

    const modalContent = document.querySelector('.brutal-scroll');
    modalContent?.addEventListener('scroll', handleScroll);
    return () => modalContent?.removeEventListener('scroll', handleScroll);
  }, [readme]);




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
          <div className="absolute top-0 left-0 h-1 bg-black w-full">
            <div
              className="h-full bg-[#6B21A8] transition-all duration-100"
              style={{ width: `${readingProgress}%` }}
            />
          </div>

          <div className="relative flex items-center justify-between pb-3 border-b-2 border-black mb-4 overflow-hidden pt-2">
            {/* README Loading Progress Bar */}
            {loadingReadme && (
              <div className="absolute top-0 left-0 h-1 bg-black animate-pulse w-full">
                <div className="h-full bg-[#FFE600] animate-[loading_1.5s_infinite]" />
                <style>{`
                  @keyframes loading {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    100% { width: 100%; }
                  }
                `}</style>
              </div>
            )}
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

        {/* Direct APK Release Section if available with Download Animation */}
        {apkRelease && (
          <div className="bg-[#FFFDF0] border-2 border-black rounded-2xl p-4 mb-4 shadow-[3px_3px_0px_#000] space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center">
                <Package className="w-4 h-4 text-black" />
              </span>
              <div>
                <h4 className="font-black text-sm text-black uppercase">
                  Direct APK Download Available
                </h4>
                <p className="font-mono text-xs text-neutral-600">
                  Latest Release: {apkRelease.tagName}
                </p>
              </div>
            </div>

            <div className="bg-white border border-black rounded-xl p-3">
              <div className="flex items-center justify-between font-mono text-xs text-neutral-800">
                <span className="font-bold truncate">{apkRelease.apkName}</span>
                {/* No APK size */}
              </div>
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
        )}

        {/* Description */}
        <div className="bg-white border-2 border-black rounded-xl p-4 mb-4 shadow-[2px_2px_0px_#000]">
          <p className="font-mono text-xs sm:text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {repo.description ? renderTextWithLinks(repo.description) : 'No description provided.'}
          </p>
        </div>

        {/* README Section */}
        <div className="bg-white border-2 border-black rounded-xl p-4 mb-4 shadow-[2px_2px_0px_#000]">
          <style>{`
            .prose-neobrutalist h1, .prose-neobrutalist h2, .prose-neobrutalist h3 {
              font-weight: 900;
              text-transform: uppercase;
              border-bottom: 2px solid #000;
              margin: 1.5rem 0 0.5rem 0;
              color: #000;
            }
            .prose-neobrutalist blockquote {
              border-left: 4px solid #000;
              background: #f0f0f0;
              padding: 1rem;
              margin: 1rem 0;
              font-style: italic;
              border-radius: 0 8px 8px 0;
            }
            .prose-neobrutalist pre {
              background: #000;
              color: #FFE600;
              padding: 1rem;
              border-radius: 12px;
              overflow-x: auto;
              border: 2px solid #000;
              box-shadow: 4px 4px 0px #000;
              margin: 1rem 0;
            }
            .prose-neobrutalist code {
              background: #e5e5e5;
              padding: 0.2rem 0.4rem;
              border-radius: 4px;
              font-family: monospace;
              color: #000;
            }
          `}</style>
          <div className="flex justify-between items-center mb-2">
            <span className="block text-xs font-black tracking-wider text-[#6B21A8] uppercase">
              README
            </span>
            <div className="flex items-center gap-2">
              {readme && (
                <button
                  onClick={() => {
                    const newWindow = window.open('', '_blank');
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>README - ${repo.full_name}</title>
                            <style>
                              body { font-family: sans-serif; padding: 2rem; background: ${isDarkMode ? '#1a1a1a' : '#FAF6EE'}; color: ${isDarkMode ? '#eee' : '#000'}; }
                              .content { max-width: 800px; margin: 0 auto; }
                              pre { background: #000; color: #FFE600; padding: 1rem; border-radius: 12px; }
                            </style>
                          </head>
                          <body>
                            <div class="content">${readme}</div>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="p-1 bg-white border border-black rounded-lg hover:bg-neutral-100 cursor-pointer"
                  title="View Fullscreen"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {loadingReadme ? (
            <p className="font-mono text-xs text-neutral-500">Loading README...</p>
          ) : readme ? (
            <div className={isDarkMode ? 'dark' : ''}>
              {/* Table of Contents */}
              <div className="mb-4 p-3 bg-[#FAF6EE] dark:bg-[#2d2d2d] border border-black dark:border-white rounded-lg">
                <span className="block text-[10px] font-black uppercase text-neutral-700 dark:text-neutral-300 mb-1.5">Table of Contents</span>
                <ul className="space-y-1">
                  {readme.match(/^#{1,3}\s+.+/gm)?.map((header, i) => {
                    const level = header.match(/^#+/)?.[0].length || 0;
                    const text = header.replace(/^#+\s+/, '');
                    const id = text.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <li key={i} style={{ paddingLeft: `${(level - 1) * 10}px` }}>
                        <a href={`#${id}`} className="text-xs font-mono font-bold text-[#6B21A8] dark:text-[#a78bfa] hover:underline">
                          {text}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="prose prose-sm max-w-none font-mono text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed overflow-x-auto prose-neobrutalist dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h1>,
                    h2: ({ children }) => <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h2>,
                    h3: ({ children }) => <h3 id={String(children).toLowerCase().replace(/\s+/g, '-')}>{children}</h3>,
                  }}
                >
                  {readme}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-center gap-1 mb-1">
              <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-mono font-bold text-neutral-600 uppercase">Stars</span>
            </div>
            <div className="font-black text-xl text-black font-mono tabular-nums">
              {formatCompactNumber(repo.stargazers_count)}
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-xl p-3 text-center shadow-[2px_2px_0px_#000]">
            <div className="text-xs font-mono font-bold text-neutral-600 uppercase mb-1">
              Primary Language
            </div>
            <div className="font-black text-base text-black font-mono truncate">
              {repo.language || 'Multi'}
            </div>
          </div>
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
