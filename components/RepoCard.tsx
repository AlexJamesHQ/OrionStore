import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Repository, hasActualApk } from '../types';
import { formatCompactNumber, formatFileSize } from '../services/githubApi';
import { ExternalLink, Copy, Check, Download, Package, Tag, Share2 } from 'lucide-react';
import { StarIcon } from './Icons';
import { InAppDownloadInfo } from './InAppDownloadModal';

interface RepoCardProps {
  repo: Repository;
  onSelectRepo?: (repo: Repository) => void;
  onOpenInAppDownload?: (info: InAppDownloadInfo) => void;
  index: number;
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  tx: number;
  ty: number;
  rot: number;
  shape: 'circle' | 'square' | 'star';
}

// Category badge color mapping (Neobrutalist pastel style)
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Media & Music': { bg: '#E0F2FE', text: '#0369A1', border: '#0284C7' },
  'Android & APK': { bg: '#FEF3C7', text: '#B45309', border: '#D97706' },
  'AI & Vision': { bg: '#EDE9FE', text: '#6D28D9', border: '#7C3AED' },
  'Web & 3D': { bg: '#FCE7F3', text: '#BE185D', border: '#DB2777' },
  'Tools & Utilities': { bg: '#F3F4F6', text: '#374151', border: '#4B5563' },
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Rust: '#DEA584',
  Kotlin: '#7F52FF',
  Java: '#007396',
  Go: '#00ADD8',
  C: '#555555',
  'C++': '#F34B7D',
  Dart: '#00B4AB',
  Shell: '#89E051',
  HTML: '#E34C26',
  CSS: '#563D7C',
};

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

