import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { OrionAppItem } from '../types';
import defaultUpdateApkData from '../data/update_apk.json';
import {
  downloadUpdateApkJsonFile,
  getGitHubUpdateUrls,
  setGitHubUpdateUrls,
  fetchUpdateApkFromGitHub,
  fetchSingleUpdateApkFromGitHub,
  isGitHubAutoSyncEnabled,
  setGitHubAutoSyncEnabled,
  normalizeGitHubRawUrl,
  DEFAULT_GITHUB_UPDATE_URL,
  resetAllToDefault,
} from '../services/orionAppsService';
import { playRetroSound } from '../services/sfxService';
import { OrionAppCard } from './OrionAppCard';
import {
  X,
  Upload,
  Download,
  Check,
  AlertCircle,
  Sparkles,
  Eye,
  Plus,
  RefreshCw,
  Copy,
  Code2,
  Github,
  HelpCircle,
  ExternalLink,
  Info,
  Trash2,
  RotateCcw,
  Eraser,
} from 'lucide-react';

interface JsonUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUpdatedApps: OrionAppItem[];
  onApplyUpdates: (apps: OrionAppItem[]) => void;
  onOpenAddModal?: () => void;
  onSelectApp?: (app: OrionAppItem) => void;
}

export const JsonUpdateModal: React.FC<JsonUpdateModalProps> = ({
  isOpen,
  onClose,
  currentUpdatedApps,
  onApplyUpdates,
  onOpenAddModal,
  onSelectApp,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'upload' | 'editor' | 'preview'>('github');
  
  // Up to 5 GitHub URLs / Repos
  const [githubUrls, setGithubUrls] = useState<string[]>(() => {
    const urls = getGitHubUpdateUrls();
    return urls.length > 0 ? urls : [DEFAULT_GITHUB_UPDATE_URL];
  });

  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);
  const [syncingIndex, setSyncingIndex] = useState<number | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => isGitHubAutoSyncEnabled());
  const [jsonText, setJsonText] = useState(() => JSON.stringify(currentUpdatedApps, null, 2));
  const [parsedApps, setParsedApps] = useState<OrionAppItem[]>(currentUpdatedApps);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when currentUpdatedApps changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const formatted = JSON.stringify(currentUpdatedApps, null, 2);
      setJsonText(formatted);
      setParsedApps(currentUpdatedApps);
      const loadedUrls = getGitHubUpdateUrls();
      setGithubUrls(loadedUrls.length > 0 ? loadedUrls : [DEFAULT_GITHUB_UPDATE_URL]);
      setAutoSyncEnabled(isGitHubAutoSyncEnabled());
      setParseError(null);
      setSuccessNotice(null);
    }
  }, [isOpen, currentUpdatedApps]);

  if (!isOpen) return null;

  const validateAndParseJson = (text: string): OrionAppItem[] | null => {
    try {
      let raw = text.trim();
      if (!raw) {
        setParseError('JSON is empty. Please provide an array of app objects.');
        return null;
      }
      // Remove possible markdown formatting
      if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];

      const cleaned: OrionAppItem[] = list.map((item, idx) => {
        return {
          id: String(item.id || item.name || `app-${idx + 1}`)
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '-'),
          name: String(item.name || `App ${idx + 1}`),
          description: String(item.description || ''),
          icon: String(item.icon || item.iconUrl || ''),
          version: String(item.version || item.latestVersion || 'Latest'),
          latestVersion: String(item.latestVersion || item.version || 'Latest'),
          downloadUrl: String(item.downloadUrl || item.apkUrl || '#'),
          repoUrl: item.repoUrl ? String(item.repoUrl) : undefined,
          githubRepo: item.githubRepo ? String(item.githubRepo) : undefined,
          packageName: item.packageName ? String(item.packageName) : undefined,
          category: String(item.category || 'Utility'),
          platform: item.platform ? String(item.platform) : 'Android',
          size: String(item.size || 'Varies'),
          author: String(item.author || item.developer || 'Open Source'),
          patches: Array.isArray(item.patches) ? item.patches.map(String) : [],
          screenshots: Array.isArray(item.screenshots) ? item.screenshots.map(String) : [],
          isFeatured: true,
        };
      });

      setParseError(null);
      return cleaned;
    } catch (err: any) {
      setParseError(err?.message || 'Invalid JSON syntax. Please check for missing brackets or commas.');
      return null;
    }
  };

  // URL management
  const handleUrlChange = (index: number, value: string) => {
    const updated = [...githubUrls];
    updated[index] = value;
    setGithubUrls(updated);
    setParseError(null);
  };

  const handleClearUrl = (index: number) => {
    playRetroSound('click');
    const updated = [...githubUrls];
    updated[index] = '';
    setGithubUrls(updated);
  };

  const handleRemoveUrl = (index: number) => {
    playRetroSound('click');
    if (githubUrls.length <= 1) {
      setGithubUrls(['']);
      return;
    }
    const updated = githubUrls.filter((_, i) => i !== index);
    setGithubUrls(updated);
    setGitHubUpdateUrls(updated);
  };

  const handleAddUrlField = () => {
    playRetroSound('click');
    if (githubUrls.length >= 5) return;
    setGithubUrls([...githubUrls, '']);
  };

  const handleClearAllUrls = () => {
    playRetroSound('click');
    setGithubUrls(['']);
    setGitHubUpdateUrls([]);
    setSuccessNotice('Cleared all GitHub repository links.');
  };

  const handleResetUrls = () => {
    playRetroSound('success');
    const { urls, apps } = resetAllToDefault();
    setGithubUrls(urls);
    setParsedApps(apps);
    setJsonText(JSON.stringify(apps, null, 2));
    setAutoSyncEnabled(false);
    setParseError(null);
    setSuccessNotice(`Reset all settings to default! Loaded ${apps.length} built-in OrionStore apps.`);
    onApplyUpdates(apps);
  };

  // Sync All Sources
  const handleSyncAllFromGitHub = async () => {
    playRetroSound('click');
    setIsSyncingGitHub(true);
    setParseError(null);
    setSuccessNotice(null);

    const validUrls = githubUrls.map((u) => u.trim()).filter(Boolean);
    if (validUrls.length === 0) {
      setParseError('Please provide at least one valid GitHub repository link or raw URL.');
      setIsSyncingGitHub(false);
      return;
    }

    setGitHubUpdateUrls(validUrls);
    setGitHubAutoSyncEnabled(autoSyncEnabled);

    try {
      const res = await fetchUpdateApkFromGitHub(validUrls);
      if (res.success && res.apps.length > 0) {
        playRetroSound('success');
        setParsedApps(res.apps);
        setJsonText(JSON.stringify(res.apps, null, 2));
        setSuccessNotice(
          `GitHub Sync Success: Loaded ${res.apps.length} apps from ${res.sourcesSynced || validUrls.length} source(s)!`
        );
        onApplyUpdates(res.apps);
      } else {
        playRetroSound('error');
        setParseError(res.message || 'Could not fetch update_apk.json from the specified GitHub sources.');
      }
    } catch (err: any) {
      playRetroSound('error');
      setParseError(err?.message || 'Error connecting to GitHub.');
    } finally {
      setIsSyncingGitHub(false);
    }
  };

  // Sync Single Source
  const handleSyncSingle = async (index: number) => {
    const raw = (githubUrls[index] || '').trim();
    if (!raw) {
      setParseError(`Slot #${index + 1} is empty. Please enter a username/repo or raw URL.`);
      return;
    }
    playRetroSound('click');
    setSyncingIndex(index);
    setParseError(null);
    setSuccessNotice(null);

    try {
      const res = await fetchSingleUpdateApkFromGitHub(raw);
      if (res.success && res.apps.length > 0) {
        playRetroSound('success');
        setParsedApps(res.apps);
        setJsonText(JSON.stringify(res.apps, null, 2));
        setSuccessNotice(`Slot #${index + 1} Success: Loaded ${res.apps.length} apps!`);
      } else {
        playRetroSound('error');
        setParseError(res.message || `Failed to fetch from slot #${index + 1}.`);
      }
    } catch (err: any) {
      playRetroSound('error');
      setParseError(err?.message || 'Error syncing from this URL.');
    } finally {
      setSyncingIndex(null);
    }
  };

  const handleFileProcess = (file: File) => {
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setParseError('Please upload a valid .json file (e.g. update_apk.json or apk.json).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      const parsed = validateAndParseJson(content);
      if (parsed) {
        setParsedApps(parsed);
        playRetroSound('success');
        setSuccessNotice(`Successfully loaded ${parsed.length} apps from ${file.name}! Check the Live Preview.`);
        setActiveTab('preview');
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    const parsed = validateAndParseJson(val);
    if (parsed) {
      setParsedApps(parsed);
    }
  };

  const handleApplyToStore = () => {
    playRetroSound('success');
    const valid = validateAndParseJson(jsonText);
    if (valid && valid.length > 0) {
      onApplyUpdates(valid);
      onClose();
    } else {
      setParseError('Cannot apply empty or invalid app JSON.');
    }
  };

  const handleDownloadJson = () => {
    playRetroSound('success');
    const valid = validateAndParseJson(jsonText) || parsedApps;
    downloadUpdateApkJsonFile(valid);
  };

  const handleCopyJson = async () => {
    playRetroSound('click');
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleAddSampleTemplate = () => {
    playRetroSound('click');
    const newTemplate: OrionAppItem = {
      id: `custom-app-${Date.now().toString().slice(-4)}`,
      name: 'My New Modded App',
      description: 'Custom added application with ad-free patches and lossless streaming.',
      icon: 'https://raw.githubusercontent.com/rukamori/ArchiveTune/main/fastlane/metadata/android/en-US/images/icon.png',
      version: 'v1.0.0',
      latestVersion: 'v1.0.0',
      downloadUrl: 'https://github.com/example/repo/releases/download/v1.0.0/app-release.apk',
      repoUrl: 'https://github.com/example/repo',
      githubRepo: 'example/repo',
      packageName: 'com.example.modapp',
      category: 'Utility',
      platform: 'Android',
      size: '25.4 MB',
      author: 'CustomDev',
      patches: ['Ad-Free', 'Dark Mode', 'Unlocked Features'],
      screenshots: [],
      isFeatured: true,
    };

    const updated = [newTemplate, ...parsedApps];
    const str = JSON.stringify(updated, null, 2);
    setJsonText(str);
    setParsedApps(updated);
    setSuccessNotice('Added a new app template! You can now edit its values or preview it.');
  };

  const handleRemoveAppFromPreview = (indexToRemove: number, appName: string) => {
    playRetroSound('toggle');
    const updated = parsedApps.filter((_, idx) => idx !== indexToRemove);
    setParsedApps(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setSuccessNotice(`Removed "${appName || 'App'}" from preview list.`);
  };

  const handleClearAllAppsFromPreview = () => {
    playRetroSound('toggle');
    setParsedApps([]);
    setJsonText('[]');
    setSuccessNotice('Cleared all apps from preview list.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#ECE8DE] border-[3.5px] border-black rounded-3xl shadow-[8px_8px_0px_#000] overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#FFE600] border-b-[3px] border-black p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-[#FFE600] flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000]">
              <Github className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-black uppercase tracking-tight leading-none">
                  GitHub & JSON Update Center
                </h2>
              </div>
              <p className="font-mono text-xs font-bold text-neutral-800 mt-0.5">
                Load & sync <code className="bg-white/80 px-1 py-0.5 rounded border border-black/30 font-black">update_apk.json</code> from up to 5 GitHub sources
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border-2 border-black text-black hover:bg-neutral-100 flex items-center justify-center shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Top Tab Switcher Segmented Bar */}
        <div className="bg-[#FAF6EE] border-b-2 border-black px-3 sm:px-5 py-2 select-none">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                playRetroSound('click');
                setActiveTab('github');
              }}
              className={`py-2 px-2.5 rounded-xl font-mono text-[11px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'github'
                  ? 'bg-[#10B981] text-white shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              <Github className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">GitHub Sync</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playRetroSound('click');
                setActiveTab('preview');
              }}
              className={`py-2 px-2.5 rounded-xl font-mono text-[11px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              <Eye className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Preview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playRetroSound('click');
                setActiveTab('upload');
              }}
              className={`py-2 px-2.5 rounded-xl font-mono text-[11px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playRetroSound('click');
                setActiveTab('editor');
              }}
              className={`py-2 px-2.5 rounded-xl font-mono text-[11px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 border-2 border-black transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'editor'
                  ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 stroke-[2.5] flex-shrink-0" />
              <span className="truncate">JSON Editor</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Notifications */}
          {successNotice && (
            <div className="bg-emerald-100 border-2 border-emerald-800 text-emerald-950 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center gap-2 font-mono text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                <span>{successNotice}</span>
              </div>
              <button
                onClick={() => setSuccessNotice(null)}
                className="text-emerald-900 hover:text-black font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {parseError && (
            <div className="bg-rose-100 border-2 border-rose-800 text-rose-950 px-4 py-2.5 rounded-2xl flex items-center gap-2 font-mono text-xs font-bold shadow-[2px_2px_0px_#000]">
              <AlertCircle className="w-4 h-4 text-rose-700 stroke-[3] flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* TAB: GITHUB LIVE SYNC */}
          {activeTab === 'github' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white border-2 border-black rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_#000] flex flex-col gap-4">
                {/* Header info & fast actions */}
                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <Github className="w-5 h-5 text-black" />
                      <h3 className="font-black text-base sm:text-lg uppercase text-black">
                        GitHub Multi-Source Live Sync (Up to 5 Links)
                      </h3>
                    </div>
                    <p className="font-mono text-xs text-neutral-600 mt-1">
                      Add up to 5 GitHub repositories or raw links to merge and automatically sync your APK updates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const sampleData = (defaultUpdateApkData as OrionAppItem[]) || [];
                        setParsedApps(sampleData);
                        setJsonText(JSON.stringify(sampleData, null, 2));
                        playRetroSound('success');
                        setSuccessNotice(`Loaded ${sampleData.length} sample apps into preview!`);
                        setParseError(null);
                      }}
                      className="px-2.5 py-1.5 bg-[#FAF6EE] hover:bg-neutral-200 border border-black rounded-xl font-mono text-[11px] font-black text-black cursor-pointer shadow-[1.5px_1.5px_0px_#000]"
                    >
                      Load Sample Data
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllUrls}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-800 text-rose-950 rounded-xl font-mono text-[11px] font-black cursor-pointer shadow-[1.5px_1.5px_0px_#000] flex items-center gap-1"
                    >
                      <Eraser className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetUrls}
                      className="font-mono text-[11px] font-bold text-neutral-600 hover:text-black underline cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Multiple Links Inputs List (Up to 5) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-black uppercase text-neutral-800">
                      GITHUB REPO OR DIRECT RAW LINK:
                    </label>
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      Accepts: username/repo OR raw URL • Max 5
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {githubUrls.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {/* Slot index badge */}
                        <div className="w-7 h-7 bg-black text-[#FFE600] rounded-lg border border-black flex items-center justify-center font-mono font-black text-xs flex-shrink-0 shadow-[1px_1px_0px_#000]">
                          {idx + 1}
                        </div>

                        {/* Input field */}
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                            placeholder={`Source #${idx + 1}: e.g. username/repo or https://raw.githubusercontent.com/...`}
                            className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl pl-3 pr-8 py-2 font-mono text-xs font-bold text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
                          />
                          {url && (
                            <button
                              type="button"
                              onClick={() => handleClearUrl(idx)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-black cursor-pointer"
                              title="Clear input"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          )}
                        </div>

                        {/* Clear Button */}
                        <button
                          type="button"
                          onClick={() => handleClearUrl(idx)}
                          className="px-2.5 py-2 bg-white hover:bg-neutral-100 border-2 border-black rounded-xl font-mono text-[11px] font-black text-black uppercase cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center gap-1"
                          title="Clear this field"
                        >
                          <Eraser className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>

                        {/* Single Sync Button */}
                        <button
                          type="button"
                          onClick={() => handleSyncSingle(idx)}
                          disabled={syncingIndex === idx || isSyncingGitHub}
                          className="px-2.5 py-2 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl font-mono text-[11px] font-black text-black uppercase cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] flex items-center gap-1 disabled:opacity-50"
                          title="Test sync this source"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingIndex === idx ? 'animate-spin' : ''}`} />
                          <span>Test</span>
                        </button>

                        {/* Remove Slot Button */}
                        {githubUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUrl(idx)}
                            className="p-2 bg-rose-100 hover:bg-rose-200 border-2 border-rose-900 text-rose-950 rounded-xl cursor-pointer shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                            title="Remove this source slot"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Slot Button (if < 5) */}
                  <div className="flex items-center justify-between pt-1">
                    {githubUrls.length < 5 ? (
                      <button
                        type="button"
                        onClick={handleAddUrlField}
                        className="px-3.5 py-1.5 bg-[#FAF6EE] hover:bg-neutral-200 border-2 border-black rounded-xl font-mono text-xs font-black text-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add Another Link</span>
                      </button>
                    ) : (
                      <span className="font-mono text-xs font-bold text-neutral-500">
                        Maximum 5 sources reached
                      </span>
                    )}

                    {/* Master Sync Button */}
                    <button
                      type="button"
                      onClick={handleSyncAllFromGitHub}
                      disabled={isSyncingGitHub}
                      className="px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncingGitHub ? 'animate-spin' : ''}`} />
                      <span>{isSyncingGitHub ? 'Syncing All Sources...' : 'Sync All Sources'}</span>
                    </button>
                  </div>
                </div>

                {/* Auto-Sync checkbox */}
                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-black/20">
                  <input
                    id="auto-sync-toggle"
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={(e) => {
                      setAutoSyncEnabled(e.target.checked);
                      setGitHubAutoSyncEnabled(e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-2 border-black text-[#10B981] focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="auto-sync-toggle"
                    className="font-mono text-xs font-bold text-neutral-800 cursor-pointer select-none"
                  >
                    Auto-fetch latest updates from these GitHub files when opening OrionStore
                  </label>
                </div>
              </div>

              {/* GitHub 404 Explanation & 3-Step Setup Guide (100% English) */}
              <div className="bg-[#FFFDF7] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                  <h4 className="font-black text-xs sm:text-sm uppercase text-black">
                    💡 Why does &quot;GitHub HTTP 404 - File Not Found&quot; occur?
                  </h4>
                </div>
                <p className="font-mono text-xs text-neutral-700 leading-relaxed">
                  A 404 error occurs when GitHub cannot find <code className="bg-amber-100 px-1.5 py-0.5 rounded font-black border border-amber-300">update_apk.json</code> in your repository. This happens if the file has not been committed yet, the repository is set to Private, or the repository name has a typo.
                </p>

                {/* 3-Step Setup Card */}
                <div className="bg-[#FAF6EE] border border-black/30 rounded-xl p-3.5 flex flex-col gap-2.5 font-mono text-xs">
                  <div className="font-black text-black uppercase text-[11px] tracking-wide">
                    🚀 3 Easy Steps to Connect Your GitHub Repository:
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-black text-[#FFE600] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <div className="flex-1 text-neutral-800">
                      Click the <button onClick={handleDownloadJson} className="font-black text-emerald-800 underline hover:text-black">DOWNLOAD JSON</button> button below to get your starter <code className="font-bold">update_apk.json</code> file.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-black text-[#FFE600] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <div className="flex-1 text-neutral-800">
                      Create or open a repository on <a href="https://github.com" target="_blank" rel="noreferrer" className="font-black text-purple-800 underline hover:text-black inline-flex items-center gap-0.5">GitHub <ExternalLink className="w-3 h-3 inline" /></a> and upload the <code className="font-bold">update_apk.json</code> file to the root or main branch. Ensure the repository is <strong>Public</strong>.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-black text-[#FFE600] font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <div className="flex-1 text-neutral-800">
                      Type your repo name like <code className="bg-white px-1 rounded border border-black/20 font-bold">your-username/your-repo</code> or paste the raw link into the input above, then click <strong>Sync All Sources</strong>!
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Preview Summary */}
              <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#FFE600] border-2 border-black rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0px_#000]">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm uppercase text-black">
                      Currently Synced: {parsedApps.length} Apps
                    </h4>
                    <p className="font-mono text-xs text-neutral-600">
                      View full rendering in the Live Preview tab
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="py-2 px-3 bg-white hover:bg-neutral-100 border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyToStore}
                    className="py-2 px-3.5 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Apply to Store</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: UPLOAD JSON & QUICK ACTIONS */}
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileProcess(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-3 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? 'border-[#6B21A8] bg-purple-50 shadow-[4px_4px_0px_#000]'
                    : 'border-black bg-white shadow-[4px_4px_0px_#000] hover:bg-[#FAF6EE]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileProcess(file);
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-2 border-black flex items-center justify-center text-black shadow-[3px_3px_0px_#000]">
                  <Upload className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <h3 className="font-black text-base sm:text-lg uppercase text-black">
                    Drag & Drop Your <code className="bg-[#FAF6EE] px-1.5 py-0.5 rounded border border-black">update_apk.json</code>
                  </h3>
                  <p className="font-mono text-xs text-neutral-600 mt-1">
                    Or click anywhere here to choose your JSON file from device
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-[#FAF6EE] border border-black px-3 py-1 rounded-full font-mono text-[11px] font-bold text-neutral-800">
                  <span>✓ Automatically validates & renders live app preview</span>
                </div>
              </div>

              {/* Quick Preset Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-[#FF5E00]" />
                      <h4 className="font-black text-sm uppercase text-black">Add App Manually</h4>
                    </div>
                    <p className="font-mono text-xs text-neutral-600">
                      Use our visual step-by-step form to fill details, patches, and screenshots.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenAddModal) {
                        onClose();
                        onOpenAddModal();
                      } else {
                        handleAddSampleTemplate();
                        setActiveTab('editor');
                      }
                    }}
                    className="py-2 px-3 bg-[#FAF6EE] hover:bg-neutral-100 border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Open Add App Creator</span>
                  </button>
                </div>

                <div className="bg-white border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-black text-sm uppercase text-black">Export update_apk.json</h4>
                    </div>
                    <p className="font-mono text-xs text-neutral-600">
                      Download the updated file to commit to GitHub or share with users.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadJson}
                    className="py-2 px-3 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Download JSON File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LIVE APPS PREVIEW */}
          {activeTab === 'preview' && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#FFE600] border-2 border-black rounded-2xl p-3 sm:p-3.5 shadow-[2.5px_2.5px_0px_#000] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-black stroke-[2.5]" />
                  <span className="font-black text-xs sm:text-sm uppercase text-black">
                    Live Visual Preview • {parsedApps.length} Apps Loaded
                  </span>
                </div>

                {parsedApps.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllAppsFromPreview}
                    className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 border-2 border-rose-800 text-rose-950 rounded-xl font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000] cursor-pointer"
                    title="Remove all apps from preview"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {parsedApps.length === 0 ? (
                <div className="bg-white border-2 border-black rounded-2xl p-8 text-center shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center gap-2">
                  <p className="font-black text-sm uppercase text-neutral-700">No apps in preview list</p>
                  <p className="font-mono text-xs text-neutral-500">
                    Sync from GitHub or Upload JSON to load app updates
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {parsedApps.map((app, idx) => (
                    <div key={app.id || idx} className="relative flex flex-col">
                      {/* Top Header Bar with Prominent Remove Button */}
                      <div className="bg-[#FAF6EE] border-2 border-black rounded-t-2xl p-2 px-3 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#000]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-black text-[#FFE600] font-mono font-black text-[10px] flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-mono text-xs font-black uppercase text-black truncate">
                            {app.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAppFromPreview(idx, app.name)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white border-2 border-black rounded-xl font-mono text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1 flex-shrink-0"
                          title="Remove this app from preview list"
                        >
                          <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Remove App</span>
                        </button>
                      </div>

                      <div className="border-x-2 border-b-2 border-black rounded-b-2xl overflow-hidden shadow-[2px_2px_0px_#000]">
                        <OrionAppCard
                          app={app}
                          index={idx}
                          onSelectApp={(a) => {
                            if (onSelectApp) {
                              onSelectApp(a);
                            }
                          }}
                          viewMode="grid"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: RAW JSON CODE EDITOR */}
          {activeTab === 'editor' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1">
                <span className="font-mono text-xs font-black uppercase text-neutral-800">
                  JSON Syntax Editor • {parsedApps.length} valid items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddSampleTemplate}
                    className="px-2.5 py-1 bg-white border border-black rounded-lg font-mono text-[11px] font-bold text-black hover:bg-neutral-100 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="px-2.5 py-1 bg-[#FFE600] border border-black rounded-lg font-mono text-[11px] font-bold text-black flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={jsonText}
                onChange={handleTextChange}
                rows={14}
                spellCheck={false}
                placeholder="[ { id: '...', name: '...' } ]"
                className="w-full bg-[#1e1e24] text-[#86efac] font-mono text-xs p-4 rounded-2xl border-[2.5px] border-black focus:outline-none focus:border-[#FFE600] shadow-[3px_3px_0px_#000] leading-relaxed resize-y"
              />
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="bg-white border-t-[3px] border-black p-4 sm:p-5 flex items-center justify-between gap-3 select-none flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="py-2.5 px-4 bg-[#FAF6EE] hover:bg-neutral-100 text-black border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>DOWNLOAD JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-white border-2 border-black rounded-xl font-mono text-xs font-black uppercase hover:bg-neutral-100 shadow-[2px_2px_0px_#000] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyToStore}
              className="py-2.5 px-5 sm:px-6 bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-black stroke-[3]" />
              <span>APPLY & VIEW IN STORE</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
