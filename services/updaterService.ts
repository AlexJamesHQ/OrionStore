// In-app real-time update checker and GitHub APK release manager
export interface ApkReleaseItem {
  repoName: string;
  tagName: string;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  updatedAt?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes?: number;
  githubReleaseUrl: string;
  isApk?: boolean;
}

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseName: string;
  releaseNotes: string;
  publishedAt: string;
  lastSynced?: string;
  apkDownloadUrl: string;
  apkFileName: string;
  apkSizeBytes?: number;
  githubReleaseUrl: string;
  allReleases: ApkReleaseItem[];
}

// Current App Version of this build
import { APP_CURRENT_VERSION as APP_VERSION, APP_UPDATE_REPOSITORY_URL } from '../config/app';

export const APP_CURRENT_VERSION = `v${APP_VERSION}`;

// Local storage keys to track dismissed notifications and count dismissals
export const DISMISSED_VERSION_KEY = 'alexjameshqq_dismissed_update_version';
export const DISMISS_COUNT_KEY = 'alexjameshqq_dismiss_count';

export function getDismissCount(): number {
  try {
    const val = localStorage.getItem(DISMISS_COUNT_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function isUpdatePermanentlyIgnored(version: string): boolean {
  try {
    const count = getDismissCount();
    const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);
    if (count >= 3 && dismissedVersion === version) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function recordUpdateDismissal(version: string): void {
  try {
    const currentCount = getDismissCount();
    const newCount = currentCount + 1;
    localStorage.setItem(DISMISS_COUNT_KEY, newCount.toString());
    localStorage.setItem(DISMISSED_VERSION_KEY, version);
  } catch {
    // ignore
  }
}

// Helper to format ISO date-time into human readable date, time, and relative duration
export function formatUpdateDateTime(isoString?: string): { formattedDate: string; formattedTime: string; relative: string } {
  if (!isoString) {
    return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
  }
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
    }

    const formattedDate = d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const formattedTime = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = 'Just now';
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      relative = `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else if (diffDays > 0) {
      relative = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} ${diffHours === 1 ? 'hr' : 'hrs'} ago`;
    } else if (diffMin > 0) {
      relative = `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
    }

    return { formattedDate, formattedTime, relative };
  } catch {
    return { formattedDate: 'Recently', formattedTime: '', relative: 'Latest' };
  }
}

// Clean HTML tags and markdown badge strings from release notes for clean viewing
export function cleanReleaseNotes(rawNotes?: string): string {
  if (!rawNotes) {
    return '• Live APK package installer\n• Auto-sync with AlexJamesHQ GitHub repositories\n• Direct release asset download\n• Neobrutalist design with offline PWA readiness';
  }

  let cleaned = rawNotes
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<\/?(div|br|p|center|span|a)\b[^>]*>/gi, '\n')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  if (!cleaned || cleaned.length < 5) {
    return '• Live APK package installer\n• Auto-sync with AlexJamesHQ GitHub repositories\n• Direct release asset download\n• Neobrutalist design with offline PWA readiness';
  }

  return cleaned;
}

export async function checkForAppUpdates(): Promise<AppUpdateInfo> {
  const now = new Date().toISOString();
  const defaultInfo: AppUpdateInfo = {
    currentVersion: APP_CURRENT_VERSION,
    latestVersion: APP_CURRENT_VERSION,
    hasUpdate: false,
    releaseName: 'Up to Date',
    releaseNotes: 'You are running the latest version.',
    publishedAt: now,
    lastSynced: now,
    apkDownloadUrl: '',
    apkFileName: '',
    githubReleaseUrl: APP_UPDATE_REPOSITORY_URL,
    allReleases: [],
  };

  try {
    const res = await fetch('/api/github-updates?fresh=true', { cache: 'no-store' });
    if (!res.ok) return defaultInfo;
    const data = await res.json();
    return {
      currentVersion: APP_CURRENT_VERSION,
      latestVersion: data.latestVersion || APP_CURRENT_VERSION,
      hasUpdate: Boolean(data.hasUpdate),
      releaseName: data.releaseName || 'Up to Date',
      releaseNotes: cleanReleaseNotes(data.releaseNotes),
      publishedAt: data.publishedAt || now,
      lastSynced: data.lastSynced || now,
      apkDownloadUrl: data.apkDownloadUrl || '',
      apkFileName: data.apkFileName || '',
      apkSizeBytes: data.apkSizeBytes,
      githubReleaseUrl: data.githubReleaseUrl || APP_UPDATE_REPOSITORY_URL,
      allReleases: Array.isArray(data.allReleases) ? data.allReleases : [],
    };
  } catch (error) {
    console.warn('App update check failed:', error);
    return defaultInfo;
  }
}
