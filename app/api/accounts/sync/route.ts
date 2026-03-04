import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { verifyApiKey, listProfiles } from '@/lib/uploadpost';
import { eq } from 'drizzle-orm';

const PRESET_COLORS = ['#a78bfa', '#34d399', '#60a5fa', '#f59e0b', '#ec4899', '#6366f1'];

/**
 * POST /api/accounts/sync
 * Body: { api_key: string }
 *
 * Verifies the API key, fetches all Upload-Post profiles,
 * and auto-creates/updates local accounts for each connected profile.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { api_key } = body;

        if (!api_key) {
            return NextResponse.json({ error: 'API key is required' }, { status: 400 });
        }

        // 1 ─ Verify API key
        let verification;
        try {
            verification = await verifyApiKey(api_key);
            if (!verification.success) {
                return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
            }
        } catch {
            return NextResponse.json(
                { error: 'Could not verify API key — check your upload-post.com API key' },
                { status: 400 }
            );
        }

        // 2 ─ Fetch all profiles + their connected social accounts
        let profilesResp;
        try {
            profilesResp = await listProfiles(api_key);
        } catch {
            return NextResponse.json(
                { error: 'Could not fetch profiles from Upload-Post' },
                { status: 502 }
            );
        }

        if (!profilesResp.success || !profilesResp.profiles?.length) {
            return NextResponse.json({
                error: 'No profiles found on Upload-Post. Add a profile at upload-post.com first.',
            }, { status: 404 });
        }

        // 3 ─ For each profile, upsert into local DB
        const results: {
            profile: string;
            action: 'created' | 'updated' | 'skipped';
            platforms: string[];
        }[] = [];

        for (let i = 0; i < profilesResp.profiles.length; i++) {
            const profile = profilesResp.profiles[i];
            const connectedPlatforms: string[] = [];

            for (const [platform, account] of Object.entries(profile.social_accounts)) {
                if (typeof account === 'object' && account && account.handle) {
                    connectedPlatforms.push(platform);
                }
            }

            // Check if this profile already exists locally
            const existing = await db.select().from(accounts)
                .where(eq(accounts.upload_post_username, profile.username));

            if (existing.length > 0) {
                // Update platforms + connected_platforms
                await db.update(accounts)
                    .set({
                        platforms: connectedPlatforms,
                        connected_platforms: connectedPlatforms,
                        api_key,
                    })
                    .where(eq(accounts.upload_post_username, profile.username));

                results.push({ profile: profile.username, action: 'updated', platforms: connectedPlatforms });
            } else {
                // Create new account
                await db.insert(accounts).values({
                    name: profile.username,
                    username: profile.username,
                    api_key,
                    upload_post_username: profile.username,
                    color: PRESET_COLORS[i % PRESET_COLORS.length],
                    platforms: connectedPlatforms,
                    connected_platforms: connectedPlatforms,
                });

                results.push({ profile: profile.username, action: 'created', platforms: connectedPlatforms });
            }
        }

        return NextResponse.json({
            success: true,
            email: verification.email,
            plan: verification.plan,
            synced: results,
        });
    } catch (error) {
        console.error('POST /api/accounts/sync error:', error);
        return NextResponse.json({ error: 'Failed to sync accounts' }, { status: 500 });
    }
}
