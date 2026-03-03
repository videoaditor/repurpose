import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://api.upload-post.com/api';

function authHeaders(apiKey: string) {
  return { Authorization: `Apikey ${apiKey}` };
}

// ── Verify API key ──────────────────────────────────────────────
export interface MeResponse {
  success: boolean;
  email: string;
  plan: string;
}

export async function verifyApiKey(apiKey: string): Promise<MeResponse> {
  const response = await axios.get<MeResponse>(
    `${BASE_URL}/uploadposts/me`,
    { headers: authHeaders(apiKey) }
  );
  return response.data;
}

// ── List connected profiles ─────────────────────────────────────
export interface SocialAccount {
  display_name: string;
  handle: string;
  social_images: string;
  reauth_required: boolean;
}

export interface UserProfile {
  username: string;
  social_accounts: Record<string, SocialAccount | string>;
  created_at: string;
  blocked: boolean;
}

export interface UsersResponse {
  success: boolean;
  profiles: UserProfile[];
  limit: number;
  plan: string;
}

export async function listProfiles(apiKey: string): Promise<UsersResponse> {
  const response = await axios.get<UsersResponse>(
    `${BASE_URL}/uploadposts/users`,
    { headers: authHeaders(apiKey) }
  );
  return response.data;
}

// ── Upload video (multipart form-data with file) ────────────────
export interface UploadVideoParams {
  user: string;
  videoPath: string;
  platforms: string[];
  title: string;
  description?: string;
  tiktok_title?: string;
  youtube_title?: string;
  youtube_description?: string;
  async_upload?: boolean;
}

export interface UploadVideoResponse {
  success: boolean;
  request_id?: string;
  status?: string;
  message?: string;
  results?: Record<string, { status: string; url?: string; error?: string }>;
}

export async function uploadVideo(
  apiKey: string,
  params: UploadVideoParams
): Promise<UploadVideoResponse> {
  const form = new FormData();
  form.append('user', params.user);
  form.append('title', params.title);

  // Upload actual video file
  const videoStream = fs.createReadStream(params.videoPath);
  const filename = path.basename(params.videoPath);
  form.append('video', videoStream, { filename, contentType: 'video/mp4' });

  if (params.description) {
    form.append('description', params.description);
  }
  if (params.youtube_title) {
    form.append('youtube_title', params.youtube_title);
  }
  if (params.youtube_description) {
    form.append('youtube_description', params.youtube_description);
  }
  if (params.tiktok_title) {
    form.append('tiktok_title', params.tiktok_title);
  }

  for (const platform of params.platforms) {
    form.append('platform[]', platform);
  }

  if (params.async_upload !== false) {
    form.append('async_upload', 'true');
  }

  try {
    const response = await axios.post<UploadVideoResponse>(
      `${BASE_URL}/upload`,
      form,
      {
        headers: {
          ...authHeaders(apiKey),
          ...form.getHeaders(),
        },
        timeout: 300000, // 5 min for large uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    return response.data;
  } catch (err) {
    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    console.error('Upload-post error:', axiosErr.response?.status, JSON.stringify(axiosErr.response?.data));
    throw err;
  }
}

// ── Check upload status ─────────────────────────────────────────
export interface UploadStatusResponse {
  success: boolean;
  request_id: string;
  status: string;
  results?: Record<string, { status: string; url?: string; error?: string }>;
}

export async function getUploadStatus(
  apiKey: string,
  requestId: string
): Promise<UploadStatusResponse> {
  const response = await axios.get<UploadStatusResponse>(
    `${BASE_URL}/uploadposts/status`,
    {
      headers: authHeaders(apiKey),
      params: { request_id: requestId },
    }
  );
  return response.data;
}

// ── Upload history ──────────────────────────────────────────────
export async function getUploadHistory(
  apiKey: string
): Promise<{ success: boolean; uploads: unknown[] }> {
  const response = await axios.get(
    `${BASE_URL}/uploadposts/history`,
    { headers: authHeaders(apiKey) }
  );
  return response.data;
}

// ── Analytics (kept for dashboard) ──────────────────────────────
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

export interface TotalImpressionsResponse {
  username: string;
  total_impressions: number;
  period?: string;
}

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
    { headers: authHeaders(apiKey), params }
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

export function normalizeAnalytics(
  raw: AnalyticsResponse,
  totalImpressions = 0
) {
  const platforms: Record<string, PlatformAnalytics> = {};

  for (const [name, data] of Object.entries(raw.platforms ?? {})) {
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
