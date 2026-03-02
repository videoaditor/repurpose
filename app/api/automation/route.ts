import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automationRules, accounts } from '@/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const rules = await db
      .select({
        rule: automationRules,
        account: accounts,
      })
      .from(automationRules)
      .leftJoin(accounts, eq(automationRules.account_id, accounts.id))
      .orderBy(desc(automationRules.created_at));

    return NextResponse.json(rules);
  } catch (error) {
    console.error('GET /api/automation error:', error);
    return NextResponse.json({ error: 'Failed to fetch automation rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { account_id, target_platforms, enabled } = body;

    if (!account_id || !target_platforms?.length) {
      return NextResponse.json({ error: 'account_id and target_platforms are required' }, { status: 400 });
    }

    const [rule] = await db
      .insert(automationRules)
      .values({
        account_id: Number(account_id),
        target_platforms,
        source_platform: 'instagram',
        enabled: enabled ?? true,
      })
      .returning();

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('POST /api/automation error:', error);
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 });
  }
}
