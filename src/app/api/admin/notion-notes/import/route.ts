import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { importSingleNotionNotePage } from '@/lib/sync/notionNotesSync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, overrides, notionNotesApiKey } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const customNotionToken =
      request.headers.get('x-notion-notes-key') || notionNotesApiKey || null;

    const result = await importSingleNotionNotePage(pageId, overrides || {}, customNotionToken);

    try {
      revalidatePath('/til');
      revalidatePath('/til/vault');
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Import Notion note error:', err);
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
