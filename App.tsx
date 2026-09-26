import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionAppItem, GitHubUserProfile } from './types';
import { localAppsData } from './data/localAppsData';
import {
  fetchOrionApps,
  loadCustomUpdatedApps,
  saveCustomUpdatedApp,
  saveAllCustomUpdatedApps,
  deleteCustomUpdatedApp,
  downloadUpdateApkJsonFile,
  fetchUpdateApkFromGitHub,
  isGitHubAutoSyncEnabled,
  getGitHubUpdateUrl,
} from './services/orionAppsService';
import { playRetroSound } from './services/sfxService';
import { DEFAULT_USER_PROFILE } from './data/sampleRepos';
import {
  NeobrutalistHeader,
  MenuDrawer,
  LogoLoop,
  FlipCard,
  TextPressure,
  OrionAppCard,
  OrionAppDetailModal,
  InAppDownloadModal,
  RequestAppModal,
  JsonUpdateModal,
  AppShareModal,
  GitHubIcon,
} from './components';
import {
  Search,
  Mail,
  BarChart3,
  RefreshCw,
  X,
  ArrowUpRight,
  Zap,
  Sparkles,
  Download,
  Flame,
  Grid,
  Layers,
  Heart,
  Smartphone,
  Tv,
  Monitor,
  ShieldCheck,
  Check,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronDown,
  ArrowUp,
  TrendingUp,
  FileJson,
  Plus,
  Radio,
  Github,
} from 'lucide-react';

type StoreTab = 'all' | 'updates' | 'utilities' | 'favorites';
type SortOption = 'recommended' | 'name' | 'patches' | 'category';
type PlatformOption = 'all' | 'mobile' | 'tv' | 'pc';

const POPULAR_SEARCH_PILLS = [
  { label: 'YouTube', query: 'youtube' },
  { label: 'Music', query: 'music' },
  { label: 'Instagram', query: 'instagram' },
  { label: 'Shizuku', query: 'shizuku' },
  { label: 'Ad-Free', query: 'ad-free' },
  { label: 'Files', query: 'file' },
  { label: 'Launchers', query: 'launcher' },
  { label: 'Browser', query: 'browser' },
  { label: 'Social', query: 'social' },
  { label: 'Tools', query: 'tool' },
];

