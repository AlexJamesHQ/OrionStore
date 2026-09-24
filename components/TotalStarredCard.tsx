import React from 'react';
import { StarIcon } from './Icons';
import { BookOpen, Package, RefreshCw } from 'lucide-react';

interface StatsLineCardProps {
  publicCount: number;
  starredCount: number;
  apkCount: number;
  activeTab: 'public' | 'starred' | 'apk';
  onSelectTab: (tab: 'public' | 'starred' | 'apk') => void;
  displayName: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export const TotalStarredCard: React.FC<StatsLineCardProps> = ({
  publicCount,
  starredCount,
  apkCount,
  activeTab,
  onSelectTab,
  displayName,
  isRefreshing = false,
  onRefresh,
}) => {
  return (
    <div className="relative w-full my-5 sm:my-6 select-none">
      {/* Outer Neobrutalist Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border-[3px] sm:border-4 border-black p-4 sm:p-6 shadow-[5px_5px_0px_#000] sm:shadow-[7px_7px_0px_#000]">
        
        {/* Header Label inside Card */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-black mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-[#FFE600] border-2 border-black inline-block"></span>
            <span className="text-[#6B21A8] font-black text-xs sm:text-sm tracking-[0.16em] uppercase">
              {displayName} REPOSITORIES
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh GitHub stats and repositories"
                className="p-1 sm:px-2 sm:py-1 bg-[#FAF6EE] hover:bg-[#FFE600] border-2 border-black rounded-lg text-black font-black text-[10px] uppercase flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
            <span className="text-[10px] sm:text-xs font-mono font-bold text-neutral-500 uppercase">
              CLICK TO VIEW
            </span>
          </div>
        </div>

        {/* The 3 Stats in ONE BEAUTIFUL LINE: 1. Public, 2. Starred, 3. Favorites/APK */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          
          {/* 1. PUBLIC REPOSITORIES (First) */}
          <button
            onClick={() => onSelectTab('public')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-black text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'public'
                ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] -translate-y-0.5'
                : 'bg-[#FAF6EE] hover:bg-neutral-100 shadow-[1px_1px_0px_#000] sm:shadow-[2px_2px_0px_#000]'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 text-black font-black text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black flex-shrink-0" />
              <span>PUBLIC</span>
            </div>
            <div className="font-black text-2xl sm:text-4xl md:text-5xl text-[#FF5E00] font-mono tabular-nums leading-none my-0.5 sm:my-1">
              {publicCount}
            </div>
            <div className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-700 uppercase tracking-tight">
              <span className="sm:hidden">REPOS</span>
              <span className="hidden sm:inline">REPOSITORIES</span>
            </div>
          </button>

          {/* 2. STARRED REPOSITORIES (Second) */}
          <button
            onClick={() => onSelectTab('starred')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-black text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              activeTab === 'starred'
                ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] -translate-y-0.5'
                : 'bg-[#FAF6EE] hover:bg-neutral-100 shadow-[1px_1px_0px_#000] sm:shadow-[2px_2px_0px_#000]'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 text-black font-black text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider">
              <StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              <span>STARRED</span>
            </div>
            <div className="font-black text-2xl sm:text-4xl md:text-5xl text-[#FF5E00] font-mono tabular-nums leading-none my-0.5 sm:my-1">
              {starredCount}
            </div>
            <div className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-700 uppercase tracking-tight">
              <span className="sm:hidden">STARRED</span>
              <span className="hidden sm:inline">FAVORITES</span>
            </div>
          </button>

          {/* 3. APK RELEASES (Third) */}
          <button
            onClick={() => onSelectTab('apk')}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-[2.5px] border-black text-center transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${
              activeTab === 'apk'
                ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] sm:shadow-[4px_4px_0px_#000] -translate-y-0.5'
                : 'bg-[#FAF6EE] hover:bg-neutral-100 shadow-[1px_1px_0px_#000] sm:shadow-[2px_2px_0px_#000]'
            }`}
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-1 text-black font-black text-[10px] sm:text-xs uppercase tracking-tight sm:tracking-wider">
              <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black stroke-[2.5] flex-shrink-0" />
              <span>APK APPS</span>
            </div>
            <div className="font-black text-2xl sm:text-4xl md:text-5xl text-[#FF5E00] font-mono tabular-nums leading-none my-0.5 sm:my-1">
              {apkCount}
            </div>
            <div className="text-[9px] sm:text-[11px] font-mono font-bold text-neutral-700 uppercase tracking-tight">
              <span className="sm:hidden">DOWNLOAD</span>
              <span className="hidden sm:inline">RELEASES</span>
            </div>
          </button>

        </div>

        {/* Live sync indicator footer - NO EMOJIS */}
        <div className="mt-4 pt-3 border-t border-dashed border-neutral-300 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black/40"></span>
            <span className="font-bold text-neutral-800">
              ACTIVE VIEW: {activeTab === 'public' ? 'PUBLIC REPOSITORIES' : activeTab === 'starred' ? 'STARRED REPOSITORIES' : 'APK DOWNLOAD RELEASES'}
            </span>
          </div>

          <span className="text-[11px] text-neutral-500 font-bold">
            {activeTab === 'public' ? `${publicCount} REPOSITORIES` : activeTab === 'starred' ? `${starredCount} REPOSITORIES` : `${apkCount} DOWNLOADABLE APKS`}
          </span>
        </div>

      </div>
    </div>
  );
};
