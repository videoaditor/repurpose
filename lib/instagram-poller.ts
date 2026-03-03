/**
 * Instagram Reel Poller
 *
 * Detects new reels from an Instagram account using the upload-post.com API.
 * Downloads reels via yt-dlp since upload-post needs actual video files.
 */

import axios from 'axios';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

const BASE_URL = 'https://api.upload-post.com/api';

export interface InstagramMedia {
  id: string;
  caption: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
}

export interface MediaResponse {
  success: boolean;
  media: InstagramMedia[];
}

export interface NewReel {
  id: string;
  url: string;
  caption: string;
  thumbnail?: string;
  timestamp: string;
  videoPath?: string;
}

/**
 * Fetch recent Instagram media via upload-post API.
 * Filters to VIDEO type only (reels).
 */
async function fetchRecentReels(
  apiKey: string,
  username: string
): Promise<NewReel[]> {
  const headers = { Authorization: `Apikey ${apiKey}` };

  try {
    const res = await axios.get<MediaResponse>(
      `${BASE_URL}/uploadposts/media`,
      {
        headers,
        params: { user: username, platform: 'instagram' },
        timeout: 15000,
      }
    );

    if (!res.data?.success || !res.data?.media) {
      return [];
    }

    return res.data.media
      .filter((m) => m.media_type === 'VIDEO')
      .map((m) => ({
        id: m.id,
        url: m.permalink,
        caption: m.caption ?? '',
        thumbnail: m.thumbnail_url,
        timestamp: m.timestamp,
      }));
  } catch (err) {
    console.error('Failed to fetch Instagram media:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Download an Instagram reel video using yt-dlp.
 * Returns the path to the downloaded video file.
 */
export async function downloadReel(reelUrl: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const timestamp = Date.now();
  const outputPath = path.join(tmpDir, `reel_${timestamp}.mp4`);
  const outputTemplate = path.join(tmpDir, `reel_${timestamp}.%(ext)s`);
  
  try {
    // Use execFile to avoid shell escaping issues
    const ytdlp = '/opt/homebrew/bin/yt-dlp';
    const args = [
      '--cookies-from-browser', 'chrome',
      '-o', outputTemplate,
      '--merge-output-format', 'mp4',
      reelUrl
    ];
    
    await execFileAsync(ytdlp, args, { 
      timeout: 120000,
      env: { ...process.env, PATH: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin' }
    });
    
    // Check expected path
    if (fs.existsSync(outputPath)) {
      return outputPath;
    }
    
    // Try to find any matching file
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(`reel_${timestamp}`));
    if (files.length > 0) {
      return path.join(tmpDir, files[0]);
    }
    
    throw new Error('Downloaded file not found');
  } catch (err) {
    console.error('Failed to download reel:', err);
    throw err;
  }
}

/**
 * Check for new reels since the last known reel ID.
 * Returns only reels newer than lastReelId.
 */
export async function checkForNewReels(
  apiKey: string,
  username: string,
  lastReelId: string | null,
  manualReelUrl?: string
): Promise<NewReel[]> {
  // Manual trigger: caller provides a reel URL directly
  if (manualReelUrl) {
    return [
      {
        id: extractReelId(manualReelUrl),
        url: manualReelUrl,
        caption: '',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  // Fetch reels from API (newest first by timestamp)
  const allReels = await fetchRecentReels(apiKey, username);

  if (allReels.length === 0) {
    return [];
  }

  // If no previous reel tracked, seed with the latest one only
  if (!lastReelId) {
    return [allReels[0]];
  }

  // Find where the last known reel is in the list
  const lastIndex = allReels.findIndex((r) => r.id === lastReelId);

  if (lastIndex === -1) {
    // Can't find last known reel — return only latest to avoid mass-repost
    return [allReels[0]];
  }

  if (lastIndex === 0) {
    // Last known is the newest — nothing new
    return [];
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
  // Fallback: use timestamp-based ID
  return `manual-${Date.now()}`;
}

/**
 * Clean up a downloaded video file.
 */
export function cleanupVideo(videoPath: string): void {
  try {
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
  } catch (err) {
    console.error('Failed to cleanup video:', err);
  }
}
