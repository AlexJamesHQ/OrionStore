const APP_CURRENT_VERSION = '1.4.2';
const APP_UPDATE_REPOSITORY = 'AlexJamesHQ/OrionStore';

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  body?: string;
  published_at?: string;
  updated_at?: string;
  html_url?: string;
  assets?: Array<{ name?: string; browser_download_url?: string; size?: number }>;
}

function versionParts(value: string): number[] {
  const match = value.replace(/^v/i, '').match(/\d+(?:\.\d+)*/);
  return (match?.[0] || '0').split('.').map(Number);
}

function compareVersions(a: string, b: string): number {
  const aa = versionParts(a);
  const bb = versionParts(b);
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i += 1) {
    const av = aa[i] || 0;
    const bv = bb[i] || 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

function cleanNotes(value?: string): string {
  const text = (value || '').replace(/<!--([\s\S]*?)-->/g, '').trim();
  return text || 'No release notes provided.';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const now = new Date().toISOString();
  const base = {
    currentVersion: `v${APP_CURRENT_VERSION}`,
    latestVersion: `v${APP_CURRENT_VERSION}`,
    hasUpdate: false,
    releaseName: 'Up to Date',
    releaseNotes: 'You are running the latest version.',
    publishedAt: now,
    lastSynced: now,
    apkDownloadUrl: '',
    apkFileName: '',
    apkSizeBytes: undefined as number | undefined,
    githubReleaseUrl: `https://github.com/${APP_UPDATE_REPOSITORY}`,
    allReleases: [] as any[],
  };

  try {
    const gh = await fetch(`https://api.github.com/repos/${APP_UPDATE_REPOSITORY}/releases?per_page=20`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'OrionStore',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      cache: 'no-store',
    });
    if (!gh.ok) return res.status(200).json(base);

    const releases = await gh.json() as GitHubRelease[];
    const mapped = releases
      .filter((r) => r.tag_name)
      .map((r) => {
        const apk = r.assets?.find((a) => a.name?.toLowerCase().endsWith('.apk'));
        return {
          repoName: APP_UPDATE_REPOSITORY.split('/')[1],
          tagName: r.tag_name,
          releaseName: r.name || r.tag_name,
          releaseNotes: cleanNotes(r.body),
          publishedAt: r.published_at || now,
          updatedAt: r.updated_at,
          apkDownloadUrl: apk?.browser_download_url || '',
          apkFileName: apk?.name || '',
          apkSizeBytes: apk?.size,
          githubReleaseUrl: r.html_url || `https://github.com/${APP_UPDATE_REPOSITORY}/releases`,
          isApk: Boolean(apk),
        };
      });

    const latest = mapped.find((r) => r.isApk) || mapped[0];
    if (!latest) return res.status(200).json({ ...base, allReleases: mapped });

    const hasUpdate = compareVersions(latest.tagName, APP_CURRENT_VERSION) > 0;
    return res.status(200).json({
      currentVersion: `v${APP_CURRENT_VERSION}`,
      latestVersion: latest.tagName,
      hasUpdate,
      releaseName: latest.releaseName,
      releaseNotes: latest.releaseNotes,
      publishedAt: latest.publishedAt,
      lastSynced: now,
      apkDownloadUrl: latest.apkDownloadUrl,
      apkFileName: latest.apkFileName,
      apkSizeBytes: latest.apkSizeBytes,
      githubReleaseUrl: latest.githubReleaseUrl,
      allReleases: mapped,
    });
  } catch {
    return res.status(200).json(base);
  }
}
