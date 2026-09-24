function cleanUsername(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/^github\.com\//i, '').replace(/^@/, '').split('/')[0].trim();
}

function isLikelyApk(repo: any): boolean {
  const text = `${repo?.name || ''} ${repo?.description || ''}`.toLowerCase();
  const topics = Array.isArray(repo?.topics) ? repo.topics.map((x: any) => String(x).toLowerCase()) : [];
  return text.includes('apk') || text.includes('android app') || topics.includes('apk') || topics.includes('android') || topics.some((x: string) => x.includes('android-app'));
}

function enrichRepo(repo: any) {
  return { ...repo, latestRelease: repo.latestRelease || null, category: isLikelyApk(repo) ? 'Android & APK' : (repo.category || 'Tools & Utilities') };
}

function send(res: any, status: number, data: any) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').setHeader('Cache-Control', 'no-store').setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type').json(data);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const username = cleanUsername(String(req.query?.user || 'AlexJamesHQ'));
  if (!username) return send(res, 400, { error: 'GitHub username is required' });

  const baseHeaders: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'OrionStore' };
  const token = String(process.env.GITHUB_TOKEN || '').trim();

  async function github(url: string): Promise<Response> {
    const headers = token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
    let response = await fetch(url, { headers });
    if (response.status === 401 && token) response = await fetch(url, { headers: baseHeaders });
    return response;
  }

  try {
    const profileRes = await github(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (profileRes.status === 404) return send(res, 404, { error: 'GitHub user not found' });
    if (profileRes.status === 403) return send(res, 429, { error: 'GitHub API rate limit reached' });
    if (!profileRes.ok) return send(res, 502, { error: `GitHub profile request failed (${profileRes.status})` });
    const profile = await profileRes.json();

    async function getAll(kind: 'repos' | 'starred') {
      const all: any[] = [];
      for (let page = 1; page <= 10; page++) {
        const url = kind === 'repos'
          ? `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
          : `https://api.github.com/users/${encodeURIComponent(username)}/starred?per_page=100&page=${page}`;
        const r = await github(url);
        if (r.status === 403) throw new Error(`GitHub ${kind} rate limit reached`);
        if (!r.ok) throw new Error(`GitHub ${kind} request failed (${r.status})`);
        const items = await r.json();
        if (!Array.isArray(items)) throw new Error(`GitHub ${kind} returned invalid data`);
        all.push(...items);
        if (items.length < 100) break;
      }
      return all;
    }

    const [repos, starred] = await Promise.all([getAll('repos'), getAll('starred')]);
    const publicRepos = repos.map(enrichRepo);
    const starredRepos = starred.map(enrichRepo);

    return send(res, 200, {
      profile: { login: profile.login, name: profile.name || profile.login, avatar_url: profile.avatar_url, html_url: profile.html_url, bio: profile.bio, company: profile.company, location: profile.location, blog: profile.blog, public_repos: Number(profile.public_repos || publicRepos.length), followers: Number(profile.followers || 0), following: Number(profile.following || 0) },
      publicRepos, starredRepos, publicCount: publicRepos.length, starredCount: starredRepos.length,
    });
  } catch (error) {
    console.error('github-user error', error);
    return send(res, 502, { error: 'Unable to load GitHub repositories right now.', detail: error instanceof Error ? error.message : String(error) });
  }
}
