import { NextResponse } from 'next/server';
import { listNotionNotesPages } from '@/lib/sync/notionNotesSync';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customToken = request.headers.get('x-notion-notes-key');
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    let pages: any[] = [];
    if (target) {
      const { fetchSingleNotionNote } = await import('@/lib/sync/notionNotesSync');
      const single = await fetchSingleNotionNote(target, customToken);
      pages = [single];
    } else {
      pages = await listNotionNotesPages(customToken);
    }

    const client = supabaseAdmin || supabase;
    const { data: existing } = await client
      .from('til_notes')
      .select('slug, title, notion_page_id, is_locked');

    const byNotionId = new Map<string, any>();
    const byTitle = new Map<string, any>();

    (existing || []).forEach((n: any) => {
      if (n.notion_page_id) byNotionId.set(n.notion_page_id, n);
      if (n.title) byTitle.set(n.title.toLowerCase().trim(), n);
    });

    const enriched = pages.map((p) => {
      const match = byNotionId.get(p.id) || byTitle.get(p.title.toLowerCase().trim());
      return {
        ...p,
        alreadySynced: Boolean(match),
        syncedSlug: match?.slug || null,
        isLocked: match ? Boolean(match.is_locked) : Boolean(p.suggestedLocked),
      };
    });

    return NextResponse.json({
      pages: enriched,
      count: enriched.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
