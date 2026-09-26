import { OrionAppItem } from '../types';
import { localAppsData } from '../data/localAppsData';
import defaultUpdateApkData from '../data/update_apk.json';

const CACHE_KEY = 'orion_apps_data_v5_clean';

// Excluded non-app, PC software, or unwanted items
const BLOCKED_APP_IDS = new Set([
  'capcut-premium',
  'capcut',
  'audacity',
  'audacity-mod',
  'obs-studio',
  'obs',
]);

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

export async function fetchOrionApps(): Promise<OrionAppItem[]> {
  // Clear old stale caches
  try {
    ['orion_apps_data_v1', 'orion_apps_data_v2', 'orion_apps_data_v3', 'orion_apps_data_v4_clean'].forEach((k) =>
      localStorage.removeItem(k)
    );
  } catch {}

  let allApps: OrionAppItem[] = [];

  // Tier 0: Check fresh clean cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allApps = parsed;
      }
    }
  } catch {}

  // Tier 1: Try to fetch live from the OrionStore GitHub repository
  if (allApps.length === 0) {
    try {
      const remoteRes = await fetch(
        'https://raw.githubusercontent.com/AlexJamesHQ/OrionStore/main/apps.json'
      );
      if (remoteRes.ok) {
        const remoteApps = await remoteRes.json();
        if (Array.isArray(remoteApps) && remoteApps.length > 0) {
          allApps = remoteApps;
        }
      }
    } catch (err) {
      console.warn('Official repo apps.json not yet available, falling back to local apps data:', err);
    }
  }

  // Tier 2: Clean fallback to local curated apps
  if (allApps.length === 0) {
    allApps = (localAppsData as OrionAppItem[]) || [];
  }

  // Filter out any PC desktop software, non-apps, or blocked IDs
  allApps = allApps.filter((app) => {
    if (!app || !app.id) return false;
    const lowerId = (app.id || '').toLowerCase();
    const lowerName = (app.name || '').toLowerCase();
    const lowerAuthor = (app.author || '').toLowerCase();
    const lowerPlatform = (app.platform || '').toLowerCase();

    if (BLOCKED_APP_IDS.has(lowerId)) return false;
    if (lowerName.includes('capcut') || lowerName.includes('audacity') || lowerName.includes('obs studio') || lowerName.includes('obs')) return false;
    if (lowerAuthor.includes('bytedance') && lowerName.includes('capcut')) return false;
    if (lowerPlatform.includes('pc') || lowerPlatform.includes('desktop')) return false;
    return true;
  });

  // Prioritize user's requested 24 apps at the top
  const prioritizedMap = new Map<string, OrionAppItem>();
  const priorityList: OrionAppItem[] = [];
  const otherList: OrionAppItem[] = [];

  // Match priority package names
  PRIORITY_PACKAGE_NAMES.forEach((pkg) => {
    const found = allApps.find(
      (a) => a.packageName && a.packageName.toLowerCase() === pkg.toLowerCase()
    );
    if (found && !prioritizedMap.has(found.id)) {
      prioritizedMap.set(found.id, { ...found, isFeatured: true });
      priorityList.push({ ...found, isFeatured: true });
    }
  });

  // Add remaining apps
  allApps.forEach((app) => {
    if (!prioritizedMap.has(app.id)) {
      otherList.push(app);
      prioritizedMap.set(app.id, app);
    }
  });

  const finalApps = [...priorityList, ...otherList];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(finalApps));
  } catch {}

  return finalApps;
}

export function getDownloadUrlForApp(app: OrionAppItem): string {
  if (app.downloadUrl && app.downloadUrl !== '#' && !app.downloadUrl.startsWith('#')) {
    return app.downloadUrl;
  }
  if (app.variants && app.variants.length > 0 && app.variants[0].url) {
    return app.variants[0].url;
  }
  if (app.githubRepo) {
    return `https://github.com/${app.githubRepo}/releases`;
  }
  if (app.repoUrl) {
    return app.repoUrl;
  }
  return '#';
}

