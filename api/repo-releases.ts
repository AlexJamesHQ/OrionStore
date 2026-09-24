const ALEX_PUBLIC_REPOSITORIES: any[] = [];
const INITIAL_REPOSITORIES: any[] = [];

const KNOWN_MAP: Record<string, any> = {
  orionstore: {
    tagName: 'OrionStore',
    releaseName: 'OrionStore Android Release',
    apkName: 'OrionStore_v7.8.3.0.APK',
    downloadUrl: 'https://github.com/AlexJamesHQ/OrionStore/releases/download/OrionStore/OrionStore_v7.8.3.0.APK',
    sizeBytes: 18400000,
    publishedAt: '2026-09-24T05:46:00Z',
    releaseNotes: '• High performance OrionStore Android APK distribution\n• Live repository browser & installer',
    htmlUrl: 'https://github.com/AlexJamesHQ/OrionStore/releases',
  },
  'orion-store': {
    tagName: 'V1.3.3',
    releaseName: 'OrionStore v1.3.3',
    apkName: 'Orion.Store.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/Orion-Store/releases/download/V1.3.3/Orion.Store.apk',
    sizeBytes: 16800000,
    publishedAt: '2026-09-24T02:38:00Z',
    releaseNotes: '• Instant access to YouTube Morphe & open-source APK tools',
    htmlUrl: 'https://github.com/AlexJamesHQ/Orion-Store/releases',
  },
  swiftslate: {
    tagName: 'SwiftSlate',
    releaseName: 'SwiftSlate Release',
    apkName: 'SwiftSlate.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/SwiftSlate/releases/download/SwiftSlate/SwiftSlate.apk',
    sizeBytes: 15400000,
    publishedAt: '2026-09-23T08:41:54Z',
    releaseNotes: '• Direct APK package installer & accessibility service\n• Auto-sync with AlexJamesHQ GitHub repositories',
    htmlUrl: 'https://github.com/AlexJamesHQ/SwiftSlate/releases',
  },
  'lastwave-native': {
    tagName: 'LastWave',
    releaseName: 'LastWave Native Android Release',
    apkName: 'LastWave.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/LastWave-Native/releases/download/LastWave/LastWave.apk',
    sizeBytes: 12800000,
    publishedAt: '2026-09-14T09:56:56Z',
    releaseNotes: '• Lossless music player for Android with real-time synced lyrics',
    htmlUrl: 'https://github.com/AlexJamesHQ/LastWave-Native/releases',
  },
  koda: {
    tagName: 'Koda',
    releaseName: 'Koda Expressive Release',
    apkName: 'Koda.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/Koda/releases/download/Koda/Koda.apk',
    sizeBytes: 9800000,
    publishedAt: '2026-08-22T16:10:00Z',
    releaseNotes: '• Material 3 Expressive audio/video playback engine for Android',
    htmlUrl: 'https://github.com/AlexJamesHQ/Koda/releases',
  },
  'gemini-ai': {
    tagName: 'Gemini-Ai',
    releaseName: 'Gemini-Ai Mobile Release',
    apkName: 'Gemini_Ai_v4.5.6.APK',
    downloadUrl: 'https://github.com/AlexJamesHQ/Gemini-Ai/releases/download/Gemini-Ai/Gemini_Ai_v4.5.6.APK',
    sizeBytes: 21500000,
    publishedAt: '2026-08-18T19:40:00Z',
    releaseNotes: '• Mobile client for AI image generation prompt management',
    htmlUrl: 'https://github.com/AlexJamesHQ/Gemini-Ai/releases',
  },
  archivetune: {
    tagName: '13.7.0',
    releaseName: 'ArchiveTune v13.7.0',
    apkName: 'ArchiveTune.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/ArchiveTune/releases/download/13.7.0/ArchiveTune.apk',
    sizeBytes: 14200000,
    publishedAt: '2026-07-06T11:10:00Z',
    releaseNotes: '• Material 3 Expressive Music Player supporting YouTube Music',
    htmlUrl: 'https://github.com/AlexJamesHQ/ArchiveTune/releases',
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const repoQuery = (req.query.repo as string) || '';
  const cleanRepo = repoQuery.replace(/^https?:\/\/github\.com\//i, '').replace(/^\/+|\/+$/g, '');
  const repoName = cleanRepo.includes('/') ? cleanRepo.split('/')[1] : cleanRepo;
  const key = repoName.toLowerCase();

  // Try live GitHub API first
  try {
    const ghRes = await fetch(`https://api.github.com/repos/${cleanRepo}/releases/latest`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (ghRes.ok) {
      const rel = await ghRes.json();
      const apk = Array.isArray(rel.assets)
        ? rel.assets.find((a: any) => a.name?.toLowerCase().endsWith('.apk'))
        : null;
      if (apk) {
        return res.status(200).json({
          success: true,
          hasApk: true,
          repo: cleanRepo,
          tagName: rel.tag_name || rel.name,
          releaseName: rel.name || `${repoName} ${rel.tag_name}`,
          apkName: apk.name,
          downloadUrl: apk.browser_download_url,
          sizeBytes: apk.size,
          publishedAt: rel.published_at || new Date().toISOString(),
          releaseNotes: rel.body || '• Verified APK release built from GitHub.',
          downloadCount: apk.download_count || 0,
          htmlUrl: rel.html_url || `https://github.com/${cleanRepo}/releases`,
          isLive: true,
        });
      }
    }
  } catch (e) {
    // fallback
  }

  // Fallback to known list
  if (KNOWN_MAP[key]) {
    const item = KNOWN_MAP[key];
    return res.status(200).json({
      success: true,
      hasApk: true,
      repo: cleanRepo || `AlexJamesHQ/${repoName}`,
      ...item,
      downloadCount: 1,
      isLive: false,
    });
  }

  // Fallback from sampleRepos
  const all = [...ALEX_PUBLIC_REPOSITORIES, ...INITIAL_REPOSITORIES];
  const found = all.find(
    (r) => r.name.toLowerCase() === key || r.full_name?.toLowerCase() === cleanRepo.toLowerCase()
  );

  if (found?.latestRelease) {
    return res.status(200).json({
      success: true,
      hasApk: true,
      repo: found.full_name,
      tagName: found.latestRelease.tagName,
      releaseName: found.latestRelease.name,
      apkName: found.latestRelease.apkName,
      downloadUrl: found.latestRelease.downloadUrl,
      sizeBytes: found.latestRelease.sizeBytes,
      publishedAt: found.latestRelease.publishedAt,
      releaseNotes: '• Verified Android APK release directly from repository.',
      downloadCount: 1,
      htmlUrl: `${found.html_url}/releases`,
      isLive: false,
    });
  }

  return res.status(200).json({
    success: false,
    hasApk: false,
    repo: cleanRepo,
    message: 'No APK release found for this repository.',
  });
}
