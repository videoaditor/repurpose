import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  getProfileAnalytics,
  getPostAnalytics,
  getTotalImpressions,
  normalizeAnalytics,
} from '@/lib/uploadpost';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const requestId = searchParams.get('requestId');
    const type = searchParams.get('type');
    const platformsParam = searchParams.get('platforms');

    if (!accountId) {
      return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
    }

    const [account] = await db.select().from(accounts).where(eq(accounts.id, parseInt(accountId)));
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Return post-level analytics by request ID
    if (requestId) {
      const data = await getPostAnalytics(account.api_key, requestId);
      return NextResponse.json(data);
    }

    // Return total impressions only
    if (type === 'total-impressions') {
      const data = await getTotalImpressions(account.api_key, account.username);
      return NextResponse.json(data);
    }

    // Determine which platforms to fetch
    const accountPlatforms = account.platforms as string[];
    let platforms: string[];
    if (!platformsParam || platformsParam === 'all') {
      platforms = accountPlatforms;
    } else {
      platforms = platformsParam.split(',').map((p) => p.trim()).filter(Boolean);
    }

    // Fetch profile analytics
    const raw = await getProfileAnalytics(account.api_key, account.username, platforms);

    // Optionally fetch total impressions in parallel
    let totalImpressions = 0;
    try {
      const imp = await getTotalImpressions(account.api_key, account.username);
      totalImpressions = imp.total_impressions ?? 0;
    } catch {
      // non-critical — continue without it
    }

    const normalized = normalizeAnalytics(raw, totalImpressions);
    return NextResponse.json(normalized);
  } catch (error) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
