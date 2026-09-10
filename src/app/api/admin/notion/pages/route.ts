import { NextResponse } from 'next/server';
import { listNotionPages } from '@/lib/sync/notionSync';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await listNotionPages();

    // Check which pages are already in Supabase
    const { data: existing } = await supabase
      .from('writeups')
      .select('slug, title, notion_page_id, is_pro_lab');

    const existingMap = new Map();
    (existing || []).forEach((w: any) => {
      if (w.notion_page_id) existingMap.set(w.notion_page_id, w);
    });

    const enriched = pages.map((p) => {
      const match = existingMap.get(p.id);
      return {
        ...p,
        alreadySynced: Boolean(match),
        syncedSlug: match?.slug || null,
        isProLab: match?.is_pro_lab || false,
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
