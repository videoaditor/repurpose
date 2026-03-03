import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';
import { verifyApiKey, listProfiles } from '@/lib/uploadpost';

export async function GET() {
  try {
    const all = await db.select().from(accounts).orderBy(desc(accounts.created_at));
    return NextResponse.json(all);
  } catch (error) {
    console.error('GET /api/accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, api_key, color, platforms } = body;

    if (!name || !api_key || !platforms?.length) {
      return NextResponse.json({ error: 'Missing required fields (name, api_key, platforms)' }, { status: 400 });
    }

    // Verify the API key is valid
    let email: string;
    try {
      const verification = await verifyApiKey(api_key);
      if (!verification.success) {
        return NextResponse.json({ error: 'Invalid API key — upload-post verification failed' }, { status: 400 });
      }
      email = verification.email;
    } catch {
      return NextResponse.json({ error: 'Could not verify API key — check your upload-post.com API key' }, { status: 400 });
    }

    // Fetch connected profiles to get upload-post username and connected platforms
    let uploadPostUsername: string | undefined;
    let connectedPlatforms: string[] = [];
    try {
      const profilesResp = await listProfiles(api_key);
      if (profilesResp.success && profilesResp.profiles.length > 0) {
        // Use the first profile (or let user specify later)
        const profile = profilesResp.profiles[0];
        uploadPostUsername = profile.username;
        
        // Detect which platforms are actually connected
        for (const [platform, account] of Object.entries(profile.social_accounts)) {
          if (typeof account === 'object' && account && account.handle) {
            connectedPlatforms.push(platform);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch profiles, proceeding without:', err);
    }

    const username = uploadPostUsername || email;

    const [account] = await db.insert(accounts).values({
      name,
      username,
      api_key,
      upload_post_username: uploadPostUsername || null,
      color: color || '#6366f1',
      platforms,
      connected_platforms: connectedPlatforms.length > 0 ? connectedPlatforms : null,
    }).returning();

    return NextResponse.json({
      ...account,
      connected_platforms: connectedPlatforms,
      warnings: getConnectionWarnings(platforms, connectedPlatforms),
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

function getConnectionWarnings(desired: string[], connected: string[]): string[] {
  const warnings: string[] = [];
  for (const platform of desired) {
    if (!connected.includes(platform)) {
      warnings.push(
        `${platform} is not connected on upload-post.com. Connect it at https://app.upload-post.com/manage-users`
      );
    }
  }
  return warnings;
}
