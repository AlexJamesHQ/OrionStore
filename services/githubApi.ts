import { Repository, GitHubUserProfile, hasActualApk } from '../types';

export function enrichWithApkAndCategory(r: Repository): Repository {
  const verifiedRelease =
    (r.latestRelease && (r.latestRelease.apkName || r.latestRelease.downloadUrl))
      ? r.latestRelease
      : KNOWN_APK_MAP.get((r.name || '').toLowerCase()) ||
        KNOWN_APK_MAP.get((r.full_name || '').toLowerCase()) ||
        (hasActualApk(r)
          ? {
              tagName: 'Latest APK',
              name: `${r.name} Android Package`,
              apkName: `${r.name}.apk`,
              downloadUrl: `${r.html_url}/releases`,
              sizeBytes: undefined,
            }
          : null);

  const isApk = Boolean(verifiedRelease) || hasActualApk(r);
  return {
    ...r,
    latestRelease: verifiedRelease,
    category: isApk ? 'Android & APK' : r.category || determineCategory(r),
  };
}

export interface UserFullData {
  profile: GitHubUserProfile;
  starredRepos: Repository[];
  publicRepos: Repository[];
  starredCount: number;
  publicCount: number;
}

export function extractGitHubUsername(input: string): string {
  if (!input) return '';
  let clean = input.trim();
  // Strip protocol
  clean = clean.replace(/^https?:\/\//i, '');
  // Strip trailing slashes
  clean = clean.replace(/\/+$/, '');
  // Extract github.com/username
  const match = clean.match(/github\.com\/([a-zA-Z0-9_\-]+)/i);
  if (match) {
    return match[1];
  }
  // Strip leading @
  clean = clean.replace(/^@/, '');
  // If user entered username/repo
  if (clean.includes('/')) {
    clean = clean.split('/')[0];
  }
  return clean.trim();
}

export function determineCategory(r: {
  name: string;
  description?: string | null;
  topics?: string[];
  latestRelease?: any;
}): string {
  const text = `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`.toLowerCase();

  if (
    text.includes('music') ||
    text.includes('audio') ||
    text.includes('player') ||
    text.includes('song') ||
    text.includes('sound') ||
    text.includes('stream') ||
    text.includes('tune') ||
    text.includes('media') ||
    text.includes('video') ||
    text.includes('lyrics') ||
    text.includes('photo') ||
    text.includes('gallery')
  ) {
    return 'Media & Music';
  }

  if (
    !!r.latestRelease ||
    text.includes('apk') ||
    text.includes('android') ||
    text.includes('rom') ||
    text.includes('flashtool') ||
    text.includes('accessibility') ||
    text.includes('compose') ||
    text.includes('zephyr') ||
    text.includes('nuvio') ||
    text.includes('device')
  ) {
    return 'Android & APK';
  }

  if (
    text.includes('ai') ||
    text.includes('vision') ||
    text.includes('gemini') ||
    text.includes('gpt') ||
    text.includes('llm') ||
    text.includes('prompt') ||
    text.includes('tensorflow') ||
    text.includes('mediapipe') ||
    text.includes('chat') ||
    text.includes('bot')
  ) {
    return 'AI & Vision';
  }

  if (
    text.includes('3d') ||
    text.includes('voxel') ||
    text.includes('canvas') ||
    text.includes('portfolio') ||
    text.includes('web') ||
    text.includes('design') ||
    text.includes('threejs') ||
    text.includes('ui') ||
    text.includes('frontend') ||
    text.includes('animation')
  ) {
    return 'Web & 3D';
  }

  return 'Tools & Utilities';
}

export async function fetchGitHubUserData(input: string, fresh: boolean = true): Promise<UserFullData> {
  const cleanUser = extractGitHubUsername(input) || 'AlexJamesHQ';
  const cacheKey = `github_data_v4_${cleanUser.toLowerCase()}`;

  // Clean up legacy stale cache with inaccurate mock stars if present
  try {
    localStorage.removeItem('github_data_AlexJamesHQ');
    localStorage.removeItem('github_data_alexjameshq');
    localStorage.removeItem('github_data_v2_alexjameshq');
    localStorage.removeItem('github_data_v3_alexjameshq');
  } catch (e) {}

  if (!fresh) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
  }

  // Tier 1: Try Server Proxy API
  try {
    const srvRes = await fetch(`/api/github-user?user=${encodeURIComponent(cleanUser)}&fresh=${fresh}`);
    const isJson = srvRes.ok && (srvRes.headers.get('content-type') || '').includes('application/json');
    if (isJson) {
      const data: UserFullData = await srvRes.json();
      // Do not accept a profile-only response as success: an API failure can still return profile data.
      // Fall through to the direct GitHub API when repository arrays are empty for a non-default user.
      const hasRepositoryData = (data.publicRepos?.length || 0) > 0 || (data.starredRepos?.length || 0) > 0;
      if (data && (hasRepositoryData || data.profile?.login)) {
        data.publicRepos = (data.publicRepos || []).map(enrichWithApkAndCategory);
        data.starredRepos = (data.starredRepos || []).map(enrichWithApkAndCategory);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Server proxy unavailable, attempting client fallback...', err);
  }

  // Tier 2: Direct Client GitHub API fallback
  try {
    const clientHeaders: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    const profileRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(cleanUser)}`,
      { headers: clientHeaders }
    );

    let profile: GitHubUserProfile;
    if (profileRes.ok) {
      const p = await profileRes.json();
      profile = {
        login: p.login,
        name: p.name || p.login,
        avatar_url: p.avatar_url || `https://github.com/${p.login}.png`,
        html_url: p.html_url || `https://github.com/${p.login}`,
        bio: p.bio || '',
        company: p.company || null,
        location: p.location || null,
        blog: p.blog || null,
        public_repos: p.public_repos || 0,
        followers: p.followers || 0,
        following: p.following || 0,
      };
    } else {
      profile = {
        login: cleanUser,
        name: cleanUser,
        avatar_url: `https://github.com/${cleanUser}.png`,
        html_url: `https://github.com/${cleanUser}`,
        bio: `GitHub Profile for ${cleanUser}`,
        company: null,
        location: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
      };
    }

    const fetchAllPages = async (kind: 'repos' | 'starred'): Promise<any[]> => {
      const all: any[] = [];
      for (let page = 1; page <= 10; page += 1) {
        const url = kind === 'repos'
          ? `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
          : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&page=${page}`;
        const response = await fetch(url, { headers: clientHeaders });
        if (!response.ok) break;
        const pageData = await response.json();
        if (!Array.isArray(pageData) || pageData.length === 0) break;
        all.push(...pageData);
        if (pageData.length < 100) break;
      }
      return all;
    };

    let publicRepos: Repository[] = [];
    let starredRepos: Repository[] = [];
    try {
      const [pubData, starData] = await Promise.all([
        fetchAllPages('repos'),
        fetchAllPages('starred'),
      ]);
      publicRepos = pubData.map(mapApiRepo);
      starredRepos = starData.map(mapApiRepo);
    } catch (e) {}

    const finalPublic = publicRepos;
    const finalStarred = starredRepos;

    const enrichedPublic = finalPublic.map(enrichWithApkAndCategory);
    const enrichedStarred = finalStarred.map(enrichWithApkAndCategory);

    const finalProfile = {
      ...profile,
      public_repos: typeof profile.public_repos === 'number' ? profile.public_repos : enrichedPublic.length,
      starred_count: enrichedStarred.length,
    };

    const result = {
      profile: finalProfile,
      publicRepos: enrichedPublic,
      starredRepos: enrichedStarred,
      publicCount: enrichedPublic.length,
      starredCount: enrichedStarred.length,
    };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (e) {
    // Return cached if available even on error
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    return {
      profile: {
        login: cleanUser,
        name: cleanUser,
        avatar_url: `https://github.com/${cleanUser}.png`,
        html_url: `https://github.com/${cleanUser}`,
        bio: 'GitHub User',
        company: null,
        location: null,
        blog: null,
        public_repos: 0,
        followers: 0,
        following: 0,
      },
      publicRepos: [],
      starredRepos: [],
      publicCount: 0,
      starredCount: 0,
    };
  }
}

function mapApiRepo(item: any): Repository {
  const r: Repository = {
    id: item.id,
    name: item.name,
    full_name: item.full_name,
    owner: {
      login: item.owner?.login || 'unknown',
      avatar_url: item.owner?.avatar_url || '',
      html_url: item.owner?.html_url || `https://github.com/${item.owner?.login}`,
    },
    html_url: item.html_url,
    description: item.description || 'No description provided.',
    stargazers_count: item.stargazers_count || 0,
    language: item.language || null,
    topics: item.topics || [],
    category: '',
    updated_at: item.updated_at,
    homepage: item.homepage || null,
    default_branch: item.default_branch,
    latestRelease: null,
  };
  r.category = determineCategory(r);
  return r;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }
  return `${(bytes / 1000).toFixed(0)} KB`;
}
