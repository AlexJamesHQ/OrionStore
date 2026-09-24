export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // App updates for OrionStore / AlexJamesHQ
  return res.status(200).json({
    hasUpdate: true,
    currentVersion: 'v1.3.2',
    latestVersion: 'v1.3.3',
    releaseName: 'OrionStore v1.3.3 Stable APK',
    apkName: 'Orion.Store.apk',
    downloadUrl: 'https://github.com/AlexJamesHQ/Orion-Store/releases/download/V1.3.3/Orion.Store.apk',
    sizeBytes: 16800000,
    publishedAt: '2026-09-24T02:38:00Z',
    releaseNotes: '• Real-time GitHub sync & Vercel deployment stability\n• Fixed repository star counts and accurate categorization\n• Instant APK direct install button',
    isLive: true,
  });
}
