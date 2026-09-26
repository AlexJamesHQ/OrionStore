import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Code2,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  Sparkles,
  Plus,
  Image as ImageIcon,
  Layers,
  Smartphone,
  Eye,
  FileJson,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Link,
  Mail,
  Github,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { playRetroSound } from '../services/sfxService';
import { OrionAppItem } from '../types';
import { OrionAppCard } from './OrionAppCard';
import { OrionAppDetailModal } from './OrionAppDetailModal';
import { GitHubIcon } from './Icons';

interface RequestAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  onAppCreated?: (newApp: OrionAppItem) => void;
}

export const RequestAppModal: React.FC<RequestAppModalProps> = ({
  isOpen,
  onClose,
  accentColor,
  onAppCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json' | 'preview'>('form');

  // Form State - Starts completely empty by default
  const [name, setName] = useState('');
  const [customId, setCustomId] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [version, setVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [packageName, setPackageName] = useState('');
  const [category, setCategory] = useState('');
  const [platform, setPlatform] = useState('Android');
  const [size, setSize] = useState('');
  const [author, setAuthor] = useState('');
  const [patchesText, setPatchesText] = useState('');
  const [screenshotsText, setScreenshotsText] = useState('');

  // Image loading test states & full inside preview modal state
  const [copiedJson, setCopiedJson] = useState(false);
  const [downloadedJson, setDownloadedJson] = useState(false);
  const [uploadedSuccess, setUploadedSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addedToStore, setAddedToStore] = useState(false);
  const [showInsideDetailModal, setShowInsideDetailModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived ID slug
  const generatedId = useMemo(() => {
    if (customId.trim()) {
      return customId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }
    if (name.trim()) {
      return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
    }
    return '';
  }, [name, customId]);

  // Derived Screenshots Array from multi-line/comma input
  const screenshotsArray = useMemo(() => {
    if (!screenshotsText.trim()) return [];
    return screenshotsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http://') || s.startsWith('https://'));
  }, [screenshotsText]);

  // Derived Patches Array
  const patchesArray = useMemo(() => {
    if (!patchesText.trim()) return [];
    return patchesText
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [patchesText]);

  const hasEnteredData = Boolean(name.trim() || iconUrl.trim() || downloadUrl.trim() || description.trim());

  // Constructed OrionAppItem object based STRICTLY on what the user enters
  const generatedAppObject = useMemo<OrionAppItem>(() => {
    return {
      id: generatedId || (name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '-') : 'app-id'),
      name: name.trim() || 'App Name',
      description: description.trim() || 'No description provided.',
      icon: iconUrl.trim() || 'https://raw.githubusercontent.com/RookieEnough/Orion-Data/main/assets/orion_logo_512.png',
      version: version.trim() || 'v1.0.0',
      latestVersion: version.trim() || 'v1.0.0',
      downloadUrl: downloadUrl.trim() || '#',
      repoUrl: repoUrl.trim() || (githubRepo.trim() ? `https://github.com/${githubRepo.trim()}` : '#'),
      githubRepo: githubRepo.trim() || '',
      packageName: packageName.trim() || '',
      category: category || 'General',
      platform: platform || 'Android',
      size: size.trim() || 'N/A',
      author: author.trim() || 'Open Source',
      patches: patchesArray,
      screenshots: screenshotsArray,
    };
  }, [
    generatedId,
    name,
    description,
    iconUrl,
    version,
    downloadUrl,
    repoUrl,
    githubRepo,
    packageName,
    category,
    platform,
    size,
    author,
    patchesArray,
    screenshotsArray,
  ]);

  // Formatted JSON String for GitHub apps.json - contains only real values entered
  const jsonString = useMemo(() => {
    const item: Record<string, any> = {
      id: generatedId || (name.trim() ? name.trim().toLowerCase().replace(/\s+/g, '-') : 'app-id'),
      name: name.trim(),
      description: description.trim(),
      icon: iconUrl.trim(),
      version: version.trim() || 'Latest',
      latestVersion: version.trim() || 'Latest',
      downloadUrl: downloadUrl.trim(),
    };
    if (githubRepo.trim()) item.githubRepo = githubRepo.trim();
    if (repoUrl.trim()) item.repoUrl = repoUrl.trim();
    if (packageName.trim()) item.packageName = packageName.trim();
    if (category) item.category = category;
    if (platform) item.platform = platform;
    if (size.trim()) item.size = size.trim();
    if (author.trim()) item.author = author.trim();
    if (patchesArray.length > 0) item.patches = patchesArray;
    if (screenshotsArray.length > 0) item.screenshots = screenshotsArray;

    return JSON.stringify(item, null, 2);
  }, [
    generatedId,
    name,
    description,
    iconUrl,
    version,
    downloadUrl,
    repoUrl,
    githubRepo,
    packageName,
    category,
    platform,
    size,
    author,
    patchesArray,
    screenshotsArray,
  ]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    playRetroSound('click');
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    playRetroSound('success');
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedId || 'app'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedJson(true);
    setTimeout(() => setDownloadedJson(false), 2500);
  };

  const processJsonData = (rawText: string) => {
    try {
      setUploadError(null);
      const parsed = JSON.parse(rawText.trim());
      // Handle array or single object
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid JSON format: Expected an object or array of app objects.');
      }

      if (item.name) setName(String(item.name));
      if (item.id) setCustomId(String(item.id));
      if (item.description) setDescription(String(item.description));
      if (item.icon) setIconUrl(String(item.icon));
      if (item.version || item.latestVersion) setVersion(String(item.version || item.latestVersion));
      if (item.downloadUrl || item.apkUrl || item.url) setDownloadUrl(String(item.downloadUrl || item.apkUrl || item.url));
      if (item.repoUrl) setRepoUrl(String(item.repoUrl));
      if (item.githubRepo) setGithubRepo(String(item.githubRepo));
      if (item.packageName || item.package) setPackageName(String(item.packageName || item.package));
      if (item.category) setCategory(String(item.category));
      if (item.platform) setPlatform(String(item.platform));
      if (item.size) setSize(String(item.size));
      if (item.author || item.developer) setAuthor(String(item.author || item.developer));

      if (Array.isArray(item.patches)) {
        setPatchesText(item.patches.join(', '));
      } else if (typeof item.patches === 'string') {
        setPatchesText(item.patches);
      }

      if (Array.isArray(item.screenshots)) {
        setScreenshotsText(item.screenshots.join('\n'));
      } else if (typeof item.screenshots === 'string') {
        setScreenshotsText(item.screenshots);
      }

      playRetroSound('success');
      setUploadedSuccess(`JSON Loaded! "${item.name || item.id || 'App'}" is ready.`);
      setActiveTab('preview');
      setTimeout(() => setUploadedSuccess(null), 3500);
    } catch (err: any) {
      console.error('JSON parse error:', err);
      setUploadError(err.message || 'Failed to parse JSON file.');
      playRetroSound('toggle');
      setTimeout(() => setUploadError(null), 4000);
    }
  };

  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processJsonData(content);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read selected file.');
    };
    reader.readAsText(file);
    // Reset file input value so same file can be uploaded again
    e.target.value = '';
  };

  // 1. Submit via GitHub Issue (Best for GitHub Collaboration)
  const handleOpenGitHubIssue = () => {
    playRetroSound('click');
    const issueTitle = encodeURIComponent(`[App Request]: ${name.trim() || generatedId}`);
    const issueBody = encodeURIComponent(
      `### 📱 New App Request for OrionStore\n\n` +
      `**App Name:** ${name.trim() || 'N/A'}\n` +
      `**Category:** ${category}\n` +
      `**Platform:** ${platform}\n` +
      `**Package Name:** ${packageName.trim() || 'N/A'}\n` +
      `**APK Download URL:** ${downloadUrl.trim() || 'N/A'}\n\n` +
      `#### 📄 Ready-to-Merge JSON Definition for \`apps.json\`:\n\`\`\`json\n${jsonString}\n\`\`\`\n\n` +
      `*Submitted via OrionStore Request System: https://github.com/AlexJamesHQ/OrionStore*`
    );
    // Opens new issue on GitHub repository
    window.open(
      `https://github.com/AlexJamesHQ/OrionStore/issues/new?title=${issueTitle}&body=${issueBody}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // 2. Submit via Email
  const handleSendEmail = () => {
    playRetroSound('click');
    const recipient = 'md.amirulislam8504@gmail.com';
    const subject = `[OrionStore Request] - ${name.trim() || 'New App'} (${category})`;
    const body = `=======================================
ORIONSTORE - NEW APP SUBMISSION (apps.json)
=======================================

App Name: ${name.trim()}
Category: ${category}
Platform: ${platform}
Package: ${packageName}
Repo: https://github.com/AlexJamesHQ/OrionStore

---------------------------------------
PASTE READY JSON FOR APPS.JSON:
---------------------------------------
${jsonString}

=======================================
Sent via OrionStore App Request Center`;

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleAddToLocalStore = () => {
    playRetroSound('success');
    if (onAppCreated) {
      onAppCreated(generatedAppObject);
    }
    setAddedToStore(true);
    setTimeout(() => setAddedToStore(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
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
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-2xl bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_#000] overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="bg-[#FFE600] border-b-4 border-black p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-black text-[#FFE600] p-2 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
              <FileJson className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg uppercase tracking-tight text-black leading-none">
                  REQUEST AN APP (apps.json Generator)
                </h3>
              </div>
              <p className="font-mono text-[10px] sm:text-xs text-neutral-800 font-bold mt-0.5">
                Send ready-to-merge JSON via GitHub Issue or Email
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-neutral-100 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Hidden File Input for JSON Upload */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleUploadJsonFile}
          className="hidden"
        />

        {/* Success / Error Notification Toast */}
        <AnimatePresence>
          {uploadedSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-3 p-3 bg-emerald-100 border-2 border-emerald-600 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_#059669] text-xs font-mono font-black text-emerald-950"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>{uploadedSuccess}</span>
              </div>
              <span className="text-[10px] bg-emerald-200 border border-emerald-600 px-2 py-0.5 rounded uppercase">Live Preview Active</span>
            </motion.div>
          )}

          {uploadError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-3 p-3 bg-rose-100 border-2 border-rose-600 rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_#e11d48] text-xs font-mono font-black text-rose-950"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-rose-700 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-2.5 bg-[#FAF6EE] border-b-2 border-black overflow-x-auto hide-scrollbar flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              playRetroSound('click');
              setActiveTab('form');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'form'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>1. Details & Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playRetroSound('click');
              setActiveTab('preview');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
            }`}
          >
            <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>2. Photos & Card Preview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playRetroSound('click');
              setActiveTab('json');
            }}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black uppercase border-2 border-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'json'
                ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>3. Send Request & JSON</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto brutal-scroll space-y-4 flex-1">
          {/* TAB 1: FORM & PHOTO LINKS */}
          {activeTab === 'form' && (
            <div className="space-y-3.5">
              {/* How it works Banner & Quick Upload JSON */}
              <div className="bg-[#FFFDF0] border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000] text-xs font-mono text-neutral-800 leading-relaxed space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-black text-black uppercase">
                    <Sparkles className="w-4 h-4 text-[#FF5E00]" />
                    <span>How User App Submission Works:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playRetroSound('click');
                      fileInputRef.current?.click();
                    }}
                    className="py-1.5 px-3 bg-[#FFE600] border-2 border-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>UPLOAD / UPDATE JSON</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-700">
                  Fill the form with photo links, or click <strong>UPLOAD / UPDATE JSON</strong> to import an existing <code className="bg-white border px-1 rounded font-bold">.json</code> file to see the live preview and send it!
                </p>
              </div>

              {/* Grid 1: Name & Custom ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    App Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. YouTube Morphe"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    App Slug ID (Auto Generated)
                  </label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={`e.g. ${generatedId}`}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Grid 2: App Icon Photo URL & Package Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-[#FF5E00]" />
                      <span>App Icon Photo Link (URL) *</span>
                    </span>
                  </label>
                  <input
                    type="url"
                    required
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="e.g. app.morphe.android.youtube"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Grid 3: Download APK URL & GitHub Repo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    Direct Download / APK URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/releases/download/v1/app.apk"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    GitHub Repo (owner/repo)
                  </label>
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="e.g. RookieEnough/Morphe-AutoBuilds"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Grid 4: Category, Platform, Size, Author */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2 font-mono text-xs font-bold text-black focus:outline-none cursor-pointer"
                  >
                    <option value="">Select...</option>
                    <option value="Media">Media</option>
                    <option value="Social">Social</option>
                    <option value="Utility">Utility</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Privacy">Privacy</option>
                    <option value="Educational">Educational</option>
                    <option value="System">System</option>
                    <option value="Development">Development</option>
                    <option value="Emulator">Emulator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2 font-mono text-xs font-bold text-black focus:outline-none cursor-pointer"
                  >
                    <option value="Android">Android</option>
                    <option value="TV">Android TV</option>
                    <option value="PC">PC / Desktop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    App Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 25 MB"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2 font-mono text-xs font-bold text-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                    Author / Dev
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Morphe"
                    className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2 font-mono text-xs font-bold text-black focus:outline-none"
                  />
                </div>
              </div>

              {/* Screenshots Photo Links (GitHub user-attachments / Any photo links supported) */}
              <div>
                <label className="block text-[10px] font-mono font-black text-black uppercase mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-[#6B21A8]" />
                    <span>Screenshots Photo Links (URLs - 1 per line)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#FFE600] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#000]">
                    {screenshotsArray.length} URL(s)
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={screenshotsText}
                  onChange={(e) => setScreenshotsText(e.target.value)}
                  placeholder={`https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796\nhttps://play-lh.googleusercontent.com/photo2.png\nhttps://raw.githubusercontent.com/user/repo/screenshots/1.png`}
                  className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400 brutal-scroll"
                />
              </div>

              {/* Applied Mod Patches / Features */}
              <div>
                <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                  Patches / Mod Features (Comma or Line Separated)
                </label>
                <input
                  type="text"
                  value={patchesText}
                  onChange={(e) => setPatchesText(e.target.value)}
                  placeholder="Ads Removal, SponsorBlock, Premium Unlocked"
                  className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-mono font-black text-black uppercase mb-1">
                  Full App Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the application features, mod highlights, and details..."
                  className="w-full bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-400 brutal-scroll"
                />
              </div>

              {/* Action Bar */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setActiveTab('preview');
                  }}
                  className="py-2.5 px-4 bg-[#FFE600] border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] hover:bg-yellow-300 transition-all cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: accentColor }}
                >
                  <Eye className="w-4 h-4 stroke-[2.5]" />
                  <span>CONTINUE TO PREVIEW (STEP 2)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setActiveTab('json');
                  }}
                  className="py-2.5 px-3.5 bg-white border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Code2 className="w-4 h-4 stroke-[2.5]" />
                  <span>SKIP TO JSON (STEP 3)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS & CARD LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {!hasEnteredData ? (
                <div className="p-8 text-center bg-[#FAF6EE] border-2 border-dashed border-neutral-400 rounded-2xl space-y-3">
                  <div className="w-12 h-12 mx-auto bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_#000]">
                    <Plus className="w-6 h-6 text-neutral-400 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="font-mono font-black text-sm text-black uppercase">
                      NO APP DETAILS ENTERED YET
                    </div>
                    <p className="font-mono text-xs text-neutral-600 max-w-sm mx-auto mt-1">
                      Fill in the App Name, Icon URL, and Download URL in <strong>"1. Details & Photos"</strong> to see the live card and interactive inside preview modal here!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playRetroSound('click');
                      setActiveTab('form');
                    }}
                    className="mt-2 py-2 px-4 bg-[#FFE600] border-2 border-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-1.5"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>ENTER DETAILS (GO TO STEP 1)</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Notice Bar for Inside View Modal */}
                  <div className="bg-[#FFFDF0] border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📱</span>
                      <div>
                        <div className="font-mono text-xs font-black text-black uppercase">
                          Interactive Live Card Preview
                        </div>
                        <p className="text-[11px] font-mono text-neutral-700">
                          Click the card below to see the full details modal with screenshot slider & download button!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        playRetroSound('click');
                        setShowInsideDetailModal(true);
                      }}
                      className="py-1.5 px-3 bg-[#FFE600] border-2 border-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>VIEW INSIDE MODAL</span>
                    </button>
                  </div>

                  {/* Rendered Live OrionAppCard Component (Clickable) */}
                  <div className="p-2 bg-[#FAF6EE] border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000]">
                    <OrionAppCard
                      app={generatedAppObject}
                      index={0}
                      onSelectApp={() => {
                        playRetroSound('click');
                        setShowInsideDetailModal(true);
                      }}
                    />
                  </div>

                  {/* Photo Links Live Verification Box */}
                  <div className="bg-white border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-black uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#FF5E00]" />
                        <span>Photo Links Verification ({screenshotsArray.length + (iconUrl ? 1 : 0)})</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 border border-emerald-500 px-2 py-0.5 rounded">
                        GitHub & Web Links Active
                      </span>
                    </div>

                    {/* Screenshots Thumbnails */}
                    {screenshotsArray.length > 0 ? (
                      <div className="flex gap-2.5 overflow-x-auto pb-1.5 brutal-scroll">
                        {screenshotsArray.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              playRetroSound('click');
                              setShowInsideDetailModal(true);
                            }}
                            className="relative flex-shrink-0 w-24 aspect-[9/16] bg-neutral-900 border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_#000] cursor-pointer group hover:scale-[1.03] transition-transform"
                            title="Click to view inside detail modal"
                          >
                            <img
                              src={url}
                              alt={`Screenshot ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://raw.githubusercontent.com/RookieEnough/Orion-Data/main/assets/orion_logo_512.png';
                              }}
                            />
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white font-mono text-[8px] px-1 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-neutral-500">
                        No screenshot links entered. You can add GitHub user-attachment image links in Step 1!
                      </p>
                    )}
                  </div>

                  {/* Step 2 Bottom Navigation */}
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        playRetroSound('click');
                        setActiveTab('form');
                      }}
                      className="py-2.5 px-3.5 bg-white border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>← BACK TO STEP 1</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playRetroSound('click');
                        setActiveTab('json');
                      }}
                      className="py-2.5 px-4 bg-[#FFE600] border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] hover:bg-yellow-300 transition-all cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Code2 className="w-4 h-4 stroke-[2.5]" />
                      <span>PROCEED TO STEP 3 (SUBMIT) →</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SUBMIT REQUEST / GENERATED JSON */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              {/* Guidance Box on Submission */}
              <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000] space-y-1.5">
                <h4 className="font-black text-xs font-mono text-black uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Choose How to Submit Your App Request:</span>
                </h4>
                <p className="text-[11px] font-mono text-neutral-700 leading-relaxed">
                  Submit using GitHub Issue or Email. You can also copy the pre-formatted JSON below with one click to paste into <code className="bg-white border px-1 rounded font-bold">apps.json</code>!
                </p>
              </div>

              {/* Action Buttons Grid (Issue, Email, Download, Upload) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. GitHub Issue (Recommended) */}
                <button
                  type="button"
                  onClick={handleOpenGitHubIssue}
                  className="p-3 bg-black text-white hover:bg-neutral-800 border-2 border-black rounded-2xl font-mono text-xs font-black uppercase flex items-center justify-between shadow-[3px_3px_0px_#FFE600] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <GitHubIcon className="w-5 h-5 text-white flex-shrink-0" />
                    <div className="text-left">
                      <div className="leading-tight">GITHUB ISSUE</div>
                      <div className="text-[9px] text-neutral-400 font-normal">AlexJamesHQ/OrionStore</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#FFE600] flex-shrink-0" />
                </button>

                {/* 2. Email Request */}
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="p-3 bg-[#FFE600] text-black hover:bg-yellow-300 border-2 border-black rounded-2xl font-mono text-xs font-black uppercase flex items-center justify-between shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-black stroke-[2.5] flex-shrink-0" />
                    <div className="text-left">
                      <div className="leading-tight">SEND VIA EMAIL</div>
                      <div className="text-[9px] text-neutral-800 font-bold">Pre-fills to Admin</div>
                    </div>
                  </div>
                  <Send className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0" />
                </button>

                {/* 3. Download JSON File */}
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className={`p-3 border-2 border-black rounded-2xl font-mono text-xs font-black uppercase flex items-center justify-between shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer ${
                    downloadedJson ? 'bg-emerald-400 text-black' : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {downloadedJson ? (
                      <Check className="w-5 h-5 text-black stroke-[3] flex-shrink-0" />
                    ) : (
                      <Download className="w-5 h-5 text-black stroke-[2.5] flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="leading-tight">{downloadedJson ? 'DOWNLOADED!' : 'DOWNLOAD JSON'}</div>
                      <div className="text-[9px] text-neutral-500 font-normal">Save .json file</div>
                    </div>
                  </div>
                  <FileJson className="w-4 h-4 text-neutral-600 flex-shrink-0" />
                </button>

                {/* 4. Upload / Update JSON File */}
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    fileInputRef.current?.click();
                  }}
                  className="p-3 bg-[#FFE600] hover:bg-yellow-300 border-2 border-black rounded-2xl font-mono text-xs font-black uppercase flex items-center justify-between shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-black stroke-[2.5] flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="leading-tight">UPLOAD / UPDATE JSON</div>
                      <div className="text-[9px] text-neutral-800 font-bold">Select JSON file & live preview</div>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-black flex-shrink-0" />
                </button>
              </div>

              {/* Direct Paste JSON input section */}
              <div className="bg-[#FAF6EE] border-2 border-black rounded-2xl p-3.5 shadow-[2px_2px_0px_#000] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-black uppercase flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-[#6B21A8]" />
                    <span>Paste Custom JSON to Update & Preview:</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-600">Supports .json or code string</span>
                </div>
                <textarea
                  rows={3}
                  placeholder={`Paste any app JSON here... e.g. {"name": "My App", "icon": "...", "downloadUrl": "..."}`}
                  onChange={(e) => {
                    if (e.target.value.trim().startsWith('{') || e.target.value.trim().startsWith('[')) {
                      processJsonData(e.target.value);
                    }
                  }}
                  className="w-full bg-white border-2 border-black rounded-xl p-2.5 font-mono text-xs text-black focus:outline-none placeholder-neutral-400 brutal-scroll"
                />
              </div>

              {/* Formatted Code Box with ONLY ONE Prominent COPY JSON button */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-black text-black uppercase flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-[#FF5E00]" />
                    <span>Generated apps.json Code:</span>
                  </span>

                  {/* Single Clean Copy JSON Button */}
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className={`py-1.5 px-3 border-2 border-black rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-all ${
                      copiedJson
                        ? 'bg-emerald-400 text-black shadow-none'
                        : 'bg-[#FFE600] text-black hover:bg-yellow-300'
                    }`}
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>COPIED TO CLIPBOARD!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>COPY JSON CODE</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative bg-neutral-900 border-2 border-black rounded-2xl p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto brutal-scroll max-h-56 shadow-[3px_3px_0px_#000]">
                  <pre>{jsonString}</pre>
                </div>
              </div>

              {/* Quick Add To Current App Store Session */}
              {onAppCreated && (
                <div className="pt-2 border-t-2 border-dashed border-neutral-300 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-600">
                    Test in current browser session right now?
                  </span>
                  <button
                    type="button"
                    onClick={handleAddToLocalStore}
                    className="py-1.5 px-3 bg-white border-2 border-black rounded-xl font-mono text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#000] hover:bg-[#FFE600] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
                  >
                    {addedToStore ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3" />}
                    <span>{addedToStore ? 'ADDED TO STORE!' : 'ADD TO PREVIEW'}</span>
                  </button>
                </div>
              )}

              {/* Step 3 Navigation */}
              <div className="pt-1 flex items-center justify-start">
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setActiveTab('preview');
                  }}
                  className="py-2 px-3 bg-white border-2 border-black text-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>← BACK TO STEP 2 (PREVIEW)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 sm:p-3.5 bg-[#FAF6EE] border-t-2 border-black flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-neutral-700">
            <span className="bg-black text-[#FFE600] px-2 py-0.5 rounded-lg border border-black text-[10px] font-black uppercase">
              {activeTab === 'form' ? 'Step 1 of 3' : activeTab === 'preview' ? 'Step 2 of 3' : 'Step 3 of 3'}
            </span>
            <span className="hidden sm:inline text-neutral-600 text-[11px]">
              {activeTab === 'form'
                ? 'Fill details & photos'
                : activeTab === 'preview'
                ? 'Check live card & modal'
                : 'Send request via Issue/Email or Copy JSON'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-black text-white border-2 border-black rounded-xl font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000] hover:bg-neutral-800 active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </motion.div>

      {/* Inside Detail View Modal (Screenshots Slider, Download Button, Patches, Architecture) */}
      <AnimatePresence>
        {showInsideDetailModal && (
          <OrionAppDetailModal
            app={generatedAppObject}
            onClose={() => setShowInsideDetailModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
