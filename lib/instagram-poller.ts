/**
 * Instagram Reel Poller
 *
 * Detects new reels from an Instagram account using the upload-post.com API.
 * Since upload-post doesn't expose a "list recent reels" endpoint, we use
 * two strategies:
 *
 * 1. PRIMARY — upload-post recent-posts endpoint (if available):
 *    GET https://api.upload-post.com/api/uploadposts/recent/{username}
 *
 * 2. FALLBACK — manual trigger: the caller supplies the reel URL directly.
 *    The poll endpoint accepts a `reel_url` override for manual triggering.
 */

import axios from 'axios';
import type { AutomationRule, Account } from '@/drizzle/schema';

const BASE_URL = 'https://api.upload-post.com/api';

export interface NewReel {
  id: string;
  url: string;
  caption: string;
  thumbnail?: string;
}

export interface RecentPostsResponse {
  posts: Array<{
    id: string;
    url?: string;
    video_url?: string;
    caption?: string;
    thumbnail?: string;
    platform?: string;
    created_at?: string;
  }>;
}

/**
 * Try to fetch recent reels via upload-post API.
 * Returns an empty array if the endpoint doesn't exist or returns no data.
 */
async function fetchRecentReelsFromAPI(
  apiKey: string,
  username: string
): Promise<NewReel[]> {
  const headers = { Authorization: `Apikey ${apiKey}` };

  // Try the uploadposts/recent endpoint
  try {
    const res = await axios.get<RecentPostsResponse>(
      `${BASE_URL}/uploadposts/recent/${username}`,
      { headers, timeout: 10000 }
    );
    const posts = res.data?.posts ?? [];
    return posts
      .filter((p) => p.url || p.video_url)
      .map((p) => ({
        id: p.id,
        url: (p.video_url || p.url) as string,
        caption: p.caption ?? '',
        thumbnail: p.thumbnail,
      }));
  } catch {
    // Endpoint not available — fall through to empty
  }

  // Try alternative endpoint pattern
  try {
    const res = await axios.get<RecentPostsResponse>(
      `${BASE_URL}/instagram/${username}/reels`,
      { headers, timeout: 10000 }
    );
    const posts = res.data?.posts ?? [];
    return posts
      .filter((p) => p.url || p.video_url)
      .map((p) => ({
        id: p.id,
        url: (p.video_url || p.url) as string,
        caption: p.caption ?? '',
        thumbnail: p.thumbnail,
      }));
  } catch {
    // Not available either
  }

  return [];
}

/**
 * Check for new reels since the last known reel ID.
 * Returns only reels newer than rule.last_reel_id.
 */
export async function checkForNewReels(
  account: Account,
  rule: AutomationRule,
  manualReelUrl?: string
): Promise<NewReel[]> {
  // Manual trigger: caller provides a reel URL directly
  if (manualReelUrl) {
    const reelId = `manual-${Date.now()}`;
    return [
      {
        id: reelId,
        url: manualReelUrl,
        caption: '',
      },
    ];
  }

  // Try API-based polling
  const allReels = await fetchRecentReelsFromAPI(account.api_key, account.username);

  if (allReels.length === 0) {
    return [];
  }

  // If no previous reel tracked, return only the very latest to seed the state
  if (!rule.last_reel_id) {
    return [allReels[0]];
  }

  // Return reels that appear before the last known reel in the list
  // (upload-post returns newest first)
  const lastIndex = allReels.findIndex((r) => r.id === rule.last_reel_id);
  if (lastIndex === -1) {
    // Can't find last known reel — return only latest to avoid mass-repost
    return [allReels[0]];
  }

  // Everything before lastIndex is newer
  return allReels.slice(0, lastIndex);
}

/**
 * Extract a reel ID from an Instagram URL for deduplication.
 * e.g. https://www.instagram.com/reel/ABC123xyz/ → ABC123xyz
 */
export function extractReelId(url: string): string {
  const match = url.match(/\/reel\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  // Fallback: hash the URL
  return Buffer.from(url).toString('base64').slice(0, 16);
}
