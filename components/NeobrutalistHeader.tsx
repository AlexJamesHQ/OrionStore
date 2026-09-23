import React from 'react';
import { GitHubUserProfile } from '../types';
import { Settings as SettingsIcon, Sparkles, Clock } from 'lucide-react';
import { GitHubIcon } from './Icons';

interface NeobrutalistHeaderProps {
  user: GitHubUserProfile;
  onOpenMenu: () => void;
  hasUpdate?: boolean;
  onOpenUpdate?: () => void;
  lastSynced?: Date;
}

export const NeobrutalistHeader: React.FC<NeobrutalistHeaderProps> = ({
  user,
  onOpenMenu,
  hasUpdate = false,
  onOpenUpdate,
  lastSynced,
}) => {
  const displayName = (user.name || user.login).toUpperCase();

  return (
    <header className="w-full bg-[#FFE600] border-b-[3px] sm:border-b-4 border-black px-4 py-3 sm:py-3.5 sticky top-0 z-30 select-none shadow-[0_2px_0px_#000] transition-all">
      <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
        {/* Left: Avatar + Clean Name Display */}
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${user.login} on GitHub`}
            className="group relative w-11 h-11 sm:w-12 sm:h-12 bg-white rounded-xl border-2 sm:border-[2.5px] border-black p-0.5 shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200 flex-shrink-0 flex items-center justify-center overflow-hidden"
          >
            <img
              src={user.avatar_url}
              alt={user.login}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-[8px] transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=FFE600&color=000&bold=true`;
              }}
            />
          </a>

          {/* Clean Name Display + Sync Timestamp */}
          <div className="flex flex-col min-w-0 justify-center">
            <a
              href={user.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black font-black text-lg sm:text-xl tracking-tight truncate hover:opacity-80 transition-opacity leading-none"
            >
              {displayName}
            </a>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono font-semibold text-black/70 truncate">
                @{user.login}
              </span>
              {lastSynced && (
                <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-black/60 bg-black/5 px-1 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>
...

        {/* Right: Update button, GitHub profile, and Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Update / APK Download Badge: Always Visible, Striking Red & Yellow Neobrutalist Style */}
          {onOpenUpdate && (
            <button
              onClick={onOpenUpdate}
              title="View APK releases and updates"
              className="h-10 sm:h-11 px-3.5 bg-red-600 text-[#FFE600] rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] hover:bg-red-700 active:translate-x-[1px] active:translate-y-[1px] font-black text-xs uppercase flex items-center gap-2 transition-all cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFE600] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFE600] border border-black"></span>
              </span>
              <span className="hidden sm:inline text-[#FFE600] font-black">Update Available</span>
              <span className="sm:hidden text-[#FFE600] font-black">Update</span>
            </button>
          )}

          {/* GitHub Button */}
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open GitHub Profile"
            aria-label="GitHub Profile"
            className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] hover:bg-neutral-50 hover:shadow-[4px_4px_0px_#000] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200 flex items-center justify-center text-black cursor-pointer"
          >
            <GitHubIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          </a>

          {/* Settings Button */}
          <button
            onClick={onOpenMenu}
            title="Settings"
            aria-label="Settings"
            className="h-10 sm:h-11 px-3 bg-white rounded-xl border-2 sm:border-[2.5px] border-black shadow-[2px_2px_0px_#000] sm:shadow-[3px_3px_0px_#000] hover:bg-[#FAF6EE] hover:shadow-[4px_4px_0px_#000] hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-200 flex items-center gap-1.5 text-black font-black text-xs uppercase cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.4]" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
