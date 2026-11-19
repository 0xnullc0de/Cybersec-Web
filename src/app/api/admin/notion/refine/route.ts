import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { parseNotionBlocksToRaw, refineWriteupContent } from '@/lib/sync/aiRefiner';

function getNotionToken(): string | null {
  if (process.env.NOTION_API_KEY && process.env.NOTION_API_KEY.trim()) {
    return process.env.NOTION_API_KEY.trim();
  }
  return null;
}

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
    const { pageId, geminiApiKey, pageTitle } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const token = getNotionToken();
    if (!token) {
      return NextResponse.json({ error: 'NOTION_API_KEY is not configured in .env.local' }, { status: 500 });
    }

    const notion = new Client({ auth: token });

    // 1. Fetch raw blocks from Notion
    const rawMarkdown = await parseNotionBlocksToRaw(notion, pageId);

    // Resolve machine title if not passed
    let resolvedTitle = pageTitle?.trim();
    if (!resolvedTitle) {
      try {
        const page: any = await notion.pages.retrieve({ page_id: pageId });
        const titleProp = page.properties?.title || page.properties?.Name;
        if (titleProp?.title?.[0]?.plain_text) {
          resolvedTitle = titleProp.title[0].plain_text.trim();
        }
      } catch (e) {}
    }

    // 2. Refine using Gemini with resolved title
    const result = await refineWriteupContent(rawMarkdown, {
      customApiKey: geminiApiKey,
      pageTitle: resolvedTitle,
    });

    return NextResponse.json({
      success: true,
      pageId,
      rawMarkdown,
      refinedMarkdown: result.refinedMarkdown,
      metadata: result.metadata,
    });
  } catch (err: any) {
    console.error('Notion AI refine API error:', err);
    return NextResponse.json({ error: err.message || 'AI refinement failed' }, { status: 500 });
  }
}
