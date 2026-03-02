import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automationRules, accounts, posts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { checkForNewReels, extractReelId } from '@/lib/instagram-poller';
import { generateCaptions } from '@/lib/captions';
import { postVideo } from '@/lib/uploadpost';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const manualReelUrl: string | undefined = body.reel_url;

    const [rule] = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.id, Number(id)));

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, rule.account_id));

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check for new reels
    const newReels = await checkForNewReels(account, rule, manualReelUrl);

    if (newReels.length === 0) {
      // Update last_checked_at
      await db
        .update(automationRules)
        .set({ last_checked_at: new Date().toISOString() })
        .where(eq(automationRules.id, rule.id));

      return NextResponse.json({ processed: 0, message: 'No new reels found' });
    }

    const processed: { reel_id: string; post_id: number; status: string }[] = [];

    for (const reel of newReels) {
      try {
        // Generate captions
        const caption = reel.caption || `New Instagram Reel`;
        const captions = await generateCaptions(caption, caption);

        const targetPlatforms = rule.target_platforms as string[];

        // Build postVideo params
        const uploadParams = {
          video_url: reel.url,
          title: captions.youtube_title || caption,
          description: captions.youtube_desc,
          platforms: targetPlatforms,
          tiktok_caption: captions.tiktok,
          youtube_title: captions.youtube_title,
          youtube_description: captions.youtube_desc,
        };

        let requestId: string | undefined;
        let uploadStatus = 'pending';

        try {
          const uploadResult = await postVideo(account.api_key, uploadParams);
          requestId = uploadResult.request_id;
          uploadStatus = 'posted';
        } catch (uploadErr) {
          console.error('Upload failed for reel', reel.id, uploadErr);
          uploadStatus = 'failed';
        }

        // Save to posts table
        const [savedPost] = await db
          .insert(posts)
          .values({
            account_id: account.id,
            request_id: requestId,
            title: captions.youtube_title || caption,
            base_caption: caption,
            platforms: targetPlatforms,
            status: uploadStatus,
            posted_at: uploadStatus === 'posted' ? new Date().toISOString() : undefined,
            automation_rule_id: rule.id,
            source_url: reel.url,
          })
          .returning();

        processed.push({
          reel_id: reel.id,
          post_id: savedPost.id,
          status: uploadStatus,
        });

        // Update rule's last_reel_id to this reel
        const reelId = manualReelUrl ? extractReelId(reel.url) : reel.id;
        await db
          .update(automationRules)
          .set({
            last_reel_id: reelId,
            last_checked_at: new Date().toISOString(),
          })
          .where(eq(automationRules.id, rule.id));
      } catch (err) {
        console.error('Error processing reel', reel.id, err);
        processed.push({ reel_id: reel.id, post_id: -1, status: 'error' });
      }
    }

    return NextResponse.json({ processed: processed.length, results: processed });
  } catch (error) {
    console.error('POST /api/automation/[id]/trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger automation' }, { status: 500 });
  }
}
