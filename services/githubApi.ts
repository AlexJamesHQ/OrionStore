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
  const cacheKey = `github_data_v5_${cleanUser.toLowerCase()}`;

  // Fresh loads must never use an old/empty cache. Cache is only a fallback
  // for an explicit non-fresh request after a previously successful sync.
  if (!fresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as UserFullData;
        if (parsed?.profile?.login && Array.isArray(parsed.publicRepos) && Array.isArray(parsed.starredRepos)) {
          return parsed;
        }
      }
    } catch (_) {}
  } else {
    try {
      localStorage.removeItem(cacheKey);
    } catch (_) {}
  }

  const enrichResult = (data: UserFullData): UserFullData => ({
    ...data,
    publicRepos: (Array.isArray(data.publicRepos) ? data.publicRepos : []).map(enrichWithApkAndCategory),
    starredRepos: (Array.isArray(data.starredRepos) ? data.starredRepos : []).map(enrichWithApkAndCategory),
    publicCount: Array.isArray(data.publicRepos) ? data.publicRepos.length : 0,
    starredCount: Array.isArray(data.starredRepos) ? data.starredRepos.length : 0,
  });

  const saveValid = (data: UserFullData) => {
    const result = enrichResult(data);
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (_) {}
    return result;
  };

  const isValidPayload = (data: any): data is UserFullData => {
    return Boolean(
      data &&
      data.profile?.login &&
      Array.isArray(data.publicRepos) &&
      Array.isArray(data.starredRepos)
    );
  };

  // Tier 1: Vercel server function. This is the authoritative path because it
  // avoids browser CORS/rate-limit differences and can use GITHUB_TOKEN.
  try {
    const query = new URLSearchParams({ user: cleanUser, fresh: fresh ? '1' : '0', t: String(Date.now()) });
    const srvRes = await fetch(`/api/github-user?${query.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    const contentType = srvRes.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await srvRes.json()
      : null;

    if (srvRes.ok && isValidPayload(body)) {
      // If GitHub reports public repos but the endpoint gives none, treat this
      // as a failed/suspicious response and continue to the direct fallback.
      const expected = Number(body.profile.public_repos || 0);
      if (body.publicRepos.length > 0 || expected === 0) {
        return saveValid(body);
      }
    }

    if (!srvRes.ok && body?.error) {
      console.warn('Server GitHub API error:', body.error, body.detail || '');
    }
  } catch (err) {
    console.warn('Server proxy unavailable; trying direct GitHub API:', err);
  }

  // Tier 2: direct GitHub REST API fallback. This path is intentionally
  // independent from the server response so a bad server payload cannot
  // silently turn a real repository list into [] in the UI.
  const clientHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const profileRes = await fetch(
    `https://api.github.com/users/${encodeURIComponent(cleanUser)}`,
    { headers: clientHeaders, cache: 'no-store' }
  );

  if (!profileRes.ok) {
    throw new Error(`GitHub profile request failed (${profileRes.status})`);
  }

  const p = await profileRes.json();
  const profile: GitHubUserProfile = {
    login: p.login,
    name: p.name || p.login,
    avatar_url: p.avatar_url || `https://github.com/${p.login}.png`,
    html_url: p.html_url || `https://github.com/${p.login}`,
    bio: p.bio || '',
    company: p.company || null,
    location: p.location || null,
    blog: p.blog || null,
    public_repos: Number(p.public_repos || 0),
    followers: Number(p.followers || 0),
    following: Number(p.following || 0),
  };

  const fetchAllPages = async (kind: 'repos' | 'starred'): Promise<any[]> => {
    const all: any[] = [];
    for (let page = 1; page <= 10; page += 1) {
      const url = kind === 'repos'
        ? `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
        : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&page=${page}`;
      const response = await fetch(url, { headers: clientHeaders, cache: 'no-store' });
      if (!response.ok) throw new Error(`GitHub ${kind} request failed (${response.status})`);
      const pageData = await response.json();
      if (!Array.isArray(pageData)) throw new Error(`GitHub ${kind} returned invalid data`);
      all.push(...pageData);
      if (pageData.length < 100) break;
    }
    return all;
  };

  // Public repositories are required; starred repositories are optional.
  // A starred-endpoint failure must never erase a successful public-repo fetch.
  const publicPromise = fetchAllPages('repos');
  const starredPromise = fetchAllPages('starred');
  const publicResult = await publicPromise;
  let starData: any[] = [];
  try {
    starData = await starredPromise;
  } catch (error) {
    console.warn('Direct GitHub starred fallback failed; keeping public repositories:', error);
  }

  const result: UserFullData = {
    profile: {
      ...profile,
      starred_count: starData.length,
    } as GitHubUserProfile,
    publicRepos: publicResult.map(mapApiRepo),
    starredRepos: starData.map(mapApiRepo),
    publicCount: publicResult.length,
    starredCount: starData.length,
  };

  // Never silently return zero repos when GitHub says the account has public repos.
  if (result.profile.public_repos > 0 && result.publicRepos.length === 0) {
    throw new Error(`GitHub returned 0 repositories but profile.public_repos is ${result.profile.public_repos}`);
  }

  return saveValid(result);
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
