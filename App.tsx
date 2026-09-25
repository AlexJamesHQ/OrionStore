import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrionAppItem, GitHubUserProfile } from './types';
import { localAppsData } from './data/localAppsData';
import { fetchOrionApps } from './services/orionAppsService';
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
  GitHubIcon,
} from './components';
import {
  Search,
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
  ArrowUp,
  TrendingUp,
} from 'lucide-react';

type StoreTab = 'all' | 'featured' | 'utilities' | 'favorites';
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

  const [viewMode, setViewMode] = useState<'grid' | 'compact'>(() => {
    try {
      return (localStorage.getItem('orion_view_mode') as 'grid' | 'compact') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const [visibleCount, setVisibleCount] = useState<number>(36);

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

  // Load all 1,081+ Orion Apps on mount
  useEffect(() => {
    const loadApps = async () => {
      setIsLoading(true);
      try {
        const loaded = await fetchOrionApps();
        if (loaded && loaded.length > 0) {
          setApps(loaded);
        }
      } catch (err) {
        console.error('Failed to load Orion apps:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadApps();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      localStorage.removeItem('orion_apps_data_v3');
      const freshApps = await fetchOrionApps();
      if (freshApps && freshApps.length > 0) {
        setApps(freshApps);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleFavorite = (appId: string) => {
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
    if (activeTab === 'featured') {
      return apps.filter((a) => a.isFeatured || (a.patches && a.patches.length > 0));
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
  }, [apps, activeTab, favoriteIds]);

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

  // Paginated display
  const displayedApps = useMemo(() => {
    return filteredApps.slice(0, visibleCount);
  }, [filteredApps, visibleCount]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full bg-cream-grid flex flex-col text-black antialiased selection:bg-[#FFE600] selection:text-black">
      {/* Top Header */}
      <NeobrutalistHeader
        user={userProfile}
        onOpenMenu={() => setIsMenuOpen(true)}
        hasUpdate={false}
        lastSynced={new Date()}
        onSync={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main App Store Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col">
        




        {/* Sticky Filter & Search Control Center */}
        <div className="sticky top-0 z-30 bg-[#ECE8DE]/95 backdrop-blur-md pt-3 pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 shadow-sm">
          {/* High-Performance Smart Search Bar styled exactly like the reference image */}
          <div className="w-full mb-3.5">
            <div className="w-full bg-white border-[3px] border-black rounded-full p-1.5 flex items-center shadow-[4px_4px_0px_#000]">
              {/* Inner Input Wrapper with cream background and light gray/black border */}
              <div className="flex-1 flex items-center bg-[#FAF6EE] border-2 border-neutral-400 rounded-full py-1.5 px-3.5 min-w-0 mr-1.5">
                <Search className="w-4 h-4 text-neutral-400 mr-2 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(36);
                  }}
                  placeholder="Search Android apps..."
                  className="w-full bg-transparent font-mono text-xs sm:text-sm font-bold text-black placeholder:text-neutral-500 focus:outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-neutral-400 hover:text-black cursor-pointer ml-1"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Yellow Action Search Button */}
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.focus();
                }}
                className="bg-[#FFE600] border-2 border-black text-black rounded-full px-4 sm:px-5 py-2 sm:py-2.5 font-mono text-xs sm:text-sm font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] hover:bg-yellow-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer select-none whitespace-nowrap"
                title="Search Store"
              >
                <Search className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>SEARCH</span>
              </button>
            </div>
          </div>

          {/* Popular Quick-Search Suggestions Pills */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto hide-scrollbar pb-1 select-none">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase flex items-center gap-1 flex-shrink-0 mr-1">
              <TrendingUp className="w-3 h-3 text-[#FF5E00]" />
              <span>Trending:</span>
            </span>
            {POPULAR_SEARCH_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setSearchQuery(pill.query);
                  setVisibleCount(36);
                }}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border border-black whitespace-nowrap transition-all cursor-pointer ${
                  searchQuery.toLowerCase() === pill.query.toLowerCase()
                    ? 'bg-[#FFE600] text-black shadow-[1.5px_1.5px_0px_#000]'
                    : 'bg-white hover:bg-[#FAF6EE] text-neutral-700 shadow-[1px_1px_0px_#000]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Category Chips Bar with counts */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto hide-scrollbar pb-1 select-none">
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(36);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#FFE600] text-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 shadow-[1px_1px_0px_#000]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Controls Bar: Results Count + Sort Dropdown (Neobrutalist Styled) + View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none bg-white border-2 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000]">
            {/* Left: Section Title & Count */}
            <div className="flex items-center gap-2">
              <h2 className="text-[#6B21A8] font-black text-sm sm:text-base tracking-[0.08em] uppercase leading-none">
                {searchQuery ? `SEARCH: "${searchQuery}"` : activeTab === 'all' ? 'ALL APPS' : activeTab === 'featured' ? 'FEATURED APPS' : activeTab === 'utilities' ? 'UTILITIES' : 'SAVED APPS'}
              </h2>
              <span className="text-xs font-mono font-black text-black bg-[#FFE600] border-2 border-black px-2 py-0.5 rounded-lg shadow-[1.5px_1.5px_0px_#000]">
                {filteredApps.length}
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-mono font-bold text-neutral-500 hover:text-black underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Right: Neobrutalist Styled Sort and View Mode */}
            <div className="flex items-center gap-2">
              {/* Sort Selector with Neobrutalist styling */}
              <div className="flex items-center gap-1.5 bg-[#FFE600] border-2 border-black rounded-xl px-3 py-1.5 shadow-[2px_2px_0px_#000]">
                <ArrowUpDown className="w-3.5 h-3.5 text-black stroke-[3]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-mono text-xs font-black text-black focus:outline-none cursor-pointer uppercase"
                >
                  <option value="recommended">Featured / Relevant</option>
                  <option value="name">Name (A → Z)</option>
                  <option value="patches">Most Patches</option>
                  <option value="category">Category</option>
                </select>
              </div>

              {/* View Mode Toggle: Grid vs Compact List */}
              <div className="flex items-center bg-[#FAF6EE] border-2 border-black rounded-xl p-0.5 shadow-[2px_2px_0px_#000]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#FFE600] border border-black shadow-[1px_1px_0px_#000]' : 'text-neutral-500 hover:text-black'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'compact' ? 'bg-[#FFE600] border border-black shadow-[1px_1px_0px_#000]' : 'text-neutral-500 hover:text-black'
                  }`}
                  title="Compact list view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

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
          <div className="flex flex-col gap-2">
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
                  viewMode="compact"
                />
              </motion.div>
            ))}
          </div>
        ) : (
          /* Rich Grid Cards View with scroll animation */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
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
        >
          <FlipCard
            front={
              <img
                src="https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/front_image.jpg';
                }}
                alt="Front Image"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            }
            back={
              <img
                src="https://i.postimg.cc/mgF9FrTW/1776962820016-2.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/back_image.jpg';
                }}
                alt="Profile Photo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
        <div className="w-full py-4 px-4 sm:px-6 bg-[#09090f] border-t-4 border-b-4 border-black shadow-[0_4px_0px_#000] overflow-hidden my-10">
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
                href="https://github.com/AlexJamesHQ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 bg-white text-black border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_#000] hover:bg-neutral-100 hover:scale-[1.02] active:translate-x-[1px] active:translate-y-[1px] flex items-center justify-center gap-1.5 text-xs font-bold font-mono uppercase transition-all cursor-pointer"
              >
                <GitHubIcon className="w-4 h-4 inline" />
                <span>GitHub</span>
              </a>

              <a
                href="https://alex-james.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
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
      />

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
