import { hasActualApk } from '../types';

function enrichRepo(r: any) {
  const isApk = hasActualApk(r);
  return { ...r, latestRelease: r.latestRelease || null, category: isApk ? 'Android & APK' : r.category || 'Tools & Utilities' };
}

function cleanUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cleanUser = cleanUsername(String(req.query?.user || 'AlexJamesHQ'));
  if (!cleanUser) return res.status(400).json({ error: 'GitHub username is required' });

  const baseHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'OrionStore',
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  const authHeaders = token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;

  async function gh(url: string) {
    let response = await fetch(url, { headers: authHeaders });
    // If the configured token is invalid/expired, retry public endpoints without it.
    if (response.status === 401 && token) {
      response = await fetch(url, { headers: baseHeaders });
    }
    return response;
  }

  try {
    const profileRes = await gh(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`);
    if (!profileRes.ok) {
      const status = profileRes.status;
      return res.status(status === 404 ? 404 : status === 403 ? 429 : 502).json({
        error: status === 404 ? 'GitHub user not found' : status === 403 ? 'GitHub API rate limit reached' : 'GitHub profile request failed',
      });
    }

    const p = await profileRes.json();

    async function fetchAll(kind: 'repos' | 'starred') {
      const all: any[] = [];
      for (let page = 1; page <= 10; page += 1) {
        const url = kind === 'repos'
          ? `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
          : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&page=${page}`;
        const response = await gh(url);
        if (!response.ok) {
          const body = await response.text().catch(() => '');
          throw new Error(`GitHub ${kind} request failed: ${response.status} ${body.slice(0, 200)}`);
        }
        const pageData = await response.json();
        if (!Array.isArray(pageData)) throw new Error(`GitHub ${kind} returned invalid data`);
        all.push(...pageData);
        if (pageData.length < 100) break;
      }
      return all;
    }

    const [reposData, starredData] = await Promise.all([
      fetchAll('repos'),
      fetchAll('starred'),
    ]);

    const publicRepos = reposData.map(enrichRepo);
    const starredRepos = starredData.map(enrichRepo);

    return res.status(200).json({
      profile: {
        login: p.login,
        name: p.name || p.login,
        avatar_url: p.avatar_url,
        html_url: p.html_url,
        bio: p.bio,
        company: p.company,
        location: p.location,
        blog: p.blog,
        public_repos: Number(p.public_repos || publicRepos.length),
        followers: Number(p.followers || 0),
        following: Number(p.following || 0),
      },
      publicRepos,
      starredRepos,
      publicCount: publicRepos.length,
      starredCount: starredRepos.length,
    });
  } catch (error) {
    console.error('github-user error:', error);
    return res.status(502).json({
      error: 'Unable to load GitHub repositories right now.',
      detail: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    });
  }
}