export const App: React.FC = () => {
  // Developer profile
  const [userProfile] = useState<GitHubUserProfile>(DEFAULT_USER_PROFILE);

  // Orion Apps State (starts with local curated data immediately, then loads all 1,081+ apps)
  const [apps, setApps] = useState<OrionAppItem[]>(() => (localAppsData as OrionAppItem[]) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Custom User Updated Apps from update_apk.json
  const [customUpdatedApps, setCustomUpdatedApps] = useState<OrionAppItem[]>(() => {
    const loaded = loadCustomUpdatedApps();
    if (loaded && loaded.length > 0) return loaded;
    return [];
  });

  // Selected App for Detail Modal & In-App Download Modal
  const [selectedApp, setSelectedApp] = useState<OrionAppItem | null>(null);
  const [downloadingApp, setDownloadingApp] = useState<OrionAppItem | null>(null);

  // Active Store Tab persisted
  const [activeTab, setActiveTab] = useState<StoreTab>(() => {
    try {
      return (localStorage.getItem('orion_active_tab') as StoreTab) || 'all';
    } catch {
      return 'all';
    }
  });

  // Search and Filter State persisted
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    try {
      return localStorage.getItem('orion_search_query') || '';
    } catch {
      return '';
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    try {
      return localStorage.getItem('orion_selected_category') || 'All';
    } catch {
      return 'All';
    }
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    try {
      return (localStorage.getItem('orion_sort_by') as SortOption) || 'recommended';
    } catch {
      return 'recommended';
    }
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    try {
      return localStorage.getItem('orion_accent_color') || '#FFFFFF';
    } catch {
      return '#FFFFFF';
    }
  });

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color);
    try {
      localStorage.setItem('orion_accent_color', color);
    } catch {}
  };

  const [gridStyle, setGridStyle] = useState<'static' | 'drift' | 'warp' | 'dots' | 'dots-drift'>(() => {
    try {
      return (localStorage.getItem('orion_grid_style') as any) || 'static';
    } catch {
      return 'static';
    }
  });

  const handleGridStyleChange = (style: string) => {
    setGridStyle(style as any);
    try {
      localStorage.setItem('orion_grid_style', style);
    } catch {}
  };

  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(() => {
    try {
      return (localStorage.getItem('orion_view_mode') as 'grid' | 'compact') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [visibleCount, setVisibleCount] = useState<number>(36);
  const [showStats, setShowStats] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [sharingApp, setSharingApp] = useState<OrionAppItem | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isSyncingGitHub, setIsSyncingGitHub] = useState(false);
  const [githubSyncNotice, setGithubSyncNotice] = useState<{ message: string; isError?: boolean; canOpenModal?: boolean } | null>(null);

  // Sync states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orion_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('orion_search_query', searchQuery);
    } catch {}
  }, [searchQuery]);

  useEffect(() => {
    try {
      localStorage.setItem('orion_selected_category', selectedCategory);
    } catch {}
  }, [selectedCategory]);

  useEffect(() => {
    try {
      localStorage.setItem('orion_sort_by', sortBy);
    } catch {}
  }, [sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem('orion_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  // Show Back To Top Button
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Search Input ref for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Favorites state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('orion_favorite_apps');
      return saved ? JSON.parse(saved) : ['youtube-revanced', 'shizuku', 'instagram-piko'];
    } catch {
      return ['youtube-revanced', 'shizuku', 'instagram-piko'];
    }
  });

  // Drawer & Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Heart Rain Animation state
  const [heartParticles, setHeartParticles] = useState<Array<{ id: number; x: number; size: number; speed: number; emoji: string }>>([]);

  const triggerHeartRain = () => {
    const newParticles = Array.from({ length: 16 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: Math.random() * window.innerWidth,
      size: Math.floor(Math.random() * 20) + 18,
      speed: Math.random() * 1.5 + 3.5,
      emoji: '❤️',
    }));
    setHeartParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setHeartParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 5000);
  };

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut to focus search input: '/' or 's'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || e.key === 's') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load all 1,081+ Orion Apps on mount with seamless Background Auto-Sync!
  useEffect(() => {
    const loadApps = async () => {
      setIsLoading(true);
      try {
        // Step 1: Instantly load cached apps (or fallback to local if empty) for zero-latency startup
        const loaded = await fetchOrionApps();
        if (loaded && loaded.length > 0) {
          setApps(loaded);
        }
      } catch (err) {
        console.error('Failed to load Orion apps:', err);
      } finally {
        setIsLoading(false);
      }

      // Step 2: Auto-sync in the background from public GitHub API to get latest updates silently!
      try {
        const remoteRes = await fetch('https://raw.githubusercontent.com/RookieEnough/Orion-Data/main/apps.json');
        if (remoteRes.ok) {
          const remoteApps = await remoteRes.json();
          if (Array.isArray(remoteApps) && remoteApps.length > 0) {
            const PRIORITY_PACKAGE_NAMES = [
              'moe.rukamori.archivetune',
              'com.ivor.ivormusic',
              'dev.citali.lunartune',
              'com.musheer360.swiftslate',
              'com.asrumon.telephoto',
              'com.etrisad.zenith',
              'com.theveloper.pixelplay',
              'com.vivi.vivimusic',
              'ru.tech.imageresizershrinker',
              'org.localsend.localsend_app',
              'com.junkfood.seal',
              'com.dot.gallery',
              'me.rerere.rikkahub',
              'com.msob7y.namida',
              'org.nqmgaming.aneko',
              'cn.nubia.redmagickyi',
              'com.streak.app',
              'com.serranoie.app.minus',
              'com.lastwave.app',
              'com.rubex.nfile',
              'com.roxum',
              'com.foxdebug.acode',
              'com.eyalm.adns',
              'com.pranshulgg.weather_master_app'
            ];
            
            const prioritizedMap = new Map<string, any>();
            const priorityList: any[] = [];
            const otherList: any[] = [];

            PRIORITY_PACKAGE_NAMES.forEach((pkg) => {
              const found = remoteApps.find(
                (a) => a.packageName && a.packageName.toLowerCase() === pkg.toLowerCase()
              );
              if (found && !prioritizedMap.has(found.id)) {
                prioritizedMap.set(found.id, { ...found, isFeatured: true });
                priorityList.push({ ...found, isFeatured: true });
              }
            });

            remoteApps.forEach((app) => {
              if (!prioritizedMap.has(app.id)) {
                otherList.push(app);
                prioritizedMap.set(app.id, app);
              }
            });

            const finalApps = [...priorityList, ...otherList];
            
            // Check if different to avoid redundant re-renders
            const cachedStr = localStorage.getItem('orion_apps_data_v3');
            if (JSON.stringify(finalApps) !== cachedStr) {
              setApps(finalApps);
              localStorage.setItem('orion_apps_data_v3', JSON.stringify(finalApps));
            }
          }
        }
      } catch (err) {
        console.warn('Background auto-sync failed:', err);
      }

      // Step 3: Auto-sync update_apk.json from user's GitHub files
      if (isGitHubAutoSyncEnabled()) {
        try {
          const gitRes = await fetchUpdateApkFromGitHub();
          if (gitRes.success && gitRes.apps.length > 0) {
            setCustomUpdatedApps(gitRes.apps);
          }
        } catch (err) {
          console.warn('Background GitHub update_apk.json sync failed:', err);
        }
      }
    };
    loadApps();
  }, []);

  const handleSyncGitHub = async () => {
    playRetroSound('click');
    setIsSyncingGitHub(true);
    setGithubSyncNotice(null);
    try {
      const res = await fetchUpdateApkFromGitHub();
      if (res.success && res.apps.length > 0) {
        playRetroSound('success');
        setCustomUpdatedApps(res.apps);
        setGithubSyncNotice({
          message: `✓ Successfully synced ${res.apps.length} apps from GitHub!`,
          isError: false,
        });
        setTimeout(() => setGithubSyncNotice(null), 5000);
      } else {
        playRetroSound('error');
        if (res.statusCode === 404) {
          setGithubSyncNotice({
            message: `⚠️ GitHub update_apk.json not found (404 Not Found). Click Setup to configure your repository.`,
            isError: true,
            canOpenModal: true,
          });
        } else {
          setGithubSyncNotice({
            message: `⚠️ ${res.message || 'GitHub sync failed'}`,
            isError: true,
            canOpenModal: true,
          });
        }
        setTimeout(() => setGithubSyncNotice(null), 8000);
      }
    } catch (err: any) {
      playRetroSound('error');
      setGithubSyncNotice({
        message: `⚠️ ${err?.message || 'Sync error'}`,
        isError: true,
        canOpenModal: true,
      });
      setTimeout(() => setGithubSyncNotice(null), 8000);
    } finally {
      setIsSyncingGitHub(false);
    }
  };

  const handleRefresh = async () => {
    playRetroSound('click');
    setIsRefreshing(true);
    try {
      localStorage.removeItem('orion_apps_data_v3');
      const freshApps = await fetchOrionApps();
      if (freshApps && freshApps.length > 0) {
        setApps(freshApps);
      }
      await handleSyncGitHub();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleFavorite = (appId: string) => {
    playRetroSound('toggle');
    setFavoriteIds((prev) => {
      const updated = prev.includes(appId)
        ? prev.filter((id) => id !== appId)
        : [...prev, appId];
      try {
        localStorage.setItem('orion_favorite_apps', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clean Categories with counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    apps.forEach((a) => {
      if (a.category) {
        const clean = a.category.split('/')[0].trim();
        if (clean) {
          map.set(clean, (map.get(clean) || 0) + 1);
        }
      }
    });

    const sortedCats = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    return ['All', ...sortedCats];
  }, [apps]);

  // Tab filtering
  const tabFilteredApps = useMemo(() => {
    if (activeTab === 'updates') {
      return customUpdatedApps;
    }
    if (activeTab === 'utilities') {
      return apps.filter((a) => {
        const cat = (a.category || '').toLowerCase();
        return cat.includes('util') || cat.includes('system') || cat.includes('tool');
      });
    }
    if (activeTab === 'favorites') {
      return apps.filter((a) => favoriteIds.includes(a.id));
    }
    return apps;
  }, [apps, activeTab, favoriteIds, customUpdatedApps]);

  const handleAppCreated = (newApp: OrionAppItem) => {
    const updatedCustom = saveCustomUpdatedApp(newApp);
    setCustomUpdatedApps(updatedCustom);
    setApps((prev) => {
      const idx = prev.findIndex((a) => a.id === newApp.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newApp;
        return next;
      }
      return [newApp, ...prev];
    });
    setActiveTab('updates');
  };

  const handleDownloadUpdateJson = () => {
    playRetroSound('success');
    downloadUpdateApkJsonFile(customUpdatedApps);
  };

  const handleApplyUpdates = (newCustomApps: OrionAppItem[]) => {
    playRetroSound('success');
    const saved = saveAllCustomUpdatedApps(newCustomApps);
    setCustomUpdatedApps(saved);
    setApps((prev) => {
      const map = new Map<string, OrionAppItem>();
      saved.forEach((a) => map.set(a.id, a));
      prev.forEach((a) => {
        if (!map.has(a.id)) map.set(a.id, a);
      });
      return Array.from(map.values());
    });
    setActiveTab('updates');
    setSelectedCategory('All');
    setSearchQuery('');
  };

  // Intelligent Search & Scoring Engine
  const filteredApps = useMemo(() => {
    const raw = searchQuery.toLowerCase().trim();
    const tokens = raw.split(/\s+/).filter(Boolean);

    // Filter by Category
    const categoryMatched = tabFilteredApps.filter((app) => {
      if (selectedCategory === 'All') return true;
      return app.category && app.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    if (tokens.length === 0) {
      // Apply Sort
      return [...categoryMatched].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'patches') return (b.patches?.length || 0) - (a.patches?.length || 0);
        if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
        // Recommended / Featured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.patches?.length || 0) - (a.patches?.length || 0);
      });
    }

    // Weighted Search Match Scoring
    const scored = categoryMatched
      .map((app) => {
        let score = 0;
        const name = app.name.toLowerCase();
        const desc = (app.description || '').toLowerCase();
        const pkg = (app.packageName || '').toLowerCase();
        const author = (app.author || '').toLowerCase();
        const cat = (app.category || '').toLowerCase();
        const patches = (app.patches || []).join(' ').toLowerCase();

        // Exact name match gets highest boost
        if (name === raw) score += 300;
        else if (name.startsWith(raw)) score += 180;
        else if (name.includes(raw)) score += 100;

        for (const token of tokens) {
          if (name.includes(token)) score += 50;
          if (pkg.includes(token)) score += 40;
          if (patches.includes(token)) score += 35;
          if (cat.includes(token)) score += 30;
          if (author.includes(token)) score += 25;
          if (desc.includes(token)) score += 15;
        }

        if (app.isFeatured) score += 10;
        return { app, score };
      })
      .filter((item) => item.score > 0);

    // Sort scored items: highest relevance first, or user selected sort
    scored.sort((a, b) => {
      if (sortBy === 'name') return a.app.name.localeCompare(b.app.name);
      if (sortBy === 'patches') return (b.app.patches?.length || 0) - (a.app.patches?.length || 0);
      if (sortBy === 'category') return (a.app.category || '').localeCompare(b.app.category || '');
      // Recommended: highest search score first
      return b.score - a.score;
    });

    return scored.map((item) => item.app);
  }, [tabFilteredApps, searchQuery, selectedCategory, sortBy]);

  const statsSummary = useMemo(() => {
    const total = apps.length;
    let utilities = 0;
    let media = 0;
    let social = 0;
    let other = 0;
    let totalPatches = 0;
    let featured = 0;

    apps.forEach((app) => {
      if (app.isFeatured) featured++;
      if (app.patches) totalPatches += app.patches.length;

      const cat = (app.category || '').toLowerCase();
      if (cat.includes('utility') || cat.includes('tool')) {
        utilities++;
      } else if (cat.includes('media') || cat.includes('music') || cat.includes('video')) {
        media++;
      } else if (cat.includes('social')) {
        social++;
      } else {
        other++;
      }
    });

    return { total, utilities, media, social, other, totalPatches, featured };
  }, [apps]);

  // Paginated display
  const displayedApps = useMemo(() => {
    return filteredApps.slice(0, visibleCount);
  }, [filteredApps, visibleCount]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const gridBackgroundClass = useMemo(() => {
    if (gridStyle === 'drift') return 'bg-cream-grid bg-grid-drift';
    if (gridStyle === 'warp') return 'bg-cream-grid bg-grid-warp';
    if (gridStyle === 'dots') return 'bg-retro-dots';
    if (gridStyle === 'dots-drift') return 'bg-retro-dots bg-dots-drift';
    return 'bg-cream-grid';
  }, [gridStyle]);

  return (
    <div className={`min-h-screen w-full ${gridBackgroundClass} flex flex-col text-black antialiased selection:bg-[#FFE600] selection:text-black`}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --accent-color: ${accentColor} !important;
        }
        /* Override background color of FFE600 */
        .bg-\\[\\#FFE600\\], 
        .bg-yellow-300,
        [class*="bg-[#FFE600]"],
        [class*="bg-[#FFE600]"]:hover {
          background-color: ${accentColor} !important;
        }
        /* Override border color */
        .border-\\[\\#FFE600\\],
        [class*="border-[#FFE600]"] {
          border-color: ${accentColor} !important;
        }
        /* Override text color */
        .text-\\[\\#FFE600\\],
        [class*="text-[#FFE600]"] {
          color: ${accentColor} !important;
        }
        /* Override SVG fill */
        .fill-\\[\\#FFE600\\],
        [class*="fill-[#FFE600]"] {
          fill: ${accentColor} !important;
        }
        /* Override selection highlight */
        ::selection {
          background-color: ${accentColor} !important;
          color: #000000 !important;
        }
        ::-moz-selection {
          background-color: ${accentColor} !important;
          color: #000000 !important;
        }
        /* Custom hide scrollbar rule */
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />
      {/* Top Header */}
      <NeobrutalistHeader
        user={userProfile}
        onOpenMenu={() => {
          playRetroSound('click');
          setIsMenuOpen(true);
        }}
        hasUpdate={false}
        lastSynced={new Date()}
        onSync={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main App Store Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col">
        




        {/* Sticky Filter & Search Control Center */}
        <div className="sticky top-0 z-30 bg-[#ECE8DE]/95 backdrop-blur-md pt-1.5 pb-1.5 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-sm">
          {/* GitHub Sync Toast Notification */}
          <AnimatePresence>
            {githubSyncNotice && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className={`mb-2.5 border-2 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-[2px_2px_0px_#000] font-mono text-xs font-bold ${
                  githubSyncNotice.isError
                    ? 'bg-amber-100 border-amber-900 text-amber-950'
                    : 'bg-emerald-100 border-emerald-900 text-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Github className="w-4 h-4 text-black flex-shrink-0" />
                  <span className="truncate">{githubSyncNotice.message}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {githubSyncNotice.canOpenModal && (
                    <button
                      type="button"
                      onClick={() => {
                        playRetroSound('click');
                        setIsJsonModalOpen(true);
                        setGithubSyncNotice(null);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-black rounded-lg font-black text-[11px] uppercase cursor-pointer shadow-[1px_1px_0px_#000]"
                    >
                      Setup
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setGithubSyncNotice(null)}
                    className="text-neutral-800 hover:text-black font-black text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Store Navigation & Actions: Clean Unified Neo-Brutalist Bar */}
          <div className="mb-2 bg-white border-2 border-black rounded-xl p-1 sm:p-1.5 shadow-[1.5px_1.5px_0px_#000] flex items-center justify-between gap-1 select-none overflow-x-auto no-scrollbar">
            {/* Left: Store View Tabs with clean uppercase labels without parentheses */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Tab: ALL */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setActiveTab('all');
                  setVisibleCount(36);
                }}
                className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border-2 border-black flex items-center justify-center gap-1 transition-all cursor-pointer font-mono text-[11px] sm:text-xs font-black ${
                  activeTab === 'all'
                    ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_#000]'
                    : 'bg-[#FAF6EE] text-neutral-800 hover:bg-neutral-100'
                }`}
                title="All Applications"
              >
                <Grid className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                <span>ALL</span>
              </button>

              {/* Tab: UPDATES */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setActiveTab('updates');
                  setVisibleCount(36);
                }}
                className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border-2 border-black flex items-center justify-center gap-1 transition-all cursor-pointer font-mono text-[11px] sm:text-xs font-black ${
                  activeTab === 'updates'
                    ? 'bg-[#10B981] text-white shadow-[1px_1px_0px_#000]'
                    : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
                }`}
                title="GitHub & Custom Updated Apps"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                <span>UPDATES</span>
              </button>

              {/* Tab: UTILITIES */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setActiveTab('utilities');
                  setVisibleCount(36);
                }}
                className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border-2 border-black flex items-center justify-center gap-1 transition-all cursor-pointer font-mono text-[11px] sm:text-xs font-black ${
                  activeTab === 'utilities'
                    ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_#000]'
                    : 'bg-[#FAF6EE] text-neutral-800 hover:bg-neutral-100'
                }`}
                title="System Utilities & Tools"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-800" />
                <span className="hidden sm:inline">UTILITIES</span>
              </button>

              {/* Tab: SAVED */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setActiveTab('favorites');
                  setVisibleCount(36);
                }}
                className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg border-2 border-black flex items-center justify-center gap-1 transition-all cursor-pointer font-mono text-[11px] sm:text-xs font-black ${
                  activeTab === 'favorites'
                    ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_#000]'
                    : 'bg-[#FAF6EE] text-neutral-800 hover:bg-neutral-100'
                }`}
                title="Saved Favorites"
              >
                <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${favoriteIds.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-neutral-500'}`} />
                <span className="hidden sm:inline">SAVED</span>
              </button>
            </div>

            {/* Right: Actions (GitHub Sync, JSON Center, Add App) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* GitHub 1-Click Sync Button */}
              <button
                type="button"
                onClick={handleSyncGitHub}
                disabled={isSyncingGitHub}
                className="h-7 sm:h-8 px-2 bg-white hover:bg-neutral-100 text-black border-2 border-black rounded-lg flex items-center justify-center gap-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer font-mono text-[11px] font-black disabled:opacity-50"
                title="Sync update_apk.json from GitHub"
              >
                <Github className="w-3 h-3" />
                <RefreshCw className={`w-3 h-3 ${isSyncingGitHub ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden md:inline text-[10px]">Sync GitHub</span>
              </button>

              {/* JSON Modal Button */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setIsJsonModalOpen(true);
                }}
                className="h-7 sm:h-8 px-2 bg-[#FFE600] hover:bg-yellow-300 text-black border-2 border-black rounded-lg flex items-center justify-center gap-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer font-mono text-[11px] font-black"
                title="Update & Preview JSON / GitHub Config"
              >
                <FileJson className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline text-[10px]">JSON</span>
              </button>

              {/* Add App Button */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setIsRequestModalOpen(true);
                }}
                className="h-7 sm:h-8 px-2 bg-black hover:bg-neutral-800 text-[#FFE600] border-2 border-black rounded-lg flex items-center justify-center gap-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer font-mono text-[11px] font-black"
                title="Add New Android App"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span className="hidden sm:inline text-[10px]">Add</span>
              </button>
            </div>
          </div>

          {/* Clean Pixel-Perfect Smart Search Bar */}
          <div className="w-full mb-2">
            <div className="w-full bg-white border-2 border-black rounded-xl p-1 flex items-center gap-1 shadow-[1.5px_1.5px_0px_#000]">
              {/* Inner Input Container */}
              <div className="flex-1 flex items-center bg-[#FAF6EE] rounded-lg px-2.5 py-1 min-w-0 border border-black/20">
                <Search className="w-3.5 h-3.5 text-neutral-500 mr-1.5 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(36);
                  }}
                  placeholder="Search Android apps..."
                  className="w-full bg-transparent font-mono text-xs font-bold text-black placeholder:text-neutral-500 focus:outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer ml-1"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Yellow Action Search Button */}
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  searchInputRef.current?.focus();
                }}
                className="bg-[#FFE600] hover:bg-yellow-300 border-2 border-black text-black rounded-lg px-2.5 sm:px-3 py-1 font-mono text-[11px] font-black uppercase flex items-center gap-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer select-none whitespace-nowrap"
                title="Search Store"
              >
                <Search className="w-3 h-3 text-black stroke-[3]" />
                <span>SEARCH</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar with safe margin padding and native momentum swipe */}
          <div className="overflow-x-auto no-scrollbar flex items-center gap-1 py-0.5 mb-2 select-none scroll-smooth">
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playRetroSound('click');
                  setSelectedCategory(cat);
                  setVisibleCount(36);
                }}
                className={`px-2.5 py-1 text-[11px] font-black rounded-lg border-2 border-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#FFE600] text-black shadow-[1px_1px_0px_#000]'
                    : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Compact Mobile-Friendly Controls Bar */}
          <div className="flex items-center justify-between gap-1 select-none bg-white border-2 border-black rounded-xl p-1 sm:p-1.5 shadow-[1.5px_1.5px_0px_#000] mb-2.5 overflow-x-auto no-scrollbar">
            {/* Left: Section Title & Count */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <h2 className="text-[#6B21A8] font-black text-xs sm:text-sm tracking-wide uppercase leading-none">
                {searchQuery ? `SEARCH` : activeTab === 'all' ? 'ALL' : activeTab === 'updates' ? 'UPDATES' : activeTab === 'utilities' ? 'UTILITIES' : 'SAVED'}
              </h2>
              <span className="text-[10px] sm:text-xs font-mono font-black text-black bg-[#FFE600] border border-black px-1.5 py-0.5 rounded-md shadow-[1px_1px_0px_#000]">
                {filteredApps.length}
              </span>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] font-mono font-bold text-neutral-500 hover:text-black underline ml-0.5 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right: Actions (Stats, Request, Sort, View Mode) */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setShowStats(!showStats);
                }}
                className={`p-1 px-1.5 sm:px-2 border-2 border-black rounded-lg text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-tight shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1 ${
                  showStats
                    ? 'bg-black text-[#FFE600]'
                    : 'bg-[#FAF6EE] text-black hover:bg-neutral-100'
                }`}
                style={showStats ? { color: accentColor } : undefined}
                title="Toggle Live App Catalog Stats"
              >
                <BarChart3 className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">STATS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playRetroSound('click');
                  setIsRequestModalOpen(true);
                }}
                className="p-1 px-1.5 sm:px-2 border-2 border-black rounded-lg text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-tight shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1 bg-white hover:bg-neutral-100 text-black"
                title="Request a new Modded App"
              >
                <Mail className="w-3 h-3 stroke-[2.5]" />
                <span className="hidden sm:inline">REQUEST</span>
              </button>

              {/* Custom Neobrutalist Sort Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setIsSortOpen(!isSortOpen);
                  }}
                  className="flex items-center gap-1 bg-[#FFE600] border-2 border-black rounded-lg px-2 py-1 shadow-[1px_1px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer font-mono text-[9px] sm:text-xs font-black text-black uppercase select-none"
                >
                  <ArrowUpDown className="w-3 h-3 text-black stroke-[2.5]" />
                  <span>
                    {sortBy === 'recommended'
                      ? 'Default'
                      : sortBy === 'name'
                      ? 'Name'
                      : sortBy === 'patches'
                      ? 'Patches'
                      : 'Category'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-black stroke-[2.5]" />
                </button>

                {/* Floating Sort Options Menu */}
                {isSortOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsSortOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 z-40 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000] p-1 flex flex-col gap-0.5 min-w-[125px] select-none">
                      {[
                        { id: 'recommended', label: 'Default' },
                        { id: 'name', label: 'Name (A-Z)' },
                        { id: 'patches', label: 'Most Patches' },
                        { id: 'category', label: 'Category' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playRetroSound('click');
                            setSortBy(opt.id as SortOption);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono font-black uppercase transition-colors cursor-pointer ${
                            sortBy === opt.id
                              ? 'bg-[#FFE600] text-black border border-black shadow-[1px_1px_0px_#000]'
                              : 'text-neutral-800 hover:bg-neutral-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View Mode Toggle: Grid vs Compact List */}
              <div className="flex items-center bg-[#FAF6EE] border-2 border-black rounded-lg p-0.5 shadow-[1px_1px_0px_#000]">
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setViewMode('grid');
                  }}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#FFE600] border border-black shadow-[0.5px_0.5px_0px_#000]' : 'text-neutral-500 hover:text-black'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playRetroSound('click');
                    setViewMode('compact');
                  }}
                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'compact' ? 'bg-[#FFE600] border border-black shadow-[0.5px_0.5px_0px_#000]' : 'text-neutral-500 hover:text-black'
                  }`}
                  title="Compact list view"
                >
                  <List className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Catalog Insights Collapsible Dashboard */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden mb-5 w-full select-none"
            >
              <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#000] flex flex-col gap-4">
                {/* Header Stats Title */}
                <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-neutral-200">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FF5E00]" />
                    <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-black">
                      Live Orion Catalog Insights
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-black text-black bg-[#FFE600] border border-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#000]">
                    TOTAL INDEXED: {statsSummary.total} APPS
                  </span>
                </div>

                {/* Grid Grid Stats Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 shadow-[1.5px_1.5px_0px_#000] text-center">
                    <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Utilities</p>
                    <p className="font-black text-lg text-black mt-0.5">{statsSummary.utilities}</p>
                  </div>
                  <div className="bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 shadow-[1.5px_1.5px_0px_#000] text-center">
                    <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Media & Music</p>
                    <p className="font-black text-lg text-black mt-0.5">{statsSummary.media}</p>
                  </div>
                  <div className="bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 shadow-[1.5px_1.5px_0px_#000] text-center">
                    <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Social & Chats</p>
                    <p className="font-black text-lg text-black mt-0.5">{statsSummary.social}</p>
                  </div>
                  <div className="bg-[#FAF6EE] border-2 border-black rounded-xl p-2.5 shadow-[1.5px_1.5px_0px_#000] text-center">
                    <p className="text-[9px] font-mono font-bold text-neutral-500 uppercase">Total Mod Patches</p>
                    <p className="font-black text-lg text-[#6B21A8] mt-0.5">+{statsSummary.totalPatches}</p>
                  </div>
                </div>

                {/* Progress bars showing distribution percentage */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="font-mono text-[10px] font-black text-neutral-600 uppercase tracking-wider">
                    Category Distribution Percentage:
                  </h4>
                  {/* Utilities */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] font-black">
                      <span className="text-black">UTILITY MODS</span>
                      <span className="text-neutral-500">{statsSummary.total > 0 ? Math.round((statsSummary.utilities / statsSummary.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#FFE600] h-full rounded-full transition-all duration-500"
                        style={{ width: `${statsSummary.total > 0 ? (statsSummary.utilities / statsSummary.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Media */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] font-black">
                      <span className="text-black">MEDIA & MUSIC MODS</span>
                      <span className="text-neutral-500">{statsSummary.total > 0 ? Math.round((statsSummary.media / statsSummary.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#FFE600] h-full rounded-full transition-all duration-500"
                        style={{ width: `${statsSummary.total > 0 ? (statsSummary.media / statsSummary.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Social */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] font-black">
                      <span className="text-black">SOCIAL NETWORKS</span>
                      <span className="text-neutral-500">{statsSummary.total > 0 ? Math.round((statsSummary.social / statsSummary.total) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 border border-black rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#FFE600] h-full rounded-full transition-all duration-500"
                        style={{ width: `${statsSummary.total > 0 ? (statsSummary.social / statsSummary.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apps Render with Scroll Entrance Animations */}
        {isLoading && apps.length === 0 ? (
          <div className="bg-white border-[2.5px] border-black rounded-2xl p-12 text-center shadow-[4px_4px_0px_#000] my-6">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
            <p className="font-mono text-sm font-bold text-neutral-800">
              Loading 1,000+ apps from Orion-Data...
            </p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white border-[2.5px] border-black rounded-2xl p-10 text-center shadow-[4px_4px_0px_#000] my-4">
            <p className="font-black text-lg uppercase text-black mb-1">No Apps Found</p>
            <p className="font-mono text-xs sm:text-sm text-neutral-600 mb-4">
              {searchQuery
                ? `No apps matched your search "${searchQuery}". Try a different keyword like "youtube", "music", "social", or "shizuku".`
                : 'No apps available in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-[#FFE600] border-2 border-black rounded-xl text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : viewMode === 'compact' ? (
          /* Compact Rows View with scroll animation */
          <div className="flex flex-col gap-1.5 mt-2.5">
            {displayedApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.02 }}
                transition={{ duration: 0.3, delay: (index % 12) * 0.015 }}
              >
                <OrionAppCard
                  app={app}
                  index={index}
                  onSelectApp={(a) => setSelectedApp(a)}
                  isFavorite={favoriteIds.includes(app.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onDownloadClick={(a) => setDownloadingApp(a)}
                  onShareApp={(a) => setSharingApp(a)}
                  viewMode="compact"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Rich Grid Cards View with scroll animation */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 mt-2.5">
            {displayedApps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 35, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, amount: 0.02 }}
                transition={{ duration: 0.35, delay: (index % 12) * 0.02 }}
              >
                <OrionAppCard
                  app={app}
                  index={index}
                  onSelectApp={(a) => setSelectedApp(a)}
                  isFavorite={favoriteIds.includes(app.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onDownloadClick={(a) => setDownloadingApp(a)}
                  onShareApp={(a) => setSharingApp(a)}
                  viewMode="grid"
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button & Progress Meter */}
        {filteredApps.length > visibleCount && (
          <div className="flex flex-col items-center justify-center mt-8 gap-3">
            <div className="w-full max-w-xs bg-neutral-200 border-2 border-black rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#FFE600] h-full border-r-2 border-black transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((displayedApps.length / filteredApps.length) * 100))}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-neutral-600">
              Showing {displayedApps.length} of {filteredApps.length} apps ({Math.round((displayedApps.length / filteredApps.length) * 100)}%)
            </span>

            <button
              onClick={() => setVisibleCount((prev) => prev + 36)}
              className="py-3 px-8 bg-white hover:bg-[#FFE600] border-[2.5px] border-black rounded-2xl font-black text-sm uppercase shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all flex items-center gap-2"
            >
              <span>Load More Apps ({filteredApps.length - visibleCount} remaining)</span>
            </button>
          </div>
        )}

        {/* Technology Stack Marquee */}
        <div className="mt-8">
          <LogoLoop />
        </div>

        {/* Interactive Flip Card with User's Photo (clean, no overlay text) */}
        <motion.div
          initial={{ opacity: 0.85, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex justify-center w-full select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <FlipCard
            front={
              <img
                src="https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/front_image.jpg';
                }}
                alt="Front Image"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />
            }
            back={
              <img
                src="https://i.postimg.cc/mgF9FrTW/1776962820016-2.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/back_image.jpg';
                }}
                alt="Profile Photo"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />
            }
            axis="y"
            flipOnClick
            draggable
            dragDistance={0}
            tilt
            tiltMax={12}
            glare
            glareOpacity={0.22}
            hoverScale={1.03}
            perspective={1100}
            stiffness={170}
            damping={20}
            width={260}
            height={340}
            radius={20}
            background="#27272a"
            color="#f5f5f5"
            shadow
            shadowColor="#000000"
            shadowOpacity={0.45}
            onFlipChange={(flipped) => console.log(flipped)}
          />
        </motion.div>

        {/* TextPressure Variable Font Header */}
        <div className="w-full py-4 px-4 sm:px-6 bg-black border-t-4 border-b-4 border-black shadow-[0_4px_0px_#000] overflow-hidden my-10 select-none">
          <TextPressure
            text="ALEX JAMES DEV"
            flex={true}
            alpha={false}
            stroke={false}
            width={true}
            weight={true}
            italic={true}
            textColor="#ffffff"
            minFontSize={32}
          />
        </div>

        {/* Bottom Developer Banner with custom description */}
        <footer className="mt-8 mb-8 w-full select-none px-1">
          <div className="w-full max-w-lg mx-auto p-4 sm:p-6 bg-white border-[3px] border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_#000] sm:shadow-[5px_5px_0px_#000] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Top Verified Accent Tag */}
            <div className="inline-flex items-center gap-1.5 bg-[#FFE600] border border-black px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-black mb-2 shadow-[1px_1px_0px_#000]">
              <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
              <span>Developer</span>
            </div>

            {/* Developer Heading */}
            <div className="flex flex-col items-center justify-center gap-1 mb-2">
              <h2 className="font-black text-xl sm:text-2xl text-black tracking-tight uppercase leading-tight flex items-center justify-center gap-1.5">
                <span>ALEX JAMES</span>
                <button
                  type="button"
                  onClick={triggerHeartRain}
                  className="text-red-500 text-base sm:text-xl inline-block transition-transform hover:scale-125 active:scale-90 duration-200 cursor-pointer focus:outline-none"
                  title="Click for Heart Rain Animation!"
                >
                  ♥️
                </button>
              </h2>
            </div>

            {/* Description */}
            <p className="font-mono text-xs sm:text-[13px] text-neutral-700 leading-relaxed font-medium max-w-md mb-3 px-1">
              Empowering Android enthusiasts with lightning-fast open-source package discovery, verified modded releases, and direct APK mirrors.
            </p>

            {/* Tags */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-4">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-[#FAF6EE] text-black border border-black px-2.5 py-0.5 rounded-lg shadow-[1px_1px_0px_#000]">
                Android APKs
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-[#FAF6EE] text-black border border-black px-2.5 py-0.5 rounded-lg shadow-[1px_1px_0px_#000]">
                Neobrutalism
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-[#FFE600] text-black border border-black px-2.5 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_#000]">
                Open Source
              </span>
            </div>

            {/* Action Links */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs sm:max-w-sm pt-3 border-t-2 border-dashed border-neutral-200">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://github.com/AlexJamesHQ", "_blank", "noopener,noreferrer");
                }}
                className="w-full py-2.5 px-3 bg-white text-black border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_#000] hover:bg-neutral-100 hover:scale-[1.02] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 text-xs font-bold font-mono uppercase transition-all cursor-pointer"
              >
                <GitHubIcon className="w-4 h-4 inline" />
                <span>GitHub</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://alex-james.vercel.app", "_blank", "noopener,noreferrer");
                }}
                className="w-full py-2.5 px-3 bg-[#FFE600] text-black border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_#000] hover:bg-yellow-300 hover:scale-[1.02] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 text-xs font-black font-mono uppercase transition-all cursor-pointer"
              >
                <span>Portfolio</span>
                <ArrowUpRight className="w-4 h-4 inline stroke-[2.5]" />
              </a>
            </div>
          </div>
        </footer>

      </main>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3 bg-[#FFE600] border-2 border-black rounded-2xl shadow-[3px_3px_0px_#000] text-black hover:bg-yellow-300 hover:scale-110 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5 font-mono font-black text-xs uppercase"
            title="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Top</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* App Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <OrionAppDetailModal
            app={selectedApp}
            onClose={() => setSelectedApp(null)}
          />
        )}
      </AnimatePresence>

      {/* In-App Download Progress Animation Modal */}
      <AnimatePresence>
        {downloadingApp && (
          <InAppDownloadModal
            app={downloadingApp}
            onClose={() => setDownloadingApp(null)}
          />
        )}
      </AnimatePresence>

      {/* Settings Drawer */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentUser={userProfile}
        onSwitchUser={() => {}}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        availableCategories={categoriesWithCounts}
        sortBy="updated"
        onSelectSortBy={() => {}}
        totalStarredCount={apps.length}
        accentColor={accentColor}
        onAccentColorChange={handleAccentColorChange}
        gridStyle={gridStyle}
        onGridStyleChange={handleGridStyleChange}
        onRequestApp={() => setIsRequestModalOpen(true)}
      />

      {/* Request an App Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <RequestAppModal
            isOpen={isRequestModalOpen}
            onClose={() => setIsRequestModalOpen(false)}
            accentColor={accentColor}
            onAppCreated={handleAppCreated}
          />
        )}
      </AnimatePresence>

      {/* JSON Update & Live Preview Modal */}
      <AnimatePresence>
        {isJsonModalOpen && (
          <JsonUpdateModal
            isOpen={isJsonModalOpen}
            onClose={() => setIsJsonModalOpen(false)}
            currentUpdatedApps={customUpdatedApps}
            onApplyUpdates={handleApplyUpdates}
            onOpenAddModal={() => setIsRequestModalOpen(true)}
            onSelectApp={(app) => setSelectedApp(app)}
          />
        )}
      </AnimatePresence>

      {/* App Share Modal */}
      <AnimatePresence>
        {sharingApp && (
          <AppShareModal
            isOpen={!!sharingApp}
            app={sharingApp}
            onClose={() => setSharingApp(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating Heart Rain Animation */}
      {heartParticles.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {heartParticles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-heart-fall"
              style={{
                left: `${p.x}px`,
                top: `-50px`,
                fontSize: `${p.size}px`,
                animationDuration: `${p.speed}s`,
              }}
            >
              {p.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
