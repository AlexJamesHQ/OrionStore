function isLikelyApk(repo: any): boolean {
  const name = String(repo?.name || '').toLowerCase();
  const desc = String(repo?.description || '').toLowerCase();
  const topics = Array.isArray(repo?.topics) ? repo.topics.map((x: any) => String(x).toLowerCase()) : [];
  return name.includes('apk') || desc.includes('apk') || desc.includes('android app') || topics.some((x: string) => x === 'apk' || x === 'android' || x.includes('android-app'));
}

function enrichRepo(r: any) {
  const isApk = isLikelyApk(r);
  return {
    ...r,
    latestRelease: r.latestRelease || null,
    category: isApk ? 'Android & APK' : r.category || 'Tools & Utilities',
  };
}

function cleanUsername(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^github\.com\//i, '')
    .replace(/^@/, '')
    .split('/')[0]
    .trim();
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cleanUser = cleanUsername(url.searchParams.get('user') || 'AlexJamesHQ');
  if (!cleanUser) return json({ error: 'GitHub username is required' }, 400);

  const baseHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'OrionStore/1.0',
  };
  const token = String(process.env.GITHUB_TOKEN || '').trim();
  const authHeaders = token
    ? { ...baseHeaders, Authorization: `Bearer ${token}` }
    : baseHeaders;

  async function gh(endpoint: string): Promise<Response> {
    let response = await fetch(endpoint, { headers: authHeaders });
    if (response.status === 401 && token) {
      response = await fetch(endpoint, { headers: baseHeaders });
    }
    return response;
  }

  try {
    const profileRes = await gh(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`);
    if (profileRes.status === 404) return json({ error: 'GitHub user not found' }, 404);
    if (profileRes.status === 403) return json({ error: 'GitHub API rate limit reached' }, 429);
    if (!profileRes.ok) return json({ error: `GitHub profile request failed (${profileRes.status})` }, 502);

    const p = await profileRes.json();

    async function fetchAll(kind: 'repos' | 'starred'): Promise<any[]> {
      const all: any[] = [];
      for (let page = 1; page <= 10; page += 1) {
        const endpoint = kind === 'repos'
          ? `https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&page=${page}&sort=updated&type=owner`
          : `https://api.github.com/users/${encodeURIComponent(cleanUser)}/starred?per_page=100&page=${page}`;
        const response = await gh(endpoint);
        if (response.status === 403) throw new Error(`GitHub ${kind} rate limit reached`);
        if (!response.ok) throw new Error(`GitHub ${kind} request failed (${response.status})`);
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

    return json({
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
    const message = error instanceof Error ? error.message : 'Unknown GitHub API error';
    return json({ error: 'Unable to load GitHub repositories right now.', detail: message }, 502);
  }
}
