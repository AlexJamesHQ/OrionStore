import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
import { playRetroSound } from '../services/sfxService';

interface RequestAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export const RequestAppModal: React.FC<RequestAppModalProps> = ({ isOpen, onClose, accentColor }) => {
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('Media Player / Music');
  const [requestedFeature, setRequestedFeature] = useState('Ad-Free / Ad-Blocker');
  const [platform, setPlatform] = useState('Mobile Phone / Tablet');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    // Build mail content cleanly
    const recipient = 'md.amirulislam2373@gmail.com';
    const subject = `[OrionStore Request] - ${appName.trim()} (${category})`;
    const body = `=======================================
ORIONSTORE - NEW APP REQUEST
=======================================

App Name: ${appName.trim()}
Category: ${category}
Requested Feature: ${requestedFeature}
Target Platform: ${platform}

=======================================
Sent via OrionStore App Request Center`;

    // Trigger mailto link safely
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Play retro success sound
    playRetroSound('success');
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-white border-[3px] border-black rounded-3xl shadow-[6px_6px_0px_#000] overflow-hidden z-10 flex flex-col"
      >
        {/* Header Bar */}
        <div className="bg-[#FAF6EE] border-b-2 border-black p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black text-[#FFE600] p-1.5 rounded-lg border border-black" style={{ color: accentColor }}>
              <Mail className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-black">
                Request an App
              </h3>
              <p className="text-[9px] font-mono text-neutral-500 uppercase">Send a structured mod request</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-white border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-50 transition-all flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Form / Content */}
        <div className="p-5">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* App Name Field with max character length */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black text-neutral-600 uppercase">
                  App Name (Max 40 chars) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={appName}
                  onChange={(e) => setAppName(e.target.value.replace(/[^a-zA-Z0-9\s.\-_()]/g, ''))}
                  placeholder="e.g. YouTube ReVanced"
                  className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                />
              </div>

              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black text-neutral-600 uppercase">
                  App Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none uppercase"
                  >
                    <option value="Media Player / Music">Media Player / Music</option>
                    <option value="Ad-Blocker / Privacy">Ad-Blocker / Privacy</option>
                    <option value="Social Media Mod">Social Media Mod</option>
                    <option value="System Utility / Tool">System Utility / Tool</option>
                    <option value="Launcher / Theme">Launcher / Theme</option>
                    <option value="Game Mod">Game Mod</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none font-black text-xs">▼</div>
                </div>
              </div>

              {/* Requested Feature Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black text-neutral-600 uppercase">
                  Required Feature Mod
                </label>
                <div className="relative">
                  <select
                    value={requestedFeature}
                    onChange={(e) => setRequestedFeature(e.target.value)}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none uppercase"
                  >
                    <option value="Ad-Free / Ad-Blocker">Ad-Free / Ad-Blocker</option>
                    <option value="Premium Unlocked">Premium Unlocked</option>
                    <option value="Background Playback">Background Playback</option>
                    <option value="Downloader Integrated">Downloader Integrated</option>
                    <option value="UI Theme Customizer">UI Theme Customizer</option>
                    <option value="Force High Quality / Full HD">Force High Quality / Full HD</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none font-black text-xs">▼</div>
                </div>
              </div>

              {/* Platform Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-black text-neutral-600 uppercase">
                  Target Platform
                </label>
                <div className="relative">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none uppercase"
                  >
                    <option value="Mobile Phone / Tablet">Mobile Phone / Tablet</option>
                    <option value="Android TV / Box">Android TV / Box</option>
                    <option value="PC / Emulator">PC / Emulator</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none font-black text-xs">▼</div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-[#FFE600] border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-yellow-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                <Mail className="w-4 h-4 text-black stroke-[2.5]" />
                <span>GENERATE EMAIL REQUEST</span>
              </button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-green-100 text-green-600 border-2 border-black rounded-2xl flex items-center justify-center shadow-[2.5px_2.5px_0px_#000] mb-4">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h4 className="font-black text-base text-black uppercase mb-1.5">
                Email Prepared!
              </h4>
              <p className="font-mono text-xs text-neutral-600 leading-relaxed max-w-xs mb-5">
                The structured request has been generated. Please complete the sending inside your mail application!
              </p>
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setIsSubmitted(false);
                  setAppName('');
                  onClose();
                }}
                className="py-1.5 px-4 bg-black text-white border-2 border-black rounded-xl text-xs font-mono font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-800 transition-all cursor-pointer"
              >
                CLOSE WINDOW
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
