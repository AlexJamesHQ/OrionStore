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
  return res.status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .json(data);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const username = cleanUsername(String(req.query?.user || 'AlexJamesHQ'));
  if (!username) return send(res, 400, { error: 'GitHub username is required' });

  const baseHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'OrionStore/1.0',
  };
  const token = String(process.env.GITHUB_TOKEN || '').trim();

  async function github(url: string): Promise<Response> {
    const headers = token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders;
    let response = await fetch(url, { headers, cache: 'no-store' });
    if ((response.status === 401 || response.status === 403) && token) {
      // A bad/over-permissioned token must never prevent public data from loading.
      response = await fetch(url, { headers: baseHeaders, cache: 'no-store' });
    }
    return response;
  }

  try {
    const profileRes = await github(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (profileRes.status === 404) return send(res, 404, { error: 'GitHub user not found' });
    if (!profileRes.ok) {
      const text = await profileRes.text().catch(() => '');
      return send(res, profileRes.status === 403 ? 429 : 502, { error: `GitHub profile request failed (${profileRes.status})`, detail: text.slice(0, 300) });
    }
    const profile = await profileRes.json();

    // Public repositories are the primary dataset. Do not let a starred-repos
    // failure wipe out the public repository list.
    const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=1&sort=updated&type=owner`;
    const reposRes = await github(reposUrl);
    if (!reposRes.ok) {
      const text = await reposRes.text().catch(() => '');
      return send(res, reposRes.status === 403 ? 429 : 502, { error: `GitHub repositories request failed (${reposRes.status})`, detail: text.slice(0, 300), githubPublicRepoCount: Number(profile.public_repos || 0) });
    }
    const repos = await reposRes.json();
    if (!Array.isArray(repos)) return send(res, 502, { error: 'GitHub repositories returned invalid data' });

    // Starred repos are secondary and may be unavailable independently.
    let starred: any[] = [];
    try {
      const starredRes = await github(`https://api.github.com/users/${encodeURIComponent(username)}/starred?per_page=100&page=1`);
      if (starredRes.ok) {
        const value = await starredRes.json();
        if (Array.isArray(value)) starred = value;
      }
    } catch (_) {}

    const publicRepos = repos.map(enrichRepo);
    const starredRepos = starred.map(enrichRepo);

    return send(res, 200, {
      profile: {
        login: profile.login,
        name: profile.name || profile.login,
        avatar_url: profile.avatar_url,
        html_url: profile.html_url,
        bio: profile.bio,
        company: profile.company,
        location: profile.location,
        blog: profile.blog,
        public_repos: Number(profile.public_repos || publicRepos.length),
        followers: Number(profile.followers || 0),
        following: Number(profile.following || 0),
      },
      publicRepos,
      starredRepos,
      publicCount: publicRepos.length,
      starredCount: starredRepos.length,
      source: 'github-rest-api',
      githubPublicRepoCount: Number(profile.public_repos || 0),
    });
  } catch (error) {
    console.error('github-user error', error);
    return send(res, 502, { error: 'Unable to load GitHub repositories right now.', detail: error instanceof Error ? error.message : String(error) });
  }
}
