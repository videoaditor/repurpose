import axios from 'axios';

const BASE_URL = 'https://api.upload-post.com/api';

function authHeaders(apiKey: string) {
  return { Authorization: `Apikey ${apiKey}` };
}

export interface UploadPostParams {
  video_url: string;
  title: string;
  description?: string;
  platforms: string[];
  tiktok_caption?: string;
  youtube_title?: string;
  youtube_description?: string;
  instagram_caption?: string;
  twitter_caption?: string;
  linkedin_caption?: string;
}

export interface UploadPostResponse {
  request_id: string;
  status: string;
  platforms: Record<string, { status: string; url?: string }>;
}

export async function postVideo(
  apiKey: string,
  params: UploadPostParams
): Promise<UploadPostResponse> {
  const response = await axios.post<UploadPostResponse>(
    `${BASE_URL}/upload`,
    params,
    { headers: authHeaders(apiKey) }
  );
  return response.data;
}

export interface PlatformAnalytics {
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach_timeseries: { date: string; value: number }[];
  metric_type: string;
}

export interface AnalyticsResponse {
  username: string;
  platforms: Record<string, PlatformAnalytics>;
}

export interface NormalizedAnalytics {
  platforms: Record<string, PlatformAnalytics>;
  total_impressions: number;
  summary: {
    totalFollowers: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
  };
}

/**
 * Fetch profile analytics for specific platforms.
 * Correct format: ?platforms=tiktok,youtube,instagram
 */
export async function getProfileAnalytics(
  apiKey: string,
  username: string,
  platforms: string[]
): Promise<AnalyticsResponse> {
  const response = await axios.get<AnalyticsResponse>(
    `${BASE_URL}/analytics/${username}`,
    {
      headers: authHeaders(apiKey),
      params: { platforms: platforms.join(',') },
    }
  );
  return response.data;
}

/** Legacy alias */
export async function getAnalytics(
  apiKey: string,
  username: string,
  platforms: string[]
): Promise<AnalyticsResponse> {
  return getProfileAnalytics(apiKey, username, platforms);
}

export interface TotalImpressionsResponse {
  username: string;
  total_impressions: number;
  period?: string;
}

/**
 * Fetch total impressions for a user across all platforms.
 */
export async function getTotalImpressions(
  apiKey: string,
  username: string,
  options?: { platforms?: string[]; period?: string }
): Promise<TotalImpressionsResponse> {
  const params: Record<string, string> = {};
  if (options?.platforms?.length) {
    params.platforms = options.platforms.join(',');
  }
  if (options?.period) {
    params.period = options.period;
  }

  const response = await axios.get<TotalImpressionsResponse>(
    `${BASE_URL}/uploadposts/total-impressions/${username}`,
    {
      headers: authHeaders(apiKey),
      params,
    }
  );
  return response.data;
}

export interface PostAnalyticsResponse {
  request_id: string;
  platforms: Record<string, {
    status: string;
    url?: string;
    views?: number;
    likes?: number;
    comments?: number;
  }>;
}

export async function getPostAnalytics(
  apiKey: string,
  requestId: string
): Promise<PostAnalyticsResponse> {
  const response = await axios.get<PostAnalyticsResponse>(
    `${BASE_URL}/uploadposts/post-analytics/${requestId}`,
    { headers: authHeaders(apiKey) }
  );
  return response.data;
}

/**
 * Normalize raw analytics into a clean summary shape.
 */
export function normalizeAnalytics(
  raw: AnalyticsResponse,
  totalImpressions = 0
): NormalizedAnalytics {
  const platforms: Record<string, PlatformAnalytics> = {};

  for (const [name, data] of Object.entries(raw.platforms ?? {})) {
    // Coerce missing fields to 0
    platforms[name] = {
      followers: data.followers ?? 0,
      views: data.views ?? 0,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      shares: data.shares ?? 0,
      saves: data.saves ?? 0,
      reach_timeseries: data.reach_timeseries ?? [],
      metric_type: data.metric_type ?? 'views',
    };
  }

  const summary = {
    totalFollowers: Object.values(platforms).reduce((s, p) => s + p.followers, 0),
    totalViews: Object.values(platforms).reduce((s, p) => s + p.views, 0),
    totalLikes: Object.values(platforms).reduce((s, p) => s + p.likes, 0),
    totalComments: Object.values(platforms).reduce((s, p) => s + p.comments, 0),
  };

  return { platforms, total_impressions: totalImpressions, summary };
}
