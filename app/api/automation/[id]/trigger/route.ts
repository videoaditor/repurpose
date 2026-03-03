import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automationRules, accounts, posts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { checkForNewReels, extractReelId, downloadReel, cleanupVideo } from '@/lib/instagram-poller';
import { generateCaptions } from '@/lib/captions';
import { uploadVideo } from '@/lib/uploadpost';

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

    const uploadPostUser = account.upload_post_username || account.username;

    // Check for new reels using correct API
    const newReels = await checkForNewReels(
      account.api_key,
      uploadPostUser,
      rule.last_reel_id,
      manualReelUrl
    );

    if (newReels.length === 0) {
      await db
        .update(automationRules)
        .set({ last_checked_at: new Date().toISOString() })
        .where(eq(automationRules.id, rule.id));

      return NextResponse.json({ processed: 0, message: 'No new reels found' });
    }

    const processed: { reel_id: string; post_id: number; status: string; error?: string }[] = [];
    const targetPlatforms = rule.target_platforms as string[];

    for (const reel of newReels) {
      let videoPath: string | undefined;
      
      try {
        // 1. Download the reel video via yt-dlp
        console.log(`Downloading reel: ${reel.url}`);
        videoPath = await downloadReel(reel.url);
        console.log(`Downloaded to: ${videoPath}`);
        
        // Verify file exists and log size
        const fs = await import('fs');
        const exists = fs.existsSync(videoPath);
        console.log(`File exists: ${exists}`);
        if (exists) {
          const stats = fs.statSync(videoPath);
          console.log(`File size: ${stats.size} bytes`);
        }

        // 2. Transcribe + generate captions from actual video content
        const captionText = reel.caption || '';
        const captions = await generateCaptions(captionText, captionText, { videoPath });

        // 3. Upload video file via upload-post.com
        let requestId: string | undefined;
        let uploadStatus = 'pending';
        let uploadError: string | undefined;

        try {
          const uploadResult = await uploadVideo(account.api_key, {
            user: uploadPostUser,
            videoPath,
            platforms: targetPlatforms,
            title: captions.youtube_title || captionText,
            description: captions.youtube_desc,
            tiktok_title: captions.tiktok,
            youtube_title: captions.youtube_title,
            youtube_description: captions.youtube_desc,
            async_upload: true,
          });

          requestId = uploadResult.request_id;
          uploadStatus = uploadResult.success ? 'posted' : 'failed';
          if (!uploadResult.success) {
            uploadError = uploadResult.message || 'Upload failed';
          }
        } catch (err) {
          console.error('Upload failed for reel', reel.id, err);
          uploadStatus = 'failed';
          uploadError = err instanceof Error ? err.message : 'Upload failed';
        }

        // 4. Save to posts table
        const [savedPost] = await db
          .insert(posts)
          .values({
            account_id: account.id,
            request_id: requestId,
            title: captions.youtube_title || captionText,
            base_caption: captionText,
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
          error: uploadError,
        });

        // 5. Update rule's last_reel_id
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
        processed.push({
          reel_id: reel.id,
          post_id: -1,
          status: 'error',
          error: err instanceof Error ? err.message : 'Processing error',
        });
      } finally {
        // Clean up downloaded video
        if (videoPath) {
          cleanupVideo(videoPath);
        }
      }
    }

    return NextResponse.json({ processed: processed.length, results: processed });
  } catch (error) {
    console.error('POST /api/automation/[id]/trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger automation' }, { status: 500 });
  }
}