export const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  onSelectRepo,
  onOpenInAppDownload,
  index,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [particles, setParticles] = useState<BurstParticle[]>([]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(repo.html_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: repo.name,
      text: repo.description || `Check out ${repo.name} on GitHub!`,
      url: repo.html_url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn('Native share failed, falling back to clipboard copy', err);
      }
    }

    try {
      await navigator.clipboard.writeText(repo.html_url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Could not copy link: ', err);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const colors = ['#FFE600', '#FF5E00', '#7C3AED', '#00E5FF', '#FF007F', '#39FF14'];
    const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];

    const newParticles: BurstParticle[] = Array.from({ length: 12 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 80;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const rot = (Math.random() - 0.5) * 360;
      return {
        id: Date.now() + idx + Math.random(),
        x: clickX,
        y: clickY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 14 + Math.random() * 12,
        tx,
        ty,
        rot,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 750);

    if (onSelectRepo) {
      onSelectRepo({
        ...repo,
        latestRelease: liveRelease || repo.latestRelease,
      });
    }
  };

  // Detect authentic APK release either from latestRelease or live release
  const [liveRelease, setLiveRelease] = useState<any>(null);

  useEffect(() => {
    // If repo already has a defined release with apk, use it
    if (repo.latestRelease && (repo.latestRelease.apkName || repo.latestRelease.downloadUrl)) {
      return;
    }

    let isMounted = true;
    const fetchLiveRelease = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/releases`);
        if (res.ok) {
          const releases = await res.json();
          if (Array.isArray(releases) && releases.length > 0) {
            for (const r of releases) {
              const apkAsset = r.assets?.find((a: any) => a.name?.toLowerCase().endsWith('.apk'));
              if (apkAsset) {
                if (isMounted) {
                  setLiveRelease({
                    tagName: r.tag_name || r.name,
                    name: r.name || `${repo.name} Release`,
                    apkName: apkAsset.name,
                    downloadUrl: apkAsset.browser_download_url,
                    sizeBytes: apkAsset.size,
                    body: r.body || repo.description,
                  });
                }
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Failed live release fetch for', repo.full_name, err);
      }
    };

    fetchLiveRelease();
    return () => {
      isMounted = false;
    };
  }, [repo.full_name, repo.latestRelease]);

  // Ensure any authentic APK / Android app has an APK release for direct downloading
  const apkRelease =
    (repo.latestRelease && (repo.latestRelease.apkName || repo.latestRelease.downloadUrl)
      ? repo.latestRelease
      : liveRelease) ||
    (hasActualApk(repo)
      ? {
          tagName: 'Latest APK',
          name: `${repo.name} Android Package`,
          apkName: `${repo.name}.apk`,
          downloadUrl: `${repo.html_url}/releases`,
          sizeBytes: undefined,
          body: repo.description,
        }
      : null);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!apkRelease) return;
    if (onOpenInAppDownload) {
      onOpenInAppDownload({
        repoName: repo.name,
        tagName: apkRelease.tagName,
        apkName: apkRelease.apkName,
        downloadUrl: apkRelease.downloadUrl,
        sizeBytes: apkRelease.sizeBytes,
        releaseNotes: (apkRelease as any).body || repo.description,
        githubUrl: repo.html_url,
      });
    }
  };

  const categoryName = apkRelease ? 'Android & APK' : repo.category || 'Tools & Utilities';
  const catStyle = CATEGORY_STYLES[categoryName] || CATEGORY_STYLES['Tools & Utilities'];
  const langColor = LANGUAGE_COLORS[repo.language || ''] || '#999';

  const [downloadCount, setDownloadCount] = useState<number | null>(null);

  useEffect(() => {
    if (!apkRelease || !repo.full_name) return;
    
    const fetchDownloads = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo.full_name}/releases`);
        if (res.ok) {
          const releases = await res.json();
          const count = releases.reduce((acc: number, r: any) => 
            acc + (r.assets?.reduce((aAcc: number, a: any) => aAcc + a.download_count, 0) || 0), 0);
          setDownloadCount(count);
        }
      } catch (e) {
        console.warn('Failed to fetch download count', e);
      }
    };
    fetchDownloads();
  }, [repo.full_name, apkRelease]);

  return (
    <motion.div
      initial={{ opacity: 0.82, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ 
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl sm:rounded-2xl border-[2.5px] sm:border-[3px] border-black p-4 sm:p-5 shadow-[3px_3px_0px_#000] sm:shadow-[5px_5px_0px_#000] hover:shadow-[8px_8px_0px_#000] transition-all cursor-pointer overflow-visible"
    >
      <style>{`
        @keyframes neobrutalist-burst {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot));
            opacity: 0;
          }
        }
        .animate-burst-particle {
          animation: neobrutalist-burst 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* Neobrutalist Bursts */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              '--rot': `${p.rot}deg`,
            } as React.CSSProperties}
            className="animate-burst-particle select-none"
          >
            <svg viewBox="0 0 50 50" className="w-full h-full drop-shadow-[2px_2px_0px_#000]">
              {p.shape === 'star' && (
                <polygon
                  points="25,2 32,18 49,18 35,28 40,45 25,35 10,45 15,28 1,18 18,18"
                  fill={p.color}
                  stroke="#000"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
              )}
              {p.shape === 'square' && (
                <rect
                  x="4"
                  y="4"
                  width="42"
                  height="42"
                  rx="4"
                  fill={p.color}
                  stroke="#000"
                  strokeWidth="4"
                />
              )}
              {p.shape === 'circle' && (
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill={p.color}
                  stroke="#000"
                  strokeWidth="4"
                />
              )}
            </svg>
          </div>
        ))}
      </div>
      {/* Top Row: Repository Name + Category Tag + Quick Copy */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-black text-base sm:text-lg text-black hover:text-[#7C3AED] hover:underline transition-colors tracking-tight break-all leading-snug flex items-center gap-1.5"
            >
              <span>{repo.name}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 flex-shrink-0" />
            </a>

            {/* Semantic Category Tag */}
            <span
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border border-black uppercase whitespace-nowrap shadow-[1px_1px_0px_#000]"
              style={{
                backgroundColor: catStyle.bg,
                color: catStyle.text,
              }}
            >
              {categoryName}
            </span>
            
            {/* Language Indicator */}
            {repo.language && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }}></span>
                <span className="font-mono text-[10px] font-bold text-neutral-600">{repo.language}</span>
              </div>
            )}

            {/* Download Count Badge */}
            {downloadCount !== null && downloadCount > 0 && (
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-black bg-white text-black shadow-[1px_1px_0px_#000]">
                {formatCompactNumber(downloadCount)} ↓
              </span>
            )}
          </div>

          <span className="font-mono text-xs text-neutral-500 truncate block">
            {repo.full_name}
          </span>
        </div>

        {/* Action Buttons: Share & Copy */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleShare}
            title="Share repository"
            className="p-1.5 rounded-lg border border-black/20 hover:border-black text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            {shared ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleCopy}
            title="Copy repository link"
            className="p-1.5 rounded-lg border border-black/20 hover:border-black text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Description in Clean Monospace Font */}
      <p className="font-mono text-xs sm:text-[13px] text-neutral-800 leading-relaxed mt-2 mb-3.5 line-clamp-3">
        {repo.description ? renderTextWithLinks(repo.description) : 'No description provided for this repository.'}
      </p>

      {/* Direct APK Download Section if Available */}
      {apkRelease && (
        <div className="mb-3.5 p-3 bg-[#FFFDF0] border-2 border-black rounded-xl space-y-2.5 shadow-[2px_2px_0px_#000]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#FFE600] border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_#000]">
                <Package className="w-4 h-4 text-black stroke-[2.5]" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs text-black uppercase">
                    APK Release:
                  </span>
                  <span className="font-mono text-[11px] font-bold bg-[#FFE600] border border-black px-1.5 py-0.2 rounded text-black truncate">
                    {apkRelease.tagName}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-neutral-600 truncate mt-0.5">
                  {apkRelease.apkName}
                </p>
              </div>
            </div>

            {/* Download APK Button: Full width on mobile for easy tapping with bouncy download animation */}
            <motion.button
              type="button"
              onClick={handleDownloadClick}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-[#FFE600] border-2 border-black rounded-lg font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] hover:bg-yellow-300 transition-colors cursor-pointer flex-shrink-0 group overflow-hidden"
              title={`Download ${apkRelease.apkName}`}
            >
              <motion.div
                animate={{ y: [0, -2.5, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="flex items-center justify-center"
              >
                <Download className="w-4 h-4 stroke-[2.5] text-black group-hover:translate-y-[1px] transition-transform" />
              </motion.div>
              <span>Download APK</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Row of Meta-Information: Stars + Category + Timestamp */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-800 pt-2.5 border-t border-neutral-100">
        {/* Star Icon + Count */}
        <div className="flex items-center gap-1.5 tabular-nums font-mono">
          <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
          <span className="text-black font-semibold text-xs sm:text-sm">
            {formatCompactNumber(repo.stargazers_count)}
          </span>
          <span className="text-neutral-500 text-[11px] font-mono">stars</span>
        </div>

        {/* Category Pill */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600">
          <Tag className="w-3 h-3 text-neutral-400" />
          <span>{categoryName}</span>
        </div>

        {/* Updated Relative timestamp */}
        {repo.updated_at && (
          <span className="hidden sm:inline text-[11px] font-mono text-neutral-500 ml-auto">
            updated {new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  );
};
