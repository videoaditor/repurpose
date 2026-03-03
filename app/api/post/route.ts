import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, posts, captions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { uploadVideo } from '@/lib/uploadpost';
import { downloadReel, cleanupVideo, extractReelId } from '@/lib/instagram-poller';

export async function POST(request: Request) {
  let videoPath: string | undefined;
  
  try {
    const body = await request.json();
    const { accountId, platforms, videoUrl, title, captionData, baseCaption } = body;

    if (!accountId || !platforms?.length || !videoUrl || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get account
    const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const uploadPostUser = account.upload_post_username || account.username;

    // Check if this is an Instagram URL that needs downloading
    const isInstagramUrl = videoUrl.includes('instagram.com');
    
    if (isInstagramUrl) {
      // Download the video first
      console.log(`Downloading video from: ${videoUrl}`);
      videoPath = await downloadReel(videoUrl);
      console.log(`Downloaded to: ${videoPath}`);
    } else {
      // For direct video URLs, we'd need different handling
      // For now, only support IG URLs
      return NextResponse.json({ 
        error: 'Only Instagram URLs are supported. Paste an Instagram reel URL.' 
      }, { status: 400 });
    }

    // Upload via upload-post.com
    let requestId: string | undefined;
    let postStatus = 'pending';

    try {
      const result = await uploadVideo(account.api_key, {
        user: uploadPostUser,
        videoPath,
        platforms,
        title,
        description: captionData?.youtube_desc,
        tiktok_title: captionData?.tiktok,
        youtube_title: captionData?.youtube_title,
        youtube_description: captionData?.youtube_desc,
        async_upload: true,
      });
      requestId = result.request_id;
      postStatus = result.success ? 'posted' : 'failed';
    } catch (uploadError) {
      console.error('Upload-post API error:', uploadError);
      postStatus = 'failed';
    }

    // Save post to DB
    const [post] = await db.insert(posts).values({
      account_id: accountId,
      request_id: requestId,
      title,
      base_caption: baseCaption,
      platforms,
      status: postStatus,
      posted_at: postStatus === 'posted' ? new Date().toISOString() : null,
      source_url: videoUrl,
    }).returning();

    // Save captions
    if (captionData && post) {
      const captionEntries = Object.entries(captionData).map(([platform, caption]) => ({
        post_id: post.id,
        platform,
        caption: caption as string,
        used: platforms.some((p: string) =>
          p.toLowerCase().includes(platform.replace('_title', '').replace('_desc', ''))
        ),
      }));

      if (captionEntries.length > 0) {
        await db.insert(captions).values(captionEntries);
      }
    }

    return NextResponse.json({
      success: postStatus === 'posted',
      postId: post.id,
      requestId,
      status: postStatus,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  } finally {
    // Clean up downloaded video
    if (videoPath) {
      cleanupVideo(videoPath);
    }
  }
}
