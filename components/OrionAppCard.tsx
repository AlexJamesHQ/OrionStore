import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OrionAppItem } from '../types';
import { Download, ExternalLink, Sparkles, Heart, Smartphone, Tv, Monitor, ShieldCheck, Tag, Share2, Check } from 'lucide-react';
import { getDownloadUrlForApp } from '../services/orionAppsService';
import { playRetroSound } from '../services/sfxService';

interface OrionAppCardProps {
  app: OrionAppItem;
  index: number;
  onSelectApp: (app: OrionAppItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (appId: string) => void;
  onDownloadClick?: (app: OrionAppItem) => void;
  onShareApp?: (app: OrionAppItem) => void;
  viewMode?: 'grid' | 'compact';
}

export const OrionAppCard: React.FC<OrionAppCardProps> = ({
  app,
  index,
  onSelectApp,
  isFavorite = false,
  onToggleFavorite,
  onDownloadClick,
  onShareApp,
  viewMode = 'grid',
}) => {
  const [imgError, setImgError] = useState(false);
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [app.id, app.icon]);

  const downloadUrl = getDownloadUrlForApp(app);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadClick) {
      onDownloadClick(app);
    } else if (downloadUrl && downloadUrl !== '#') {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelectApp(app);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(app.id);
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playRetroSound('click');
    if (onShareApp) {
      onShareApp(app);
      return;
    }
    const targetUrl = downloadUrl && downloadUrl !== '#' ? downloadUrl : window.location.href;
    const shareTitle = `${app.name} • ${app.version || 'Latest'} - OrionStore`;
    const cleanDesc = app.description ? app.description.replace(/\n+/g, ' ').slice(0, 140) : 'Verified open-source Android APK';
    const shareText = `📱 ${app.name} • ${app.version || 'Latest'}\n👤 Developer: ${app.author || 'Open Source'}\n📂 Category: ${app.category || 'Utility'}\n📦 Download APK: ${targetUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare({ title: shareTitle, text: shareText, url: targetUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: targetUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    } catch {
      // fallback
    }
  };

  // Platform detection: Android vs PC vs Android TV
  const getPlatformInfo = (app: OrionAppItem) => {
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
        bgColor: 'bg-purple-100 text-purple-900 border-purple-800',
        icon: <Tv className="w-3 h-3 text-purple-700 stroke-[2.5]" />,
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
        bgColor: 'bg-blue-100 text-blue-900 border-blue-800',
        icon: <Monitor className="w-3 h-3 text-blue-700 stroke-[2.5]" />,
      };
    }

    return {
      label: 'Android',
      bgColor: 'bg-emerald-100 text-emerald-900 border-emerald-800',
      icon: <Smartphone className="w-3 h-3 text-emerald-700 stroke-[2.5]" />,
    };
  };

  const platformInfo = getPlatformInfo(app);

  // Color generator for category fallback
  const getCategoryColor = (cat: string) => {
    const c = (cat || '').toLowerCase();
    if (c.includes('media') || c.includes('music') || c.includes('video')) return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-900';
    if (c.includes('social')) return 'bg-blue-100 text-blue-800 border-blue-900';
    if (c.includes('system') || c.includes('util')) return 'bg-amber-100 text-amber-800 border-amber-900';
    if (c.includes('privacy') || c.includes('security')) return 'bg-emerald-100 text-emerald-800 border-emerald-900';
    return 'bg-purple-100 text-purple-800 border-purple-900';
  };

  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => onSelectApp(app)}
        className="group relative bg-white border-2 border-black rounded-xl p-2.5 sm:p-3 shadow-[2px_2px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-black overflow-hidden flex-shrink-0 bg-[#FAF6EE] shadow-[1px_1px_0px_#000]">
            {!imgError && app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#FFE600] flex items-center justify-center font-black text-sm text-black">
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-sm text-black truncate leading-tight group-hover:text-[#6B21A8]">
                {app.name}
              </h4>
              {app.isFeatured && (
                <span className="w-2 h-2 rounded-full bg-[#FF5E00] flex-shrink-0" title="Featured App" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-neutral-600">
              <span className="truncate max-w-[150px]">{app.author || 'Open Source'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleShareClick}
            className="p-1.5 text-neutral-400 hover:text-black cursor-pointer transition-colors"
            title="Share App"
          >
            {isShared ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={handleFavoriteClick}
              className="p-1.5 text-neutral-400 hover:text-rose-500 cursor-pointer"
              title="Bookmark"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadClick}
            className="py-1 px-2.5 sm:px-3 bg-[#FFE600] hover:bg-yellow-300 text-black border border-black rounded-lg font-black text-[11px] uppercase flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Download className="w-3 h-3 stroke-[2.5]" />
            <span>APK</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelectApp(app)}
      className="group bg-white border-2 border-black rounded-xl p-3 sm:p-3.5 shadow-[2.5px_2.5px_0px_#000] hover:shadow-[3.5px_3.5px_0px_#000] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden"
    >
      {/* Top section: Icon + Title + Share & Favorite */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-black overflow-hidden flex-shrink-0 bg-[#FAF6EE] shadow-[1.5px_1.5px_0px_#000]">
              {!imgError && app.icon ? (
                <img
                  src={app.icon}
                  alt={app.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FFE600] flex items-center justify-center font-black text-md text-black">
                  {app.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-black truncate tracking-tight group-hover:text-[#6B21A8] leading-tight">
                  {app.name}
                </h3>
                {(app.isDemo || app.name.toLowerCase().includes('demo')) && (
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[9px] font-black uppercase rounded border border-black shadow-[1px_1px_0px_#000]">
                    DEMO
                  </span>
                )}
                {app.isFeatured && !(app.isDemo || app.name.toLowerCase().includes('demo')) && (
                  <span className="px-1.5 py-0.5 bg-[#FF5E00] text-white text-[9px] font-black uppercase rounded border border-black">
                    HOT
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] font-semibold text-neutral-600 truncate mt-0.5">
                {app.author || 'Open Source Project'}
              </p>

              {/* Category Tag */}
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-black/25 ${getCategoryColor(app.category)}`}>
                  {app.category?.split('/')[0] || 'App'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleShareClick}
              className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Share app"
            >
              {isShared ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {onToggleFavorite && (
              <button
                type="button"
                onClick={handleFavoriteClick}
                className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Bookmark app"
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            )}
          </div>
        </div>

        <p className="font-sans text-xs text-neutral-700 line-clamp-2 leading-relaxed mb-2.5">
          {app.description || 'Verified open-source application release.'}
        </p>

        {app.patches && app.patches.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {app.patches.slice(0, 2).map((patch, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 bg-[#FAF6EE] border border-black rounded text-[9px] font-mono font-bold text-neutral-800"
              >
                ✨ {patch}
              </span>
            ))}
            {app.patches.length > 2 && (
              <span className="px-1 py-0.5 bg-[#FFE600] border border-black rounded text-[9px] font-mono font-bold text-black">
                +{app.patches.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Version + Get APK Button */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
        <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-neutral-600">
          <span>{app.version || 'v1.0'}</span>
          {app.size && app.size !== 'Varies' && <span className="text-neutral-400">• {app.size}</span>}
        </div>

        <button
          type="button"
          onClick={handleDownloadClick}
          className="py-1.5 px-3 bg-[#FFE600] hover:bg-yellow-300 text-black border border-black rounded-lg font-black text-[10px] sm:text-xs uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
        >
          <Download className="w-3 h-3 stroke-[2.5]" />
          <span>GET APK</span>
        </button>
      </div>
    </div>
  );
};
