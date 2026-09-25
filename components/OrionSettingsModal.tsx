import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  Palette,
  DownloadCloud,
  ShieldCheck,
  HardDrive,
  User,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Smartphone,
  ExternalLink,
  Trash2,
  Sliders,
  Bell,
  Heart,
} from 'lucide-react';

export interface StoreSettings {
  theme: 'oled' | 'dark' | 'dusk' | 'light';
  accentColor: string;
  storeLayout: 'modern' | 'classic';
  glassEffect: boolean;
  enableAnimations: boolean;
  downloadMirror: 'github' | 'cdn' | 'fallback';
  autoCheckUpdates: boolean;
  sentinelCheck: boolean;
  shizukuMode: boolean;
  autoInstall: boolean;
}

interface OrionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: Partial<StoreSettings>) => void;
  totalAppsCount: number;
  onRefreshData?: () => void;
  onTriggerHeartRain?: () => void;
}

type SettingsSection = 'appearance' | 'downloads' | 'security' | 'storage' | 'about';

export const OrionSettingsModal: React.FC<OrionSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  totalAppsCount,
  onRefreshData,
  onTriggerHeartRain,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsSection>('appearance');
  const [cacheCleared, setCacheCleared] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateCheckedMsg, setUpdateCheckedMsg] = useState('');

  if (!isOpen) return null;

  const handleClearCache = () => {
    try {
      localStorage.removeItem('orion_apps_data_v2');
      setCacheCleared(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckUpdate = () => {
    setUpdateChecking(true);
    setTimeout(() => {
      setUpdateChecking(false);
      setUpdateCheckedMsg('You are running OrionStore v1.4.2 — Up to date!');
      setTimeout(() => setUpdateCheckedMsg(''), 4000);
    }, 1200);
  };

  const ACCENTS = [
    { id: '#6366f1', name: 'Indigo Neon', color: 'bg-[#6366f1]' },
    { id: '#bef264', name: 'Acid Lime', color: 'bg-[#bef264]' },
    { id: '#d946ef', name: 'Cyber Pink', color: 'bg-[#d946ef]' },
    { id: '#ff5e00', name: 'Sunset Orange', color: 'bg-[#ff5e00]' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0f1118] border border-[#272b3a] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#141722] border-b border-[#242838] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/40 flex items-center justify-center text-[#6366f1]">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Orion Store Settings</span>
                <span className="text-[10px] font-mono font-bold bg-[#6366f1]/20 text-[#a5b4fc] px-2 py-0.5 rounded-full border border-[#6366f1]/30">
                  v1.4.2
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">Customization, mirrors, storage, and developer options</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1e2230] hover:bg-[#272d40] text-[#94a3b8] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-2 bg-[#12141f] border-b border-[#242838] overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                : 'text-[#94a3b8] hover:bg-[#1a1e2c]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                : 'text-[#94a3b8] hover:bg-[#1a1e2c]'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Downloads</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                : 'text-[#94a3b8] hover:bg-[#1a1e2c]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Sentinel</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                : 'text-[#94a3b8] hover:bg-[#1a1e2c]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'bg-[#6366f1] text-white shadow-lg shadow-[#6366f1]/30'
                : 'text-[#94a3b8] hover:bg-[#1a1e2c]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Developer</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 brutal-scroll text-[#e2e8f0]">
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              {/* Theme Selection */}
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#94a3b8] block mb-2.5">
                  COLOR THEME
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'oled', label: 'OLED Black', desc: '#000000 Pitch', icon: Moon },
                    { id: 'dark', label: 'Midnight Dark', desc: '#09090b Zinc', icon: Moon },
                    { id: 'dusk', label: 'Dusk Slate', desc: '#20222f Deep', icon: Moon },
                    { id: 'light', label: 'Crisp Light', desc: '#f8fafc Clean', icon: Sun },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id as any })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.theme === t.id
                          ? 'border-[#6366f1] bg-[#6366f1]/15 text-white shadow-lg shadow-[#6366f1]/20'
                          : 'border-[#272b3a] bg-[#141724] text-[#94a3b8] hover:border-[#383e54]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <t.icon className={`w-4 h-4 ${settings.theme === t.id ? 'text-[#6366f1]' : ''}`} />
                        {settings.theme === t.id && <Check className="w-3.5 h-3.5 text-[#6366f1]" />}
                      </div>
                      <div className="font-bold text-xs">{t.label}</div>
                      <div className="text-[10px] text-[#64748b]">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#94a3b8] block mb-2.5">
                  ACCENT COLOR
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ACCENTS.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => onUpdateSettings({ accentColor: acc.id })}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                        settings.accentColor === acc.id
                          ? 'border-white/50 bg-[#1c2030] text-white'
                          : 'border-[#272b3a] bg-[#141724] text-[#94a3b8] hover:border-[#383e54]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${acc.color} shadow-sm flex-shrink-0`} />
                      <span className="text-xs font-bold truncate">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Mode & Toggles */}
              <div className="space-y-3 pt-2 border-t border-[#242838]">
                {/* Store Layout Mode */}
                <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#272b3a] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Modern Discover Layout</h4>
                    <p className="text-[11px] text-[#94a3b8]">Shows featured hero cards, swimlanes, and discover feed</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ storeLayout: settings.storeLayout === 'modern' ? 'classic' : 'modern' })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.storeLayout === 'modern' ? 'bg-[#6366f1]' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.storeLayout === 'modern' ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Glass Blur Effect */}
                <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#272b3a] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Glassmorphism & Backdrop Blur</h4>
                    <p className="text-[11px] text-[#94a3b8]">Frosted glass surface reflections on cards & dock</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ glassEffect: !settings.glassEffect })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.glassEffect ? 'bg-[#6366f1]' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.glassEffect ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Fluid 120Hz Animations */}
                <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#272b3a] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">120Hz Fluid Gesture Animations</h4>
                    <p className="text-[11px] text-[#94a3b8]">Smooth spring physics and micro-interactions</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ enableAnimations: !settings.enableAnimations })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.enableAnimations ? 'bg-[#6366f1]' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.enableAnimations ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#94a3b8] block mb-2">
                  PRIMARY DOWNLOAD MIRROR
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'github', title: 'Official GitHub Releases (Direct)', desc: 'Downloads directly from verified developer repository releases' },
                    { id: 'cdn', title: 'Global Accelerated CDN (wsrv.nl)', desc: 'High-speed edge proxy caching for rapid package downloads' },
                    { id: 'fallback', title: 'Auto-Switching Resilient Mirror', desc: 'Automatically retries alternative mirrors if GitHub rate limit hits' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onUpdateSettings({ downloadMirror: m.id as any })}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        settings.downloadMirror === m.id
                          ? 'border-[#6366f1] bg-[#6366f1]/15 text-white'
                          : 'border-[#272b3a] bg-[#141724] text-[#94a3b8] hover:border-[#383e54]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${settings.downloadMirror === m.id ? 'border-[#6366f1] bg-[#6366f1]' : 'border-[#383e54]'}`}>
                        {settings.downloadMirror === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-white">{m.title}</div>
                        <div className="text-[11px] text-[#94a3b8]">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Download automation */}
              <div className="space-y-3 pt-2 border-t border-[#242838]">
                <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#272b3a] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">Auto-Prompt Install After Download</h4>
                    <p className="text-[11px] text-[#94a3b8]">Immediately trigger Android package installer on download completion</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ autoInstall: !settings.autoInstall })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.autoInstall ? 'bg-[#6366f1]' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.autoInstall ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Sentinel Protection */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-[#272b3a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">Orion Sentinel Package Verification</h4>
                      <p className="text-[11px] text-[#94a3b8]">Verifies SHA256 integrity & digital developer signatures</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ sentinelCheck: !settings.sentinelCheck })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.sentinelCheck ? 'bg-emerald-500' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.sentinelCheck ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Shizuku Silent Mode */}
              <div className="p-4 rounded-2xl bg-[#141724] border border-[#272b3a] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#6366f1]/20 text-[#a5b4fc] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white">Shizuku Elevated Power Mode</h4>
                      <p className="text-[11px] text-[#94a3b8]">Enables 1-click silent background app installs without root</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ shizukuMode: !settings.shizukuMode })}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                      settings.shizukuMode ? 'bg-[#6366f1]' : 'bg-[#272b3a]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.shizukuMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141724] border border-[#272b3a] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Cached Applications Memory</h4>
                    <p className="text-[11px] text-[#94a3b8]">Indexed {totalAppsCount.toLocaleString()}+ apps for instant offline browsing</p>
                  </div>
                  <span className="font-mono text-xs font-bold bg-[#1e2230] text-[#a5b4fc] px-2.5 py-1 rounded-lg">
                    ~1.8 MB
                  </span>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleClearCache}
                    className="py-2 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache & Refresh</span>
                  </button>

                  {cacheCleared && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5" /> Cache Cleared!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ABOUT DEVELOPER */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141724] border border-[#272b3a] flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#bef264] p-0.5 shadow-xl">
                  <img
                    src="https://avatars.githubusercontent.com/u/169815417?v=4"
                    alt="Alex James"
                    className="w-full h-full rounded-[14px] object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/icon.png';
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-black text-lg text-white">ALEX JAMES DEV</h3>
                  <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                    Lead Developer & Creator of OrionStore
                  </p>
                </div>

                <p className="text-xs text-neutral-300 max-w-md leading-relaxed">
                  Decentralized, serverless app distribution engine powered entirely by open GitHub repositories and direct APK releases.
                </p>

                {onTriggerHeartRain && (
                  <button
                    onClick={onTriggerHeartRain}
                    className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                    <span>Send Love (Heart Rain)</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 w-full max-w-xs pt-2">
                  <a
                    href="https://github.com/AlexJamesHQ"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-[#1e2230] hover:bg-[#272d40] text-white rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href="https://alex-james.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-[#6366f1] hover:bg-[#5255e0] text-white rounded-xl text-xs font-bold font-mono uppercase flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#6366f1]/20"
                  >
                    <span>Portfolio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Version Check Card */}
              <div className="p-3.5 rounded-2xl bg-[#141724] border border-[#272b3a] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-white">Check for Store Updates</div>
                  <div className="text-[11px] text-[#94a3b8]">
                    {updateCheckedMsg || 'Currently on build v1.4.2'}
                  </div>
                </div>

                <button
                  onClick={handleCheckUpdate}
                  disabled={updateChecking}
                  className="py-1.5 px-3 bg-[#1e2230] hover:bg-[#272d40] text-white border border-[#2e3346] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${updateChecking ? 'animate-spin' : ''}`} />
                  <span>Check</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-[#141722] border-t border-[#242838] flex items-center justify-between">
          <span className="text-xs text-[#94a3b8] font-mono">
            {totalAppsCount.toLocaleString()} apps indexed
          </span>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-[#6366f1] hover:bg-[#5255e0] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#6366f1]/20 transition-all cursor-pointer"
          >
            Save & Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
