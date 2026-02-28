import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

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
    const { name, username, api_key, color, platforms } = body;

    if (!name || !username || !api_key || !platforms?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [account] = await db.insert(accounts).values({
      name,
      username,
      api_key,
      color: color || '#6366f1',
      platforms,
    }).returning();

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('POST /api/accounts error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
