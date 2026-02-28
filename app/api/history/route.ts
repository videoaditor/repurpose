import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const query = db.select().from(posts).orderBy(desc(posts.created_at));

    let result;
    if (accountId) {
      result = await db
        .select()
        .from(posts)
        .where(eq(posts.account_id, parseInt(accountId)))
        .orderBy(desc(posts.created_at));
    } else {
      result = await query;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
