import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getAnalytics, getPostAnalytics } from '@/lib/uploadpost';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const requestId = searchParams.get('requestId');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, parseInt(accountId)));
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (requestId) {
      const data = await getPostAnalytics(account.api_key, requestId);
      return NextResponse.json(data);
    }

    const data = await getAnalytics(account.api_key, account.username, account.platforms as string[]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
