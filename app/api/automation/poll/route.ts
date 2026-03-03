import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automationRules, accounts, posts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { checkForNewReels, extractReelId, downloadReel, cleanupVideo } from '@/lib/instagram-poller';
import { generateCaptions } from '@/lib/captions';
import { uploadVideo } from '@/lib/uploadpost';

// Called by the external cron poller every 15 minutes
export async function POST() {
  const startTime = Date.now();

  try {
    const enabledRules = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.enabled, true));

    if (enabledRules.length === 0) {
      return NextResponse.json({ message: 'No enabled rules', processed: 0 });
    }

    const summary: {
      rule_id: number;
      account: string;
      new_reels: number;
      posted: number;
      failed: number;
    }[] = [];

    for (const rule of enabledRules) {
      const [account] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, rule.account_id));

      if (!account) continue;

      const uploadPostUser = account.upload_post_username || account.username;

      let newReels;
      try {
        newReels = await checkForNewReels(
          account.api_key,
          uploadPostUser,
          rule.last_reel_id
        );
      } catch (err) {
        console.error(`Poller: failed to check reels for rule ${rule.id}`, err);
        continue;
      }

      // Always update last_checked_at
      await db
        .update(automationRules)
        .set({ last_checked_at: new Date().toISOString() })
        .where(eq(automationRules.id, rule.id));

      if (newReels.length === 0) {
        summary.push({ rule_id: rule.id, account: account.name, new_reels: 0, posted: 0, failed: 0 });
        continue;
      }

      let posted = 0;
      let failed = 0;
      const targetPlatforms = rule.target_platforms as string[];

      for (const reel of newReels) {
        let videoPath: string | undefined;
        
        try {
          // Download the reel
          videoPath = await downloadReel(reel.url);
          
          const captionText = reel.caption || '';
          const captions = await generateCaptions(captionText, captionText, { videoPath });

          let requestId: string | undefined;
          let uploadStatus = 'pending';

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
            if (uploadResult.success) posted++;
            else failed++;
          } catch (uploadErr) {
            console.error(`Poller: upload failed for reel ${reel.id}`, uploadErr);
            uploadStatus = 'failed';
            failed++;
          }

          await db.insert(posts).values({
            account_id: account.id,
            request_id: requestId,
            title: captions.youtube_title || captionText,
            base_caption: captionText,
            platforms: targetPlatforms,
            status: uploadStatus,
            posted_at: uploadStatus === 'posted' ? new Date().toISOString() : undefined,
            automation_rule_id: rule.id,
            source_url: reel.url,
          });

          const reelId = extractReelId(reel.url) || reel.id;
          await db
            .update(automationRules)
            .set({ last_reel_id: reelId })
            .where(eq(automationRules.id, rule.id));
        } catch (err) {
          console.error(`Poller: error processing reel ${reel.id}`, err);
          failed++;
        } finally {
          if (videoPath) {
            cleanupVideo(videoPath);
          }
        }
      }

      summary.push({
        rule_id: rule.id,
        account: account.name,
        new_reels: newReels.length,
        posted,
        failed,
      });
    }

    const elapsed = Date.now() - startTime;
    return NextResponse.json({ processed: enabledRules.length, summary, elapsed_ms: elapsed });
  } catch (error) {
    console.error('POST /api/automation/poll error:', error);
    return NextResponse.json({ error: 'Poll failed' }, { status: 500 });
  }
}
