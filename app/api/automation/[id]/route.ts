import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { automationRules } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Partial<typeof automationRules.$inferInsert> = {};
    if (typeof body.enabled === 'boolean') updates.enabled = body.enabled;
    if (body.last_checked_at) updates.last_checked_at = body.last_checked_at;
    if (body.last_reel_id) updates.last_reel_id = body.last_reel_id;
    if (body.target_platforms) updates.target_platforms = body.target_platforms;

    const [updated] = await db
      .update(automationRules)
      .set(updates)
      .where(eq(automationRules.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/automation/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(automationRules).where(eq(automationRules.id, Number(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/automation/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