const CUSTOM_UPDATED_APPS_KEY = 'orion_custom_updated_apps_v3';
export const GITHUB_UPDATE_URL_KEY = 'orion_github_update_apk_url';
export const GITHUB_UPDATE_URLS_KEY = 'orion_github_update_apk_urls_v2';
export const GITHUB_AUTO_SYNC_KEY = 'orion_github_auto_sync_enabled';

// Default sample repository reference (can be customized by user anytime)
export const DEFAULT_GITHUB_UPDATE_URL =
  'https://raw.githubusercontent.com/AlexJamesHQ/OrionStore/main/update_apk.json';

/**
 * Automatically converts normal GitHub repo / blob URLs to direct raw links
 * Examples:
 * - https://github.com/user/repo/blob/main/update_apk.json -> https://raw.githubusercontent.com/user/repo/main/update_apk.json
 * - https://github.com/user/repo -> https://raw.githubusercontent.com/user/repo/main/update_apk.json
 * - user/repo -> https://raw.githubusercontent.com/user/repo/main/update_apk.json
 */
export function normalizeGitHubRawUrl(url: string): string {
  let cleaned = (url || '').trim();
  if (!cleaned) return '';

  // Case: user/repo short format
  if (/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+$/.test(cleaned)) {
    return `https://raw.githubusercontent.com/${cleaned}/main/update_apk.json`;
  }

  // Case: github.com/user/repo/blob/branch/file.json
  if (cleaned.includes('github.com') && cleaned.includes('/blob/')) {
    cleaned = cleaned
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('http://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/blob/', '/');
    return cleaned;
  }

  // Case: github.com/user/repo/raw/branch/file.json
  if (cleaned.includes('github.com') && cleaned.includes('/raw/')) {
    cleaned = cleaned
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('http://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/raw/', '/');
    return cleaned;
  }

  // Case: https://github.com/user/repo or https://github.com/user/repo/
  const repoMatch = cleaned.match(/^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)\/?$/);
  if (repoMatch) {
    const [, user, repo] = repoMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/main/update_apk.json`;
  }

  return cleaned;
}

/**
 * Retrieves list of GitHub update URLs (up to 5 links)
 */
export function getGitHubUpdateUrls(): string[] {
  try {
    const savedList = localStorage.getItem(GITHUB_UPDATE_URLS_KEY);
    if (savedList) {
      const parsed = JSON.parse(savedList);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5);
      }
    }
    // Fallback to legacy single URL if present
    const legacyUrl = localStorage.getItem(GITHUB_UPDATE_URL_KEY);
    if (legacyUrl && legacyUrl.trim()) {
      return [legacyUrl.trim()];
    }
  } catch {}
  return [DEFAULT_GITHUB_UPDATE_URL];
}

/**
 * Saves list of GitHub update URLs (up to 5 links)
 */
export function setGitHubUpdateUrls(urls: string[]): void {
  try {
    const cleaned = urls
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (cleaned.length === 0) {
      localStorage.removeItem(GITHUB_UPDATE_URLS_KEY);
      localStorage.setItem(GITHUB_UPDATE_URL_KEY, DEFAULT_GITHUB_UPDATE_URL);
    } else {
      localStorage.setItem(GITHUB_UPDATE_URLS_KEY, JSON.stringify(cleaned));
      localStorage.setItem(GITHUB_UPDATE_URL_KEY, cleaned[0]);
    }
  } catch {}
}

export function getGitHubUpdateUrl(): string {
  const list = getGitHubUpdateUrls();
  return list[0] || DEFAULT_GITHUB_UPDATE_URL;
}

export function setGitHubUpdateUrl(url: string): void {
  const current = getGitHubUpdateUrls();
  if (current.length === 0) {
    setGitHubUpdateUrls([url]);
  } else {
    current[0] = url;
    setGitHubUpdateUrls(current);
  }
}

export function isGitHubAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(GITHUB_AUTO_SYNC_KEY);
    return val === null ? false : val === 'true';
  } catch {
    return false;
  }
}

export function setGitHubAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(GITHUB_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Clean & normalize Orion App item structure from JSON
 */
export function sanitizeOrionAppItem(item: any, idx = 0): OrionAppItem {
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
}

export interface FetchResult {
  success: boolean;
  apps: OrionAppItem[];
  message: string;
  sourceUrl: string;
  statusCode?: number;
  sourcesSynced?: number;
}

/**
 * Fetch latest update_apk.json from a single GitHub raw link or fallback smartly
 */
export async function fetchSingleUpdateApkFromGitHub(rawUrlInput: string): Promise<FetchResult> {
  const inputTrimmed = (rawUrlInput || '').trim();
  if (!inputTrimmed) {
    return {
      success: false,
      apps: [],
      message: 'GitHub update URL is empty.',
      sourceUrl: '',
    };
  }

  // Handle OrionStore / AlexJamesHQ demo repository gracefully
  const isAlexJamesDemo =
    inputTrimmed.toLowerCase().includes('alexjameshq/orionstore') ||
    inputTrimmed === DEFAULT_GITHUB_UPDATE_URL;

  // Build list of candidate raw URLs to try in order
  const candidateUrls: string[] = [];
  const primaryUrl = normalizeGitHubRawUrl(inputTrimmed);
  if (primaryUrl) candidateUrls.push(primaryUrl);

  // If repo format (user/repo or github.com/user/repo), generate fallback paths
  const repoMatch =
    inputTrimmed.match(/^https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)\/?$/) ||
    inputTrimmed.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)$/);

  if (repoMatch) {
    const [, u, r] = repoMatch;
    const fallbacks = [
      `https://raw.githubusercontent.com/${u}/${r}/main/update_apk.json`,
      `https://raw.githubusercontent.com/${u}/${r}/main/apps.json`,
      `https://raw.githubusercontent.com/${u}/${r}/master/update_apk.json`,
      `https://raw.githubusercontent.com/${u}/${r}/master/apps.json`,
      `https://raw.githubusercontent.com/${u}/${r}/main/data/update_apk.json`,
    ];
    fallbacks.forEach((fb) => {
      if (!candidateUrls.includes(fb)) candidateUrls.push(fb);
    });
  }

  // Try fetching each candidate URL
  for (const targetUrl of candidateUrls) {
    try {
      const fetchUrl = targetUrl.includes('?')
        ? `${targetUrl}&_t=${Date.now()}`
        : `${targetUrl}?_t=${Date.now()}`;

      const res = await fetch(fetchUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [data];
        if (list.length > 0) {
          const sanitized = list.map((item, idx) => sanitizeOrionAppItem(item, idx));
          return {
            success: true,
            apps: sanitized,
            message: `Loaded ${sanitized.length} apps from ${targetUrl}.`,
            sourceUrl: targetUrl,
          };
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If demo repository, provide built-in starter update_apk dataset immediately
  if (isAlexJamesDemo) {
    const sampleApps = ((defaultUpdateApkData as OrionAppItem[]) || []).map((item, idx) =>
      sanitizeOrionAppItem(item, idx)
    );
    if (sampleApps.length > 0) {
      return {
        success: true,
        apps: sampleApps,
        message: `Loaded ${sampleApps.length} built-in OrionStore apps! (Ready for your custom APK updates)`,
        sourceUrl: primaryUrl || inputTrimmed,
      };
    }
  }

  return {
    success: false,
    apps: [],
    statusCode: 404,
    message: `GitHub 404 Not Found: Could not find "update_apk.json" in repository "${inputTrimmed}". Please create this file in your GitHub repo or use a public repository.`,
    sourceUrl: primaryUrl || inputTrimmed,
  };
}

/**
 * Fetch update_apk.json from multiple GitHub sources (up to 5)
 */
export async function fetchUpdateApkFromGitHub(
  customUrls?: string | string[]
): Promise<FetchResult> {
  let urlsToFetch: string[] = [];

  if (Array.isArray(customUrls)) {
    urlsToFetch = customUrls.filter(Boolean);
  } else if (typeof customUrls === 'string' && customUrls.trim()) {
    urlsToFetch = [customUrls.trim()];
  } else {
    urlsToFetch = getGitHubUpdateUrls().filter(Boolean);
  }

  if (urlsToFetch.length === 0) {
    urlsToFetch = [DEFAULT_GITHUB_UPDATE_URL];
  }

  const results = await Promise.all(
    urlsToFetch.map((u) => fetchSingleUpdateApkFromGitHub(u))
  );

  const successfulResults = results.filter((r) => r.success && r.apps.length > 0);

  if (successfulResults.length === 0) {
    const firstError = results[0] || {
      success: false,
      apps: [],
      message: 'Failed to fetch from GitHub sources.',
      sourceUrl: '',
    };
    return firstError;
  }

  // Merge and deduplicate apps from all successful sources
  const appMap = new Map<string, OrionAppItem>();
  successfulResults.forEach((res) => {
    res.apps.forEach((app) => {
      if (!appMap.has(app.id)) {
        appMap.set(app.id, app);
      }
    });
  });

  const mergedApps = Array.from(appMap.values());
  saveAllCustomUpdatedApps(mergedApps);

  return {
    success: true,
    apps: mergedApps,
    sourcesSynced: successfulResults.length,
    message: `Successfully synced ${mergedApps.length} apps across ${successfulResults.length} GitHub source(s)!`,
    sourceUrl: urlsToFetch[0] || '',
  };
}

export function loadCustomUpdatedApps(): OrionAppItem[] {
  try {
    const saved = localStorage.getItem(CUSTOM_UPDATED_APPS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Default fallback to bundled update_apk.json
  if (Array.isArray(defaultUpdateApkData) && defaultUpdateApkData.length > 0) {
    try {
      localStorage.setItem(CUSTOM_UPDATED_APPS_KEY, JSON.stringify(defaultUpdateApkData));
    } catch {}
    return defaultUpdateApkData as OrionAppItem[];
  }
  return [];
}

export function saveAllCustomUpdatedApps(apps: OrionAppItem[]): OrionAppItem[] {
  try {
    const list = apps.map((a) => ({ ...a, isFeatured: true }));
    localStorage.setItem(CUSTOM_UPDATED_APPS_KEY, JSON.stringify(list));
    return list;
  } catch {
    return apps;
  }
}

export function saveCustomUpdatedApp(app: OrionAppItem): OrionAppItem[] {
  try {
    const list = loadCustomUpdatedApps();
    const existingIndex = list.findIndex((a) => a.id === app.id);
    let updatedList: OrionAppItem[];
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = { ...app, isFeatured: true };
    } else {
      updatedList = [{ ...app, isFeatured: true }, ...list];
    }
    localStorage.setItem(CUSTOM_UPDATED_APPS_KEY, JSON.stringify(updatedList));
    return updatedList;
  } catch {
    return [app];
  }
}

export function deleteCustomUpdatedApp(appId: string): OrionAppItem[] {
  try {
    const list = loadCustomUpdatedApps();
    const filtered = list.filter((a) => a.id !== appId);
    localStorage.setItem(CUSTOM_UPDATED_APPS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export function downloadUpdateApkJsonFile(customApps: OrionAppItem[]) {
  const jsonContent = JSON.stringify(customApps, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'update_apk.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function resetAllToDefault(): { urls: string[]; apps: OrionAppItem[] } {
  try {
    localStorage.removeItem(GITHUB_UPDATE_URLS_KEY);
    localStorage.setItem(GITHUB_UPDATE_URL_KEY, DEFAULT_GITHUB_UPDATE_URL);
    localStorage.setItem(GITHUB_AUTO_SYNC_KEY, 'false');
    const defaultApps = (defaultUpdateApkData as OrionAppItem[]) || [];
    localStorage.setItem(CUSTOM_UPDATED_APPS_KEY, JSON.stringify(defaultApps));
    return {
      urls: [DEFAULT_GITHUB_UPDATE_URL],
      apps: defaultApps,
    };
  } catch {
    return {
      urls: [DEFAULT_GITHUB_UPDATE_URL],
      apps: (defaultUpdateApkData as OrionAppItem[]) || [],
    };
  }
}
