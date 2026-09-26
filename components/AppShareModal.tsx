import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionAppItem } from '../types';
import { getDownloadUrlForApp } from '../services/orionAppsService';
import { playRetroSound } from '../services/sfxService';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Smartphone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface AppShareModalProps {
  app: OrionAppItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppShareModal: React.FC<AppShareModalProps> = ({ app, isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !app) return null;

  const downloadUrl = getDownloadUrlForApp(app);
  const webStoreUrl = typeof window !== 'undefined' ? `${window.location.origin}/?app=${encodeURIComponent(app.id)}` : '';
  const shareTargetUrl = downloadUrl && downloadUrl !== '#' ? downloadUrl : webStoreUrl;

  const cleanDescription = (app.description || 'Verified open-source Android APK release.')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 160);

  const shareText = `📱 *${app.name}* (Version: ${app.version || 'Latest'})\n👤 Developer: ${app.author || 'Open Source'}\n📂 Category: ${app.category || 'Utility'}\n📦 Package: ${app.packageName || 'android.app'}\n💾 Size: ${app.size || 'Universal'}\n\n📝 ${cleanDescription}...\n\n🚀 Direct APK Download:\n${shareTargetUrl}\n\n⚡ Shared via OrionStore`;

  const handleCopyLink = async () => {
    playRetroSound('click');
    try {
      await navigator.clipboard.writeText(shareTargetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyFullDetails = async () => {
    playRetroSound('click');
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedDetails(true);
      setTimeout(() => setCopiedDetails(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    playRetroSound('click');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${app.name} - OrionStore APK`,
          text: shareText,
          url: shareTargetUrl,
        });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    handleCopyLink();
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareTargetUrl)}&text=${encodeURIComponent(`📱 ${app.name} (${app.version || 'Latest'})\n${cleanDescription}`)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}`)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${app.name} (${app.version || 'Latest'}) on OrionStore! 🚀 ${shareTargetUrl}`)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#ECE8DE] border-[3px] border-black rounded-3xl shadow-[6px_6px_0px_#000] overflow-hidden flex flex-col my-auto"
      >
        {/* Header */}
        <div className="bg-[#FFE600] border-b-2 border-black p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-black text-[#FFE600] flex items-center justify-center border border-black shadow-[1.5px_1.5px_0px_#000]">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base text-black uppercase tracking-tight leading-none">
                Share Application
              </h3>
              <p className="font-mono text-[11px] font-bold text-neutral-800 mt-0.5">
                Verified APK link & details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black text-black hover:bg-neutral-100 flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* App Card Preview Strip */}
          <div className="bg-white border-2 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000] flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl border-2 border-black overflow-hidden flex-shrink-0 bg-[#FAF6EE] shadow-[1.5px_1.5px_0px_#000]">
              {!imgError && app.icon ? (
                <img
                  src={app.icon}
                  alt={app.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FFE600] flex items-center justify-center font-black text-lg text-black">
                  {app.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-sm text-black truncate">{app.name}</h4>
                <span className="px-1.5 py-0.2 bg-[#FAF6EE] border border-black text-[10px] font-mono font-bold rounded">
                  {app.version || 'Latest'}
                </span>
              </div>
              <p className="font-mono text-[11px] font-bold text-neutral-600 truncate mt-0.5">
                {app.author || 'Open Source Project'} • {app.category || 'Utility'}
              </p>
              {app.packageName && (
                <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
                  {app.packageName}
                </p>
              )}
            </div>
          </div>

          {/* Quick Share Link Box */}
          <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-700">
              <span>APK DOWNLOAD LINK</span>
              <span className="text-[10px] text-emerald-700 font-bold">✓ DIRECT & SAFE</span>
            </div>

            <div className="flex items-center gap-2 bg-white border-2 border-black rounded-xl p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={shareTargetUrl}
                className="w-full bg-transparent font-mono text-xs font-bold text-black focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-lg font-mono text-xs font-black text-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] cursor-pointer flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Telegram */}
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playRetroSound('click')}
              className="py-2.5 px-3 bg-[#24A1DE] hover:bg-[#1d8fc7] text-white border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer text-center"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playRetroSound('click')}
              className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20b859] text-black border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer text-center"
            >
              <MessageCircle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>WhatsApp</span>
            </a>

            {/* Twitter / X */}
            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playRetroSound('click')}
              className="py-2.5 px-3 bg-black hover:bg-neutral-800 text-white border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer text-center col-span-2 sm:col-span-1"
            >
              <span className="font-bold text-xs">𝕏 / Post</span>
            </a>
          </div>

          {/* Action Row: Full Info Copy & Native Mobile Share */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyFullDetails}
              className="flex-1 py-2.5 px-3 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
            >
              {copiedDetails ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Copied Formatted Info!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 stroke-[2.5]" />
                  <span>Copy Full Post Card</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="py-2.5 px-4 bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
                <span>Mobile Share</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t-2 border-black p-3 text-center font-mono text-[10px] font-bold text-neutral-600">
          OrionStore • Share verified open-source Android APKs
        </div>
      </motion.div>
    </div>
  );
};
