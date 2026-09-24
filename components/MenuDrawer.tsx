import React from 'react';
import { X, Zap, ExternalLink, Sparkles } from 'lucide-react';
import { GitHubUserProfile } from '../types';
import { GitHubIcon, TelegramIcon, FacebookIcon, InstagramIcon, StarIcon } from './Icons';

export type ApkFilterMode = 'all' | 'apk_only' | 'non_apk_only';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GitHubUserProfile;
  onSwitchUser: (username: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  availableCategories: string[];
  sortBy: 'updated' | 'stars' | 'name';
  onSelectSortBy: (sort: 'updated' | 'stars' | 'name') => void;
  apkFilterMode?: ApkFilterMode;
  onSelectApkFilterMode?: (mode: ApkFilterMode) => void;
  hideNonApk?: boolean;
  onToggleHideNonApk?: (hide: boolean) => void;
  onOpenTelegram: () => void;
  totalStarredCount: number;
  onOpenUpdate?: () => void;
  hasUpdate?: boolean;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  selectedCategory,
  onSelectCategory,
  availableCategories,
  sortBy,
  onSelectSortBy,
  apkFilterMode = 'all',
  onSelectApkFilterMode,
  hideNonApk = false,
  onToggleHideNonApk,
  onOpenUpdate,
  hasUpdate = false,
}) => {
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

  // The profile shown here is the currently loaded GitHub account
  const developerProfile = currentUser;

  const handleQuickLoad = () => {
    onSwitchUser(currentUser.login || 'AlexJamesHQ');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#FAF6EE] h-full border-l-[3.5px] border-black shadow-[-8px_0px_0px_#000] p-5 sm:p-6 overflow-y-auto brutal-scroll z-10 flex flex-col justify-between transform transition-transform duration-300 ease-out">
        {/* Top Section */}
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-5">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#FFE600] border-2 border-black inline-block"></span>
              <h3 className="font-black text-lg tracking-tight text-black uppercase">
                Settings
              </h3>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center cursor-pointer transition-all"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* User Account Info Card - Current GitHub account with Quick button */}
          <div className="mb-4 bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
            <div className="flex items-center gap-3">
              <img
                src={developerProfile.avatar_url}
                alt={developerProfile.login}
                className="w-12 h-12 rounded-xl border-2 border-black object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Alex+James&background=FFE600&color=000&bold=true`;
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-black tracking-tight truncate">
                    {developerProfile.name || developerProfile.login}
                  </h4>
                  <span className="text-[10px] font-mono font-bold bg-[#FFE600] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                    GITHUB
                  </span>
                </div>
                <p className="font-mono text-xs font-semibold text-neutral-600 truncate">
                  @{developerProfile.login}
                </p>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#6B21A8] mt-1">
                  <StarIcon className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{developerProfile.starred_count || 0} Starred Repositories</span>
                </div>
              </div>
            </div>

            {/* Dedicated Quick Button to load Alex James's profile */}
            <div className="pt-3 mt-3 border-t-2 border-black/10">
              <button
                type="button"
                onClick={handleQuickLoad}
                className="w-full py-2.5 px-4 bg-[#FFE600] border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] hover:bg-yellow-300 hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>Quick</span>
              </button>
            </div>
          </div>

          {/* In-App APK Updates Option */}
          {onOpenUpdate && (
            <div className="mb-6 bg-white border-2 border-black rounded-2xl p-3.5 shadow-[3px_3px_0px_#000]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wider text-[#6B21A8] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>App & APK Updater</span>
                </span>
                {hasUpdate && (
                  <span className="text-[10px] font-mono font-black bg-red-500 text-white px-1.5 py-0.5 rounded">
                    NEW UPDATE
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpdate();
                }}
                className={`w-full py-2 px-3 border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
                  hasUpdate
                    ? 'bg-[#FFE600] hover:bg-yellow-300 animate-pulse'
                    : 'bg-[#FAF6EE] hover:bg-neutral-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{hasUpdate ? 'Update APK Now' : 'Check for Updates'}</span>
              </button>
            </div>
          )}

          {/* Sort By Section */}
          <div className="mb-6 bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
            <label className="block text-xs font-black tracking-wider text-[#6B21A8] uppercase mb-2">
              Sort Repositories:
            </label>
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {[
                { id: 'updated', label: 'Updated' },
                { id: 'stars', label: 'Stars' },
                { id: 'name', label: 'A to Z' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectSortBy(item.id as any)}
                  className={`p-2 text-center rounded-xl border-2 border-black font-black text-xs uppercase transition-all cursor-pointer ${
                    sortBy === item.id
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] border-black scale-[1.02]'
                      : 'bg-[#FAF6EE] hover:bg-neutral-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* APK Filter Mode Control */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-black/30">
              <label className="block text-[11px] font-black tracking-wider text-black uppercase mb-2">
                APK Repos Filter:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectApkFilterMode) onSelectApkFilterMode('all');
                    if (onToggleHideNonApk) onToggleHideNonApk(false);
                  }}
                  className={`p-2 rounded-xl border-2 border-black font-black text-[10px] uppercase text-center transition-all cursor-pointer ${
                    apkFilterMode === 'all'
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] border-black scale-[1.02]'
                      : 'bg-[#FAF6EE] hover:bg-neutral-100'
                  }`}
                >
                  All (APK First)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectApkFilterMode) onSelectApkFilterMode('apk_only');
                    if (onToggleHideNonApk) onToggleHideNonApk(true);
                  }}
                  className={`p-2 rounded-xl border-2 border-black font-black text-[10px] uppercase text-center transition-all cursor-pointer ${
                    apkFilterMode === 'apk_only'
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] border-black scale-[1.02]'
                      : 'bg-[#FAF6EE] hover:bg-neutral-100'
                  }`}
                >
                  APK Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectApkFilterMode) onSelectApkFilterMode('non_apk_only');
                    if (onToggleHideNonApk) onToggleHideNonApk(false);
                  }}
                  className={`p-2 rounded-xl border-2 border-black font-black text-[10px] uppercase text-center transition-all cursor-pointer ${
                    apkFilterMode === 'non_apk_only'
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000] border-black scale-[1.02]'
                      : 'bg-[#FAF6EE] hover:bg-neutral-100'
                  }`}
                >
                  Without APK
                </button>
              </div>
              <p className="font-mono text-[10px] text-neutral-600 mt-1.5">
                {apkFilterMode === 'all' && '★ All repos shown, with APK apps sorted first.'}
                {apkFilterMode === 'apk_only' && '★ Showing only repos with APK downloads.'}
                {apkFilterMode === 'non_apk_only' && '★ Showing only repos without APK.'}
              </p>
            </div>
          </div>

          {/* Filter by Semantic Category */}
          <div className="mb-6 bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000]">
            <label className="block text-xs font-black tracking-wider text-[#6B21A8] uppercase mb-2">
              Filter by Category:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto brutal-scroll p-1">
              <button
                onClick={() => onSelectCategory('All')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer ${
                  selectedCategory === 'All'
                    ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                    : 'bg-[#FAF6EE] hover:bg-neutral-100'
                }`}
              >
                All Categories
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-black transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                      : 'bg-[#FAF6EE] hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Social Media Hub: matching website colors (Yellow, White, Black Neobrutalism) */}
        <div className="pt-4 border-t-2 border-black space-y-2">
          <label className="block text-[11px] font-black tracking-wider text-neutral-700 uppercase mb-1">
            Developer Social Profiles:
          </label>

          {/* Telegram Channel Button - Neobrutalist Theme Matching */}
          <a
            href="https://t.me/ALEX_JAMES_DEV"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-2.5 bg-[#FFE600] text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-between shadow-[2px_2px_0px_#000] hover:bg-yellow-300 hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <TelegramIcon className="w-4 h-4 text-black" />
              <span>Telegram Channel</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Facebook & Instagram Buttons - Neobrutalist Theme Matching */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://www.facebook.com/share/1J6T4MuGbJ/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-[#FAF6EE] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <FacebookIcon className="w-4 h-4 text-black" />
              <span>Facebook</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>

            <a
              href="https://www.instagram.com/alex.james.dev?stkn=dDg5cG5nZTB6aDBx"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-[#FAF6EE] hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <InstagramIcon className="w-4 h-4 text-black" />
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </a>
          </div>

          {/* GitHub Profile Button */}
          <a
            href={developerProfile.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-2.5 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000] hover:bg-neutral-50 hover:shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <GitHubIcon className="w-4 h-4" />
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
        </div>
      </div>
    </div>
  );
};
