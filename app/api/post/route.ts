import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts, posts, captions } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { postVideo } from '@/lib/uploadpost';

export async function POST(request: Request) {
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

    // Call upload-post API
    let requestId: string | undefined;
    let postStatus = 'pending';

    try {
      const result = await postVideo(account.api_key, {
        video_url: videoUrl,
        title,
        platforms,
        tiktok_caption: captionData?.tiktok,
        youtube_title: captionData?.youtube_title,
        youtube_description: captionData?.youtube_desc,
        instagram_caption: captionData?.instagram,
        twitter_caption: captionData?.x,
        linkedin_caption: captionData?.linkedin,
      });
      requestId = result.request_id;
      postStatus = 'posted';
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
      success: true,
      postId: post.id,
      requestId,
      status: postStatus,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
