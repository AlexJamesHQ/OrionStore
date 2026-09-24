export interface ApkRelease {
  tagName: string;
  name: string;
  publishedAt: string;
  apkName: string;
  downloadUrl: string;
  sizeBytes?: number;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count?: number;
  language: string | null;
  category?: string;
  topics?: string[];
  updated_at?: string;
  homepage?: string | null;
  default_branch?: string;
  latestRelease?: ApkRelease | null;
}

export interface GitHubUserProfile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  public_repos: number;
  followers: number;
  following: number;
  starred_count?: number;
}

export function hasActualApk(repo?: Repository | null): boolean {
  if (!repo) return false;

  // 1. Direct verified release with apk
  if (repo.latestRelease) {
    const apkName = (repo.latestRelease.apkName || '').toLowerCase();
    const url = (repo.latestRelease.downloadUrl || '').toLowerCase();
    const tag = (repo.latestRelease.tagName || '').toLowerCase();
    if (apkName.endsWith('.apk') || url.includes('.apk') || apkName.includes('.apk')) {
      return true;
    }
  }

  // 2. Android & APK semantic category
  if (repo.category === 'Android & APK') return true;

  // 3. Topics mentioning apk or android
  if (Array.isArray(repo.topics) && repo.topics.some((t: string) => {
    const lt = t.toLowerCase();
    return lt === 'apk' || lt === 'android' || lt.includes('apk') || lt.includes('android-app');
  })) {
    return true;
  }

  // 4. Description or name mentioning APK / Android app
  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  if (name.includes('apk') || desc.includes('.apk') || desc.includes('apk ') || desc.includes(' apk') || desc.includes('android app')) {
    return true;
  }

  // 5. Known APK apps
  const knownApkApps = [
    'swiftslate', 'archivetune', 'koda', 'orionstore', 'orion-store', 'lastwave-native',
    'lastwave', 'nuviomobile', 'clockyou', 'rustdesk', 'anidash', 'erosflashtool',
    'bitchord', 'pixelmusicapp', 'iyox-wormhole', 'micts', 'minus', 'lunartune',
    'flow', 'airi', 'komi-store', 'streak', 'smartisland', 'morphe-autobuilds',
    'vivi-music', 'namida', 'pixelplayer', 'kurodo', 'android-titanium-browser',
    'microg-ungoogled-chromium'
  ];

  return knownApkApps.includes(name);
}
