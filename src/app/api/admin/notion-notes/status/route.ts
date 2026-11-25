import { NextResponse } from 'next/server';
import { getNotesNotionStatus } from '@/lib/sync/notionNotesSync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_PASSWORD || 'nulbyt3-root';
    if (authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customToken = request.headers.get('x-notion-notes-key');
    const status = await getNotesNotionStatus(customToken);

    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, error: err.message || 'Status check failed' },
      { status: 500 }
    );
  }
}
