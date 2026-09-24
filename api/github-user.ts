import { hasActualApk } from '../types';

function enrichRepo(r: any) {
  const isApk = hasActualApk(r);
  return { ...r, latestRelease: r.latestRelease || null, category: isApk ? 'Android & APK' : r.category || 'Tools & Utilities' };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userQuery = (req.query.user as string) || 'AlexJamesHQ';
  const cleanUser = userQuery
    .replace(/^https?:\/\//i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .trim();

  if (!cleanUser) return res.status(400).json({ error: 'GitHub username is required' });

  // For any other GitHub user, always fetch the real public repositories and starred repositories.
  // Pagination is used so accounts with more than 100 repositories are not silently truncated.
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'OrionStore',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    };

    const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, { headers });
    if (!ghRes.ok) {
      return res.status(ghRes.status === 404 ? 404 : 502).json({
        error: ghRes.status === 404 ? 'GitHub user not found' : 'GitHub API request failed',
      });
    }

    const p = await ghRes.json();

    const fetchAll = async (kind: 'repos' | 'starred') => {
      const all: any[] = [];
      for (let page = 1; page <= 10; page += 1) {
        const url = kind === 'repos'
          ? `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
          : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&page=${page}`;
        const response = await fetch(url, { headers });
        if (!response.ok) break;
        const pageData = await response.json();
        if (!Array.isArray(pageData) || pageData.length === 0) break;
        all.push(...pageData);
        if (pageData.length < 100) break;
      }
      return all;
    };

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
        public_repos: p.public_repos || publicRepos.length,
        followers: p.followers || 0,
        following: p.following || 0,
      },
      publicRepos,
      starredRepos,
      publicCount: publicRepos.length,
      starredCount: starredRepos.length,
    });
  } catch (e) {
    return res.status(502).json({ error: 'Unable to load GitHub repositories right now.' });
  }

}
