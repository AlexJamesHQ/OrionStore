import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ALEX_PUBLIC_REPOSITORIES, INITIAL_REPOSITORIES, DEFAULT_USER_PROFILE } from '../data/sampleRepos';
import { hasActualApk } from '../types';

const KNOWN_APK_MAP = new Map<string, any>();
[...ALEX_PUBLIC_REPOSITORIES, ...INITIAL_REPOSITORIES].forEach((r) => {
  if (r.latestRelease && (r.latestRelease.apkName || r.latestRelease.downloadUrl)) {
    KNOWN_APK_MAP.set(r.name.toLowerCase(), r.latestRelease);
    if (r.full_name) KNOWN_APK_MAP.set(r.full_name.toLowerCase(), r.latestRelease);
  }
});

function enrichRepo(r: any) {
  const verified =
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

  const isApk = Boolean(verified) || hasActualApk(r);
  return {
    ...r,
    latestRelease: verified,
    category: isApk ? 'Android & APK' : r.category || 'Tools & Utilities',
  };
}

export default async function handler(req: any, res: any) {
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

  const isAlex = cleanUser.toLowerCase() === 'alexjameshq' || !cleanUser;

  if (isAlex) {
    const publicRepos = ALEX_PUBLIC_REPOSITORIES.map(enrichRepo);
    const starredRepos = INITIAL_REPOSITORIES.map(enrichRepo);
    return res.status(200).json({
      profile: DEFAULT_USER_PROFILE,
      publicRepos,
      starredRepos,
      publicCount: publicRepos.length,
      starredCount: starredRepos.length,
    });
  }

  // If another user is requested, attempt GitHub API or return fallback
  try {
    const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (ghRes.ok) {
      const p = await ghRes.json();
      const reposRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}/repos?per_page=100&sort=updated`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const reposData = reposRes.ok ? await reposRes.json() : [];
      const publicRepos = Array.isArray(reposData) ? reposData.map(enrichRepo) : [];

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
          public_repos: p.public_repos,
          followers: p.followers,
          following: p.following,
        },
        publicRepos,
        starredRepos: [],
        publicCount: publicRepos.length,
        starredCount: 0,
      });
    }
  } catch (e) {
    // fallback
  }

  return res.status(200).json({
    profile: {
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
    },
    publicRepos: [],
    starredRepos: [],
    publicCount: 0,
    starredCount: 0,
  });
}
