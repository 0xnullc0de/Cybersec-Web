import { NextRequest, NextResponse } from 'next/server';
import { syncNotionToWriteups } from '@/lib/sync/notionSync';

export async function POST(request: NextRequest) {
  try {
    const stats = await syncNotionToWriteups();
    return NextResponse.json(stats, { status: stats.success ? 200 : 207 });
  } catch (err: any) {
    console.error('API /api/sync/notion error:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Fatal error during Notion sync',
        errors: [err.message],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/sync/notion',
    description: 'POST to trigger Notion-to-Supabase synchronization',
  });
}
