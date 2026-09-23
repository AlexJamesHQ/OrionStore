import React, { useState } from 'react';
import { X, Download, Package, ExternalLink, Copy, Check, Globe } from 'lucide-react';
import { formatFileSize } from '../services/githubApi';

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

export interface InAppDownloadInfo {
  repoName: string;
  tagName: string;
  apkName: string;
  downloadUrl: string;
  sizeBytes?: number;
  releaseNotes?: string;
  githubUrl: string;
}

interface InAppDownloadModalProps {
  isOpen: boolean;
  info: InAppDownloadInfo | null;
  onClose: () => void;
}

export const InAppDownloadModal: React.FC<InAppDownloadModalProps> = ({ isOpen, info, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !info) return null;

  const handleCopyLink = () => {
    if (!info.downloadUrl) return;
    navigator.clipboard.writeText(info.downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card - Neobrutalist Style */}
      <div className="relative w-full max-w-lg md:max-w-xl bg-[#FAF6EE] rounded-3xl border-[3.5px] border-black p-6 shadow-[8px_8px_0px_#000] z-10 animate-pop-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-black mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <Package className="w-4 h-4 text-black" />
            </span>
            <div>
              <h3 className="font-black text-base uppercase tracking-tight text-black leading-none">
                APK Direct Download
              </h3>
              <span className="text-[10px] font-mono text-neutral-600 font-semibold">
                Universal Browser & Mobile Support
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* APK Overview Info Card */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 mb-4 shadow-[3px_3px_0px_#000] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-lg text-black uppercase tracking-tight truncate">
              {info.repoName}
            </h4>
            <span className="text-xs font-mono font-bold bg-[#FFE600] border border-black px-2 py-0.5 rounded shadow-[1px_1px_0px_#000] flex-shrink-0">
              {info.tagName}
            </span>
          </div>

          <div className="bg-[#FAF6EE] border border-black/30 rounded-xl p-3 font-mono text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-black truncate">{info.apkName}</span>
              {/* No APK size */}
            </div>
            <p className="text-[11px] text-neutral-600">
              Direct package file. Supported on Chrome, Microsoft Edge, and all Android browsers.
            </p>
          </div>

          {info.releaseNotes && (
            <div className="bg-white border border-black/20 rounded-xl p-2.5 max-h-28 overflow-y-auto brutal-scroll font-mono text-[11px] text-neutral-700 leading-relaxed whitespace-pre-wrap">
              <p className="font-black text-black uppercase text-[10px] mb-1">Release Notes:</p>
              <div>{renderTextWithLinks(info.releaseNotes)}</div>
            </div>
          )}
        </div>

        {/* Action Buttons: Direct Browser Trigger (No Pop-up Blocking) */}
        <div className="space-y-2.5 mb-4">
          <a
            href={info.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="w-full py-3.5 px-4 bg-[#FFE600] border-2 border-black rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-black no-underline"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download APK (Chrome / Edge / Browser)</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-black">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </button>

            <a
              href={info.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer text-black no-underline"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-700" />
              <span>Open In Browser</span>
            </a>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t-2 border-black">
          <a
            href={info.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold text-neutral-700 hover:text-black flex items-center gap-1"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onClose}
            className="py-1.5 px-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
