import { NextResponse } from 'next/server';
import { importSingleNotionPage } from '@/lib/sync/notionSync';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, overrides } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const result = await importSingleNotionPage(pageId, overrides || {});

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Import Notion page error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
