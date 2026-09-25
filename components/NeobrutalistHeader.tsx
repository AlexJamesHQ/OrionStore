import React from 'react';
import { GitHubUserProfile } from '../types';
import { Settings as SettingsIcon, Sparkles, Clock, RefreshCw } from 'lucide-react';
import { GitHubIcon } from './Icons';

interface NeobrutalistHeaderProps {
  user: GitHubUserProfile;
  onOpenMenu: () => void;
  hasUpdate?: boolean;
  onOpenUpdate?: () => void;
  lastSynced?: Date;
  onSync?: () => void;
  isRefreshing?: boolean;
}

export const NeobrutalistHeader: React.FC<NeobrutalistHeaderProps> = ({
  user,
  onOpenMenu,
  hasUpdate = false,
  onOpenUpdate,
  lastSynced,
  onSync,
  isRefreshing = false,
}) => {
  const displayName = (user.name || user.login).toUpperCase();

  return (
    <header className="w-full bg-[#FFE600] border-b-[3px] sm:border-b-4 border-black px-3 sm:px-4 py-2.5 sm:py-3.5 sticky top-0 z-30 select-none shadow-[0_2px_0px_#000] transition-all">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Avatar + Clean Name Display */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${user.login} on GitHub`}
            className="group relative w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] border-black p-0.5 shadow-[2px_2px_0px_#000] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200 flex-shrink-0 flex items-center justify-center overflow-hidden"
          >
            <img
              src={user.avatar_url}
              alt={user.login}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[6px] sm:rounded-[8px] transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=FFE600&color=000&bold=true`;
              }}
            />
          </a>

          {/* Clean Name Display + Username */}
          <div className="flex flex-col min-w-0 justify-center">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-black text-xs sm:text-base md:text-lg tracking-tight truncate hover:opacity-80 transition-opacity leading-tight"
            >
              {displayName}
            </a>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-black/75 truncate">
                @{user.login}
              </span>
              {lastSynced && (
                <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] font-mono font-bold text-black/60 bg-black/5 px-1 rounded flex-shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Update button, GitHub profile, and Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Update / APK Download Badge */}
          {onOpenUpdate && (
            <button
              onClick={onOpenUpdate}
              title="View APK releases and updates"
              className="h-8 sm:h-10 px-2 sm:px-3.5 bg-red-600 text-[#FFE600] rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:bg-red-700 active:translate-x-[1px] active:translate-y-[1px] font-black text-[10px] sm:text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE600] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-[#FFE600] border border-black"></span>
              </span>
              <span className="hidden sm:inline font-black tracking-wide">Update</span>
              <span className="sm:hidden font-black">APK</span>
            </button>
          )}

          {/* GitHub Button */}
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open GitHub Profile"
            aria-label="GitHub Profile"
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:bg-neutral-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center text-black cursor-pointer"
          >
            <GitHubIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>

          {/* Sync Button */}
          {onSync && (
            <button
              onClick={onSync}
              disabled={isRefreshing}
              title="Sync Orion Database"
              className="h-8 sm:h-10 px-2 sm:px-3 bg-white rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:bg-yellow-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-black ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Sync</span>
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={onOpenMenu}
            title="Settings"
            aria-label="Settings"
            className="w-8 h-8 sm:w-auto sm:h-10 sm:px-3 bg-white rounded-lg sm:rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:bg-[#FAF6EE] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center sm:gap-1.5 text-black font-black text-xs uppercase cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
