import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accounts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    await db.delete(accounts).where(eq(accounts.id, accountId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/accounts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
