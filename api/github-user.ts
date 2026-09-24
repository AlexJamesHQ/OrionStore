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

function send(res: any, status: number, data: any, cacheSeconds = 0) {
  const cacheControl = cacheSeconds > 0
    ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`
    : 'no-store, no-cache, must-revalidate';

  return res.status(status)
    .setHeader('Content-Type', 'application/json; charset=utf-8')
    .setHeader('Cache-Control', cacheControl)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .json(data);
}

const API_VERSION = '2026-03-10';
const API_HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': API_VERSION,
  'User-Agent': 'OrionStore/1.1 (GitHub repository browser)',
};
const WEB_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml',
  'User-Agent': 'Mozilla/5.0 (compatible; OrionStore/1.1; +https://orionstore-alex.vercel.app)',
};

function rateInfo(response: Response) {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  return {
    remaining: remaining === null ? null : Number(remaining),
    reset: reset === null ? null : Number(reset),
  };
}

function htmlDecode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x27;/gi, "'")
    .trim();
}

function stripTags(value: string): string {
  return htmlDecode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
}

function parseAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? htmlDecode(match[1]) : null;
}

function parseGithubHtmlRepositories(html: string, username: string): any[] {
  const repos: any[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b[^>]*itemprop=["']name codeRepository["'][^>]*>[\s\S]*?<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const block = match[0];
    const href = parseAttr(block, 'href');
    if (!href) continue;
    const repoMatch = href.match(new RegExp(`^\\/${username.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\/([^/?#]+)$`, 'i'));
    if (!repoMatch) continue;

    const name = decodeURIComponent(repoMatch[1]);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const after = html.slice(anchorRegex.lastIndex, Math.min(html.length, anchorRegex.lastIndex + 5000));
    const descriptionMatch = after.match(/itemprop=["']description["'][^>]*>([\s\S]*?)<\/p>/i);
    const languageMatch = after.match(/itemprop=["']programmingLanguage["'][^>]*>([\s\S]*?)<\/span>/i);
    const updatedMatch = after.match(/<relative-time[^>]*datetime=["']([^"']+)["']/i);
    const starMatch = after.match(/href=["'][^"']*\/stargazers[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);

    repos.push(enrichRepo({
      id: `${username}/${name}`,
      name,
      full_name: `${username}/${name}`,
      private: false,
      html_url: `https://github.com/${username}/${encodeURIComponent(name)}`,
      clone_url: `https://github.com/${username}/${encodeURIComponent(name)}.git`,
      ssh_url: `git@github.com:${username}/${name}.git`,
      description: descriptionMatch ? stripTags(descriptionMatch[1]) : null,
      language: languageMatch ? stripTags(languageMatch[1]) : null,
      stargazers_count: starMatch ? Number(stripTags(starMatch[1]).replace(/,/g, '')) || 0 : 0,
      forks_count: 0,
      updated_at: updatedMatch ? updatedMatch[1] : null,
      pushed_at: updatedMatch ? updatedMatch[1] : null,
      default_branch: 'main',
      topics: [],
    }));
  }

  return repos;
}

async function fetchGithubWebRepositories(username: string): Promise<any[]> {
  const all: any[] = [];
  const seen = new Set<string>();

  // GitHub's public repository page is used only as a fallback when the REST
  // API is rate-limited/blocked. This keeps public repository browsing usable
  // without exposing a personal access token to the browser.
  for (let page = 1; page <= 5; page++) {
    const url = `https://github.com/${encodeURIComponent(username)}?tab=repositories&sort=updated&page=${page}`;
    const response = await fetch(url, { headers: WEB_HEADERS, cache: 'no-store' });
    if (!response.ok) throw new Error(`GitHub web profile request failed (${response.status})`);
    const html = await response.text();
    const repos = parseGithubHtmlRepositories(html, username);
    if (!repos.length) break;
    for (const repo of repos) {
      const key = String(repo.full_name || repo.name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        all.push(repo);
      }
    }
    if (repos.length < 10) break;
  }

  return all;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const username = cleanUsername(String(req.query?.user || 'AlexJamesHQ'));
  if (!username) return send(res, 400, { error: 'GitHub username is required' });

  const token = String(process.env.GITHUB_TOKEN || '').trim();

  async function github(url: string): Promise<Response> {
    const authHeaders = token ? { ...API_HEADERS, Authorization: `Bearer ${token}` } : API_HEADERS;
    let response = await fetch(url, { headers: authHeaders, cache: 'no-store' });
    if ((response.status === 401 || response.status === 403) && token) {
      // If the configured token is invalid/blocked, retry once anonymously.
      response = await fetch(url, { headers: API_HEADERS, cache: 'no-store' });
    }
    return response;
  }

  try {
    let profileRes = await github(`https://api.github.com/users/${encodeURIComponent(username)}`);

    // A 403 from GitHub is commonly a rate-limit/secondary-limit response.
    // Fall back to GitHub's public profile HTML instead of returning a blank
    // repository list. Authenticated REST API access is still preferred.
    if (profileRes.status === 403 || profileRes.status === 429) {
      try {
        const webRepos = await fetchGithubWebRepositories(username);
        if (webRepos.length > 0) {
          const profile = {
            login: username,
            name: username,
            avatar_url: `https://github.com/${username}.png?size=160`,
            html_url: `https://github.com/${username}`,
            bio: null,
            company: null,
            location: null,
            blog: null,
            public_repos: webRepos.length,
            followers: 0,
            following: 0,
          };
          return send(res, 200, {
            profile,
            publicRepos: webRepos,
            starredRepos: [],
            publicCount: webRepos.length,
            starredCount: 0,
            source: 'github-web-fallback',
            githubPublicRepoCount: webRepos.length,
            warning: 'GitHub REST API was rate-limited; public profile HTML fallback was used.',
          }, 60);
        }
      } catch (fallbackError) {
        console.warn('GitHub web fallback failed', fallbackError);
      }

      const info = rateInfo(profileRes);
      const text = await profileRes.text().catch(() => '');
      return send(res, 429, {
        error: 'GitHub API rate limit or access restriction is active.',
        detail: text.slice(0, 300),
        rateLimitRemaining: info.remaining,
        rateLimitReset: info.reset,
      });
    }

    if (profileRes.status === 404) return send(res, 404, { error: 'GitHub user not found' });
    if (!profileRes.ok) {
      const text = await profileRes.text().catch(() => '');
      return send(res, 502, { error: `GitHub profile request failed (${profileRes.status})`, detail: text.slice(0, 300) });
    }

    const profile = await profileRes.json();
    const reposUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&page=1&sort=updated&type=owner`;
    const reposRes = await github(reposUrl);

    if (reposRes.status === 403 || reposRes.status === 429) {
      try {
        const webRepos = await fetchGithubWebRepositories(username);
        if (webRepos.length > 0) {
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
              public_repos: Number(profile.public_repos || webRepos.length),
              followers: Number(profile.followers || 0),
              following: Number(profile.following || 0),
            },
            publicRepos: webRepos,
            starredRepos: [],
            publicCount: webRepos.length,
            starredCount: 0,
            source: 'github-web-fallback',
            githubPublicRepoCount: Number(profile.public_repos || webRepos.length),
            warning: 'GitHub repository API was rate-limited; public profile HTML fallback was used.',
          }, 60);
        }
      } catch (fallbackError) {
        console.warn('GitHub repository web fallback failed', fallbackError);
      }

      const info = rateInfo(reposRes);
      const text = await reposRes.text().catch(() => '');
      return send(res, 429, {
        error: 'GitHub repository API rate limit or access restriction is active.',
        detail: text.slice(0, 300),
        rateLimitRemaining: info.remaining,
        rateLimitReset: info.reset,
        githubPublicRepoCount: Number(profile.public_repos || 0),
      });
    }

    if (!reposRes.ok) {
      const text = await reposRes.text().catch(() => '');
      return send(res, 502, { error: `GitHub repositories request failed (${reposRes.status})`, detail: text.slice(0, 300), githubPublicRepoCount: Number(profile.public_repos || 0) });
    }

    const repos = await reposRes.json();
    if (!Array.isArray(repos)) return send(res, 502, { error: 'GitHub repositories returned invalid data' });

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
    }, 60);
  } catch (error) {
    console.error('github-user error', error);
    return send(res, 502, { error: 'Unable to load GitHub repositories right now.', detail: error instanceof Error ? error.message : String(error) });
  }
}
