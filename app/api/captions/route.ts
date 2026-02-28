import { NextResponse } from 'next/server';
import { generateCaptions } from '@/lib/captions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const captions = await generateCaptions(title, description || '');
    return NextResponse.json(captions);
  } catch (error) {
    console.error('POST /api/captions error:', error);
    return NextResponse.json({ error: 'Failed to generate captions' }, { status: 500 });
  }
}
