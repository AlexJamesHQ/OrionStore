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
