// In-app real-time update checker and GitHub APK release manager
export interface ApkReleaseItem {
  repoName: string;
  tagName: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  updatedAt?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes?: number;
  githubReleaseUrl: string;
  isApk?: boolean;
}

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  lastSynced?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes?: number;
  githubReleaseUrl: string;
  allReleases: ApkReleaseItem[];
}

// Current App Version of this build
export const APP_CURRENT_VERSION = 'v1.4.2';

// Local storage keys to track dismissed notifications and count dismissals
export const DISMISSED_VERSION_KEY = 'alexjameshqq_dismissed_update_version';
export const DISMISS_COUNT_KEY = 'alexjameshqq_dismiss_count';

export function getDismissCount(): number {
  try {
    const val = localStorage.getItem(DISMISS_COUNT_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function isUpdatePermanentlyIgnored(version: string): boolean {
  try {
    const count = getDismissCount();
    const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
    if (count >= 3 && dismissedVersion === version) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function recordUpdateDismissal(version: string): void {
  try {
    const currentCount = getDismissCount();
    const newCount = currentCount + 1;
    localStorage.setItem(DISMISS_COUNT_KEY, newCount.toString());
    localStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // ignore
  }
}

// Helper to format ISO date-time into human readable date, time, and relative duration
export function formatUpdateDateTime(isoString?: string): { formattedDate: string; formattedTime: string; relative: string } {
  if (!isoString) {
    return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
    }

    const formattedDate = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const formattedTime = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = 'Just now';
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      relative = `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else if (diffDays > 0) {
      relative = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffMin > 0) {
      relative = `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
    }

    return { formattedDate, formattedTime, relative };
  } catch {
    return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
  }
}

// Clean HTML tags and markdown badge strings from release notes for clean viewing
export function cleanReleaseNotes(rawNotes?: string): string {
  if (!rawNotes) {
    return '• Live APK package installer\n• Auto-sync with AlexJamesHQ GitHub repositories\n• Direct release asset download\n• Neobrutalist design with offline PWA readiness';
  }

  let cleaned = rawNotes
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<\/?(div|br|p|center|span|a)\b[^>]*>/gi, '\n')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  if (!cleaned || cleaned.length < 5) {
    return '• Live APK package installer\n• Auto-sync with AlexJamesHQ GitHub repositories\n• Direct release asset download\n• Neobrutalist design with offline PWA readiness';
  }

  return cleaned;
}

export async function checkForAppUpdates(user: string = 'AlexJamesHQ', knownRepos?: any[]): Promise<AppUpdateInfo> {
  const isAlex = user.toLowerCase() === 'alexjameshq';
  const defaultInfo: AppUpdateInfo = {
    currentVersion: APP_CURRENT_VERSION,
    latestVersion: APP_CURRENT_VERSION,
    hasUpdate: false,
    releaseName: 'Up to Date',
    releaseNotes: 'You are running the latest version.',
    publishedAt: new Date().toISOString(),
    lastSynced: new Date().toISOString(),
    apkDownloadUrl: '',
    apkFileName: '',
    githubReleaseUrl: `https://github.com/${encodeURIComponent(user)}`,
    allReleases: [],
  };

  // Tier 1: Fetch live real-time updates from server API
  try {
    const fetchOptions: RequestInit = knownRepos && Array.isArray(knownRepos) && knownRepos.length > 0
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user, repos: knownRepos }),
        }
      : {
          method: 'GET',
        };

    const res = await fetch(`/api/github-updates?user=${encodeURIComponent(user)}&fresh=true`, fetchOptions);
    if (res.ok) {
      const data = await res.json();
      if (data.allReleases && Array.isArray(data.allReleases) && data.allReleases.length > 0) {
        const latest = data.allReleases[0];
        const hasUpdate = latest.tagName.replace(/^v/, '') !== APP_CURRENT_VERSION.replace(/^v/, '');
        return {
          currentVersion: APP_CURRENT_VERSION,
          latestVersion: latest.tagName,
          hasUpdate,
          releaseName: latest.releaseName,
          releaseNotes: latest.releaseNotes,
          publishedAt: latest.publishedAt,
          lastSynced: data.lastSynced || new Date().toISOString(),
          apkDownloadUrl: latest.apkDownloadUrl,
          apkFileName: latest.apkFileName,
          apkSizeBytes: latest.apkSizeBytes,
          githubReleaseUrl: latest.githubReleaseUrl,
          allReleases: data.allReleases,
        };
      }
    }
  } catch (err) {
    console.warn('Server updates proxy failed, trying direct GitHub fetch...', err);
  }

  // Tier 2: Direct Client GitHub API / knownRepos fallback
  try {
    const releaseMap = new Map<string, ApkReleaseItem>();

    if (isAlex) {
      // Check verified APK repositories belonging to AlexJamesHQ
      const repos = [
        'SwiftSlate',
        'LastWave-Native',
        'Koda',
        'OrionStore',
        'Gemini-Ai',
        'ArchiveTune',
        'Orion-Store',
      ];

      for (const repo of repos) {
        try {
          const res = await fetch(`https://api.github.com/repos/AlexJamesHQ/${repo}/releases`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AI-Studio-Applet',
            },
          });
          if (res.ok) {
            const releases = await res.json();
            if (Array.isArray(releases)) {
              for (const data of releases) {
                const apkAsset = data.assets?.find((a: any) =>
                  a.name?.toLowerCase().endsWith('.apk')
                );
                if (apkAsset && !releaseMap.has(repo)) {
                  releaseMap.set(repo, {
                    repoName: repo,
                    tagName: data.tag_name || data.name || 'v1.0.0',
                    releaseName: data.name || `${repo} Release`,
                    releaseNotes: cleanReleaseNotes(data.body),
                    publishedAt: data.published_at || new Date().toISOString(),
                    updatedAt: data.published_at,
                    apkDownloadUrl: apkAsset.browser_download_url,
                    apkFileName: apkAsset.name,
                    apkSizeBytes: apkAsset.size || 15000000,
                    githubReleaseUrl: data.html_url || `https://github.com/AlexJamesHQ/${repo}/releases`,
                    isApk: true,
                  });
                  break;
                }
              }
            }
          }
        } catch {
          // Skip repo if rate limited
        }
      }
    } else if (knownRepos && Array.isArray(knownRepos) && knownRepos.length > 0) {
      // Loop through knownRepos and check if they have real APK releases
      for (const r of knownRepos) {
        const repoFullName = r.full_name || `${r.owner?.login || user}/${r.name}`;
        try {
          const res = await fetch(`https://api.github.com/repos/${repoFullName}/releases`, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'AI-Studio-Applet',
            },
          });
          if (res.ok) {
            const releases = await res.json();
            if (Array.isArray(releases)) {
              for (const data of releases) {
                const apkAsset = data.assets?.find((a: any) =>
                  a.name?.toLowerCase().endsWith('.apk')
                );
                if (apkAsset && !releaseMap.has(r.name)) {
                  releaseMap.set(r.name, {
                    repoName: r.name,
                    tagName: data.tag_name || data.name || 'v1.0.0',
                    releaseName: data.name || `${r.name} Release`,
                    releaseNotes: cleanReleaseNotes(data.body) || '• Production Android application package release.',
                    publishedAt: data.published_at || r.updated_at || new Date().toISOString(),
                    updatedAt: data.published_at || r.updated_at,
                    apkDownloadUrl: apkAsset.browser_download_url,
                    apkFileName: apkAsset.name,
                    apkSizeBytes: apkAsset.size || 15000000,
                    githubReleaseUrl: data.html_url || `https://github.com/${repoFullName}/releases`,
                    isApk: true,
                  });
                  break;
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }
    } else {
      // Fetch latest public and starred repositories for searched user and check releases for APK
      try {
        const [reposRes, starRes] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=updated&per_page=100`, {
            headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'AI-Studio-Applet' },
          }),
          fetch(`https://api.github.com/users/${encodeURIComponent(user)}/starred?per_page=100`, {
            headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'AI-Studio-Applet' },
          })
        ]);

        const reposData = reposRes.ok ? await reposRes.json() : [];
        const starData = starRes.ok ? await starRes.json() : [];
        const combined = [...(Array.isArray(reposData) ? reposData : []), ...(Array.isArray(starData) ? starData : [])];

        for (const r of combined) {
          const repoFullName = r.full_name || `${r.owner?.login || user}/${r.name}`;
          try {
            const res = await fetch(`https://api.github.com/repos/${repoFullName}/releases`, {
              headers: {
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'AI-Studio-Applet',
              },
            });
            if (res.ok) {
              const releases = await res.json();
              if (Array.isArray(releases)) {
                for (const data of releases) {
                  const apkAsset = data.assets?.find((a: any) =>
                    a.name?.toLowerCase().endsWith('.apk')
                  );
                  if (apkAsset && !releaseMap.has(r.name)) {
                    releaseMap.set(r.name, {
                      repoName: r.name,
                      tagName: data.tag_name || data.name || 'v1.0.0',
                      releaseName: data.name || `${r.name} Release`,
                      releaseNotes: cleanReleaseNotes(data.body) || '• Production Android application package release.',
                      publishedAt: data.published_at || r.updated_at || new Date().toISOString(),
                      updatedAt: data.published_at || r.updated_at,
                      apkDownloadUrl: apkAsset.browser_download_url,
                      apkFileName: apkAsset.name,
                      apkSizeBytes: apkAsset.size || 15000000,
                      githubReleaseUrl: data.html_url || `https://github.com/${repoFullName}/releases`,
                      isApk: true,
                    });
                    break;
                  }
                }
              }
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }

    const fetchedReleases = Array.from(releaseMap.values());
    fetchedReleases.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Strictly limit to top 4 items
    const top4Fetched = fetchedReleases.slice(0, 4);

    if (top4Fetched.length > 0) {
      const latest = top4Fetched[0];
      const hasUpdate = latest.tagName.replace(/^v/, '') !== APP_CURRENT_VERSION.replace(/^v/, '');

      return {
        currentVersion: APP_CURRENT_VERSION,
        latestVersion: latest.tagName,
        hasUpdate,
        releaseName: latest.releaseName,
        releaseNotes: latest.releaseNotes,
        publishedAt: latest.publishedAt,
        lastSynced: new Date().toISOString(),
        apkDownloadUrl: latest.apkDownloadUrl,
        apkFileName: latest.apkFileName,
        apkSizeBytes: latest.apkSizeBytes,
        githubReleaseUrl: latest.githubReleaseUrl,
        allReleases: top4Fetched,
      };
    }
  } catch {
    // Fall back to default
  }

  return defaultInfo;
}

