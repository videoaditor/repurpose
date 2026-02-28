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

export interface AnalyticsResponse {
  username: string;
  platforms: Record<string, {
    followers: number;
    views: number;
    likes: number;
    comments: number;
  }>;
}

export async function getAnalytics(
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
