import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Repository, GitHubUserProfile, hasActualApk } from './types';
import {
  fetchGitHubUserData,
  extractGitHubUsername,
} from './services/githubApi';
import {
  checkForAppUpdates,
  AppUpdateInfo,
  isUpdatePermanentlyIgnored,
  recordUpdateDismissal,
} from './services/updaterService';
import {
  NeobrutalistHeader,
  TotalStarredCard,
  RepoCard,
  MenuDrawer,
  RepoDetailsModal,
  AppUpdateModal,
  InAppDownloadModal,
  InAppDownloadInfo,
  LogoLoop,
  FlipCard,
  TextPressure,
  GitHubIcon,
} from './components';
import { ApkFilterMode } from './components/MenuDrawer';
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  X,
  ArrowUpRight,
  Zap,
  Link as LinkIcon,
  Sparkles,
  Download,
} from 'lucide-react';

type TabView = 'public' | 'starred' | 'apk';

const App: React.FC = () => {
  // Current active user - default starts with AlexJamesHQ
  const [currentUsername, setCurrentUsername] = useState('AlexJamesHQ');
  const [userProfile, setUserProfile] = useState<GitHubUserProfile>({ login: 'AlexJamesHQ', name: 'Loading…', avatar_url: 'https://github.com/AlexJamesHQ.png', html_url: 'https://github.com/AlexJamesHQ', bio: '', company: null, location: null, blog: null, public_repos: 0, followers: 0, following: 0, starred_count: 0 });

  // Repositories buckets: Public repos & Starred repos for AlexJamesHQ
  const [publicRepos, setPublicRepos] = useState<Repository[]>([]);
  const [starredRepos, setStarredRepos] = useState<Repository[]>([]);

  // Active Tab view: Default is 'public'
  const [activeTab, setActiveTab] = useState<TabView>('public');

  // Loading & status
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // App & APK Update checking state
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // GitHub User or Profile Link Search Input
  const [usernameInput, setUsernameInput] = useState('');

  // Search filter query (empty by default)
  const [repoFilterQuery, setRepoFilterQuery] = useState('');

  // Category and sorting filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [apkFilterMode, setApkFilterMode] = useState<ApkFilterMode>('all');
  const hideNonApk = apkFilterMode === 'apk_only';

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
      setHeartParticles((prev) => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 5000);
  };

  // Modals state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [inAppDownloadInfo, setInAppDownloadInfo] = useState<InAppDownloadInfo | null>(null);

  // Check for app/APK updates automatically on load and fetch live real-time GitHub data
  useEffect(() => {
    // Live real-time fetch from GitHub on load
    loadUserData('AlexJamesHQ', true);

    const runUpdateCheck = async () => {
      setIsCheckingUpdate(true);
      try {
        const info = await checkForAppUpdates();
        setUpdateInfo(info);
        // If user has dismissed the update banner 3 times, do not show banner automatically
        if (info.hasUpdate && isUpdatePermanentlyIgnored(info.latestVersion)) {
          setIsBannerDismissed(true);
        }
      } finally {
        setIsCheckingUpdate(false);
      }
    };
    runUpdateCheck();
  }, []);

  // Dismiss banner handler: records dismissal count. If dismissed 3 times, it stops popping up automatically.
  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    if (updateInfo?.latestVersion) {
      recordUpdateDismissal(updateInfo.latestVersion);
    }
  };

  // Function to load any GitHub user profile & repositories with real-time freshness
  const loadUserData = async (usernameOrUrl: string, fresh: boolean = true) => {
    const cleanUser = extractGitHubUsername(usernameOrUrl);
    if (!cleanUser) return;

    setIsLoading(true);
    try {
      const data = await fetchGitHubUserData(cleanUser, fresh);
      const nextPublic = Array.isArray(data.publicRepos) ? data.publicRepos : [];
      const nextStarred = Array.isArray(data.starredRepos) ? data.starredRepos : [];

      const nextProfile: GitHubUserProfile = data.profile || {
        login: cleanUser,
        name: cleanUser,
        avatar_url: `https://github.com/${cleanUser}.png`,
        html_url: `https://github.com/${cleanUser}`,
        bio: `GitHub Profile for ${cleanUser}`,
        company: null,
        location: null,
        blog: null,
        public_repos: nextPublic.length,
        followers: 0,
        following: 0,
        starred_count: nextStarred.length,
      };

      setUserProfile(nextProfile);
      setPublicRepos(nextPublic);
      setStarredRepos(nextStarred);
      setCurrentUsername(nextProfile.login || cleanUser);

      // Reset filters so ALL repos are shown for newly loaded user
      setActiveTab('public');
      setApkFilterMode('all');
      setSelectedCategory('All');
      setRepoFilterQuery('');

      // Now sync updates specifically for this searched user with their real repositories
      const upInfo = await checkForAppUpdates();
      if (upInfo) {
        setUpdateInfo(upInfo);
      }
    } catch {
      // Gracefully retain existing state
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh current user data with live fresh flag and sync updates
  const handleRefresh = async (user: string) => {
    setIsRefreshing(true);
    try {
      const data = await fetchGitHubUserData(user, true);
      const nextPublic = Array.isArray(data.publicRepos) ? data.publicRepos : [];
      const nextStarred = Array.isArray(data.starredRepos) ? data.starredRepos : [];

      const nextProfile: GitHubUserProfile = data.profile || {
        login: user,
        name: user,
        avatar_url: `https://github.com/${user}.png`,
        html_url: `https://github.com/${user}`,
        bio: `GitHub Profile for ${user}`,
        company: null,
        location: null,
        blog: null,
        public_repos: nextPublic.length,
        followers: 0,
        following: 0,
        starred_count: nextStarred.length,
      };

      setUserProfile(nextProfile);
      setPublicRepos(nextPublic);
      setStarredRepos(nextStarred);
      setCurrentUsername(nextProfile.login || user);
      const info = await checkForAppUpdates();
      setUpdateInfo(info);
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  // Switch user handler
  const handleSwitchUser = (user: string) => {
    loadUserData(user, true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search: 's'
      if (e.key === 's' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search GitHub"]')?.focus();
      }
      // Refresh: 'r'
      if (e.key === 'r') {
        e.preventDefault();
        handleRefresh(currentUsername);
      }
      // Cycle repositories: Arrow keys
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        const repoCards = document.querySelectorAll('.group.relative');
        if (repoCards.length === 0) return;
        
        const activeElement = document.activeElement;
        let index = -1;
        repoCards.forEach((card, i) => { if (card === activeElement) index = i; });
        
        if (e.key === 'ArrowDown') {
          const next = index === -1 ? 0 : Math.min(index + 1, repoCards.length - 1);
          (repoCards[next] as HTMLElement).focus();
        } else {
          const prev = index === -1 ? repoCards.length - 1 : Math.max(index - 1, 0);
          (repoCards[prev] as HTMLElement).focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUsername, handleRefresh]);

  // Submit GitHub username or link in search bar
  const handleUserSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    loadUserData(usernameInput.trim(), true);
    setUsernameInput('');
  };


  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const info = await checkForAppUpdates();
      setUpdateInfo(info);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Listen for pasted link or Enter press in the repository filter box
  const handleRepoFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = repoFilterQuery.trim();
      if (
        val.includes('github.com/') ||
        val.startsWith('http://') ||
        val.startsWith('https://') ||
        val.startsWith('@')
      ) {
        e.preventDefault();
        loadUserData(val);
        setRepoFilterQuery('');
      }
    }
  };

  const handleRepoFilterChange = (val: string) => {
    setRepoFilterQuery(val);
    if (
      val.includes('github.com/') ||
      (val.startsWith('http') && val.includes('github'))
    ) {
      loadUserData(val);
      setRepoFilterQuery('');
    }
  };

  // Combined Repositories based on active tab
  const currentBaseList = useMemo(() => {
    if (activeTab === 'public') return publicRepos;
    if (activeTab === 'starred') return starredRepos;
    // 'apk' tab shows only APK repos
    const combined = [...publicRepos, ...starredRepos];
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (!hasActualApk(r)) return false;
      if (seen.has(r.full_name)) return false;
      seen.add(r.full_name);
      return true;
    });
  }, [activeTab, publicRepos, starredRepos]);

  // Total APK count across all repos
  const totalApkCount = useMemo(() => {
    const combined = [...publicRepos, ...starredRepos];
    const seen = new Set<string>();
    return combined.filter((r) => {
      if (!hasActualApk(r)) return false;
      if (seen.has(r.full_name)) return false;
      seen.add(r.full_name);
      return true;
    }).length;
  }, [publicRepos, starredRepos]);

  // Counts for the currently active tab's list
  const currentApkCount = useMemo(
    () => currentBaseList.filter((r) => hasActualApk(r)).length,
    [currentBaseList]
  );
  const currentNonApkCount = useMemo(
    () => currentBaseList.filter((r) => !hasActualApk(r)).length,
    [currentBaseList]
  );

  // Extract Categories available in current list
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    currentBaseList.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return Array.from(cats);
  }, [currentBaseList]);

  // Filtered & Sorted repositories
  const filteredRepos = useMemo(() => {
    return currentBaseList
      .filter((repo) => {
        const query = repoFilterQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          repo.name.toLowerCase().includes(query) ||
          (repo.description && repo.description.toLowerCase().includes(query)) ||
          repo.category?.toLowerCase().includes(query) ||
          (repo.latestRelease?.apkName && repo.latestRelease.apkName.toLowerCase().includes(query)) ||
          (repo.latestRelease?.tagName && repo.latestRelease.tagName.toLowerCase().includes(query));

        const matchesCategory =
          selectedCategory === 'All' || repo.category === selectedCategory;

        const isApk = hasActualApk(repo);
        let matchesApkFilter = true;
        if (apkFilterMode === 'apk_only') {
          matchesApkFilter = isApk;
        } else if (apkFilterMode === 'non_apk_only') {
          // "আর ওখানে কিলিক করলে apk ছারা যেগুলো আছে ওই গুলো দেখাবে"
          matchesApkFilter = !isApk;
        }

        return matchesQuery && matchesCategory && matchesApkFilter;
      })
      .sort((a, b) => {
        // Repositories with authentic APK are ALWAYS placed first
        const aHasApk = hasActualApk(a);
        const bHasApk = hasActualApk(b);
        if (aHasApk && !bHasApk) return -1;
        if (!aHasApk && bHasApk) return 1;

        if (sortBy === 'updated') {
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        }
        if (sortBy === 'stars') {
          if (b.stargazers_count !== a.stargazers_count) {
            return b.stargazers_count - a.stargazers_count;
          }
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }, [currentBaseList, repoFilterQuery, selectedCategory, sortBy, apkFilterMode]);

  // Display Name: dynamic clean name of the active user
  const displayName = (userProfile.name || userProfile.login).toUpperCase();

  return (
    <div className="min-h-screen w-full bg-cream-grid flex flex-col text-black antialiased selection:bg-[#FFE600] selection:text-black">
      {/* Top Header: Displays user name, in-app APK update notifier, and Settings button */}
      <NeobrutalistHeader
        user={userProfile}
        onOpenMenu={() => setIsMenuOpen(true)}
        hasUpdate={Boolean(updateInfo?.hasUpdate)}
        onOpenUpdate={() => setIsUpdateModalOpen(true)}
        lastSynced={new Date()}
      />

      {/* Main Website Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col">
        {/* Top Interactive In-App APK Update Banner if update is available and not dismissed */}
        {updateInfo?.hasUpdate && !isBannerDismissed && (
          <div className="w-full mb-3 bg-[#FFE600] border-[2.5px] border-black rounded-2xl p-3 sm:p-3.5 shadow-[3px_3px_0px_#000] flex items-center justify-between gap-3 animate-pop-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-black text-[#FFE600] flex items-center justify-center flex-shrink-0 font-black animate-pulse">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">
                    APK Update Available: {updateInfo.latestVersion}
                  </p>
                  <span className="hidden sm:inline text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded">
                    NEW
                  </span>
                </div>
                <p className="font-mono text-[11px] text-neutral-800 truncate">
                  Direct release download & installer ready from GitHub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setIsUpdateModalOpen(true);
                  handleDismissBanner();
                }}
                className="py-1.5 px-3 bg-black text-white border-2 border-black rounded-xl font-black text-xs uppercase flex items-center gap-1.5 hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Get APK</span>
              </button>

              <button
                onClick={handleDismissBanner}
                className="p-1.5 bg-white border-2 border-black rounded-xl text-black hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                title="Dismiss update banner"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar with Quick Action */}
        <div className="w-full mb-3">
          <form
            onSubmit={handleUserSearchSubmit}
            className="flex items-center gap-2 bg-white border-[2.5px] border-black p-1.5 sm:p-2 rounded-2xl shadow-[3px_3px_0px_#000] hover:shadow-[4px_4px_0px_#000] transition-all"
          >
            <div className="relative flex-1 flex items-center">
              <LinkIcon className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Search GitHub username or profile link (e.g. AlexJamesHQ)..."
                className="w-full bg-[#FAF6EE] border-2 border-black/40 focus:border-black rounded-xl py-2 pl-9 pr-3 font-mono text-xs sm:text-sm font-semibold text-black placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#FFE600] transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 sm:px-4 py-2 bg-[#FFE600] border-2 border-black rounded-xl font-black text-xs uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] active:translate-x-[1px] active:translate-y-[1px] flex-shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Quick</span>
            </button>
          </form>
        </div>

        {/* The 3 Stats in ONE BEAUTIFUL CLEAN LINE: Public (1st), Starred (2nd), Favorites/APK (3rd) */}
        <TotalStarredCard
          publicCount={Math.max(userProfile.public_repos || 0, publicRepos.length)}
          starredCount={Math.max(userProfile.starred_count || 0, starredRepos.length)}
          apkCount={totalApkCount}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedCategory('All');
          }}
          displayName={displayName}
          isRefreshing={isRefreshing || isLoading}
          onRefresh={() => handleRefresh(currentUsername)}
        />

        {/* Repository Filter Search (EMPTY by default) */}
        <div className="w-full mb-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={repoFilterQuery}
              onChange={(e) => handleRepoFilterChange(e.target.value)}
              onKeyDown={handleRepoFilterKeyDown}
              placeholder="Search by repository name, APK, or paste github.com/username..."
              className="w-full bg-white border-[2.5px] border-black rounded-2xl py-3 pl-10 pr-10 font-mono text-sm font-semibold text-black placeholder:text-neutral-500 shadow-[3px_3px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#FFE600] transition-all"
            />
            <Search className="w-5 h-5 text-neutral-500 absolute left-3.5 pointer-events-none" />
            {repoFilterQuery && (
              <button
                onClick={() => setRepoFilterQuery('')}
                className="absolute right-3 p-1 text-neutral-400 hover:text-black hover:scale-110 transition-transform cursor-pointer"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto hide-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-xl border-2 border-black whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              All ({currentBaseList.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-black whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section Heading & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2 mb-4 select-none">
          {/* Left: Title + Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="text-[#6B21A8] font-black text-base sm:text-xl tracking-[0.08em] uppercase leading-none truncate">
              {activeTab === 'public'
                ? 'PUBLIC REPOSITORIES'
                : activeTab === 'starred'
                ? 'STARRED REPOSITORIES'
                : 'APK RELEASES & APPS'}
            </h3>
            <span className="text-xs font-mono font-black text-black bg-[#FFE600] border-2 border-black px-2.5 py-0.5 rounded-lg shadow-[2px_2px_0px_#000] flex-shrink-0">
              {filteredRepos.length}
            </span>
          </div>

          {/* Right Controls: Refresh + Filter Settings */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-auto">
            <button
              onClick={() => handleRefresh(currentUsername)}
              title="Refresh repositories and releases from GitHub"
              className="p-1.5 sm:p-2 px-2.5 sm:px-2 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:bg-neutral-100 hover:scale-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="text-xs font-mono font-bold uppercase sm:hidden">Sync</span>
            </button>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="px-3 py-1.5 text-xs font-bold font-mono uppercase bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] hover:bg-neutral-100 hover:scale-105 flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Repositories List with Comfortable Spacing */}
        {isLoading ? (
          <div className="bg-white border-[2.5px] border-black rounded-2xl p-12 text-center shadow-[4px_4px_0px_#000] my-6 animate-pop-in">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
            <p className="font-mono text-sm font-bold text-neutral-800">
              Fetching repositories and releases from GitHub for @{currentUsername}...
            </p>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="bg-white border-[2.5px] border-black rounded-2xl p-10 text-center shadow-[4px_4px_0px_#000] my-4 animate-pop-in">
            <p className="font-black text-lg uppercase text-black mb-1">
              No Repositories Found
            </p>
            <p className="font-mono text-xs sm:text-sm text-neutral-600 mb-4">
              {repoFilterQuery
                ? `No repositories matched your search "${repoFilterQuery}".`
                : `No repositories found in this section for @${currentUsername}.`}
            </p>
            <div className="flex justify-center gap-2">
              {repoFilterQuery && (
                <button
                  onClick={() => setRepoFilterQuery('')}
                  className="px-3.5 py-2 bg-[#FFE600] border-2 border-black rounded-xl text-xs font-bold uppercase shadow-[2px_2px_0px_#000] hover:bg-yellow-300 hover:scale-105 transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {filteredRepos.map((repo, index) => (
              <RepoCard
                key={repo.id || repo.full_name}
                repo={repo}
                index={index}
                onSelectRepo={(r) => setSelectedRepo(r)}
                onOpenInAppDownload={(info) => setInAppDownloadInfo(info)}
              />
            ))}
          </div>
        )}
        
        {/* Technology Stack Marquee */}
        <div className="mt-4">
          <LogoLoop />
        </div>

        {/* Interactive Flip Card - Clean Dual Image Showcase with Scroll Scale Animation */}
        <motion.div
          initial={{ opacity: 0.85, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex justify-center w-full"
        >
          <FlipCard
            front={
              <img
                src="/front_image.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "https://github.com/user-attachments/assets/39d57249-29e6-447a-8da9-3d9ad92cb796";
                }}
                alt="Wooded landscape"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            }
            back={
              <img
                src="https://i.postimg.cc/mgF9FrTW/1776962820016-2.jpg"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/back_image.jpg";
                }}
                alt="Featured Artwork"
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

        {/* TextPressure Interactive Variable Font Header */}
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

        {/* Bottom Motion Echo Developer Banner - Responsive Mobile-Optimized Neobrutalist Card */}
        <footer className="mt-10 sm:mt-14 mb-8 sm:mb-10 w-full select-none px-1">
          <div className="w-full max-w-lg mx-auto p-4 sm:p-6 bg-white border-[3px] border-black rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_#000] sm:shadow-[5px_5px_0px_#000] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Top Verified Accent Tag */}
            <div className="inline-flex items-center gap-1.5 bg-[#FFE600] border border-black px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-black mb-2 shadow-[1px_1px_0px_#000]">
              <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
              <span>Developer</span>
            </div>

            {/* Developer Alex James Heading */}
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
              Crafted with a minimalist Neobrutalist design philosophy for rapid GitHub repository discovery, starred collections, and direct Android APK package releases.
            </p>

            {/* Tags - Wraps beautifully on mobile */}
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

            {/* Action Links: Balanced 50/50 Grid on Mobile */}
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

      {/* Settings Drawer - Contains Facebook, Instagram, Telegram Channel, APK Updater & GitHub */}
      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentUser={userProfile}
        onSwitchUser={handleSwitchUser}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        availableCategories={availableCategories}
        sortBy={sortBy}
        onSelectSortBy={setSortBy}
        apkFilterMode={apkFilterMode}
        onSelectApkFilterMode={setApkFilterMode}
        hideNonApk={apkFilterMode === 'apk_only'}
        onToggleHideNonApk={(hide) => setApkFilterMode(hide ? 'apk_only' : 'all')}
        onOpenTelegram={() => {}}
        totalStarredCount={starredRepos.length}
        hasUpdate={Boolean(updateInfo?.hasUpdate)}
        onOpenUpdate={() => setIsUpdateModalOpen(true)}
      />

      {/* In-App APK Updater Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        isChecking={isCheckingUpdate}
        onCheckAgain={handleManualCheckUpdate}
        currentUser={currentUsername || 'AlexJamesHQ'}
      />

      {/* Repo Details Inspect Modal */}
      <RepoDetailsModal
        repo={selectedRepo}
        onClose={() => setSelectedRepo(null)}
      />

      {/* In-App Download Overview Modal */}
      <InAppDownloadModal
        isOpen={Boolean(inAppDownloadInfo)}
        info={inAppDownloadInfo}
        onClose={() => setInAppDownloadInfo(null)}
      />

      {/* Heart Rain Animation Overlay */}
      {heartParticles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {heartParticles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-soft-heart-rain select-none"
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
