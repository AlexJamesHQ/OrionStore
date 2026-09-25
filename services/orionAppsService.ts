import { OrionAppItem } from '../types';
import { localAppsData } from '../data/localAppsData';

const CACHE_KEY = 'orion_apps_data_v3';

const PRIORITY_PACKAGE_NAMES = [
  'moe.rukamori.archivetune',
  'com.ivor.ivormusic',
  'dev.citali.lunartune',
  'com.musheer360.swiftslate',
  'com.asrumon.telephoto',
  'com.etrisad.zenith',
  'com.theveloper.pixelplay',
  'com.vivi.vivimusic',
  'ru.tech.imageresizershrinker',
  'org.localsend.localsend_app',
  'com.junkfood.seal',
  'com.dot.gallery',
  'me.rerere.rikkahub',
  'com.msob7y.namida',
  'org.nqmgaming.aneko',
  'cn.nubia.redmagickyi',
  'com.streak.app',
  'com.serranoie.app.minus',
  'com.lastwave.app',
  'com.rubex.nfile',
  'com.roxum',
  'com.foxdebug.acode',
  'com.eyalm.adns',
  'com.pranshulgg.weather_master_app'
];

export async function fetchOrionApps(): Promise<OrionAppItem[]> {
  let allApps: OrionAppItem[] = [];

  // Tier 0: Instantly check localStorage cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allApps = parsed;
      }
    }
  } catch {}

  // Tier 1: Fetch live from Orion-Data GitHub repository raw endpoint
  try {
    const remoteRes = await fetch('https://raw.githubusercontent.com/RookieEnough/Orion-Data/main/apps.json');
    if (remoteRes.ok) {
      const remoteApps = await remoteRes.json();
      if (Array.isArray(remoteApps) && remoteApps.length > 0) {
        allApps = remoteApps;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from Orion-Data GitHub repo:', err);
  }

  // Tier 2: Fallback to local orion-apps.json or localAppsData
  if (allApps.length === 0) {
    try {
      const res = await fetch('/data/orion-apps.json');
      if (res.ok) {
        const localJson = await res.json();
        if (Array.isArray(localJson)) {
          allApps = localJson;
        }
      }
    } catch {}
  }

  if (allApps.length === 0) {
    allApps = (localAppsData as OrionAppItem[]) || [];
  }

  // Prioritize user's requested 24 apps at the top
  const prioritizedMap = new Map<string, OrionAppItem>();
  const priorityList: OrionAppItem[] = [];
  const otherList: OrionAppItem[] = [];

  // Match priority package names
  PRIORITY_PACKAGE_NAMES.forEach((pkg) => {
    const found = allApps.find(
      (a) => a.packageName && a.packageName.toLowerCase() === pkg.toLowerCase()
    );
    if (found && !prioritizedMap.has(found.id)) {
      prioritizedMap.set(found.id, { ...found, isFeatured: true });
      priorityList.push({ ...found, isFeatured: true });
    }
  });

  // Add remaining apps
  allApps.forEach((app) => {
    if (!prioritizedMap.has(app.id)) {
      otherList.push(app);
      prioritizedMap.set(app.id, app);
    }
  });

  const finalApps = [...priorityList, ...otherList];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(finalApps));
  } catch {}

  return finalApps;
}

export function getDownloadUrlForApp(app: OrionAppItem): string {
  if (app.downloadUrl && app.downloadUrl !== '#' && !app.downloadUrl.startsWith('#')) {
    return app.downloadUrl;
  }
  if (app.variants && app.variants.length > 0 && app.variants[0].url) {
    return app.variants[0].url;
  }
  if (app.githubRepo) {
    return `https://github.com/${app.githubRepo}/releases`;
  }
  if (app.repoUrl) {
    return app.repoUrl;
  }
  return '#';
}
