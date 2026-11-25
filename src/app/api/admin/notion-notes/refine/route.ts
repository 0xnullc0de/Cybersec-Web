import { NextResponse } from 'next/server';
import { fetchRawNotionNoteMarkdown } from '@/lib/sync/notionNotesSync';
import { refineNoteContent } from '@/lib/sync/aiRefiner';

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
    const { pageId, geminiApiKey, pageTitle, customInstructions, notionNotesApiKey, notionToken } = body;

    if (!pageId) {
      return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
    }

    const customNotionToken =
      request.headers.get('x-notion-notes-key') ||
      notionNotesApiKey ||
      notionToken ||
      null;

    // 1. Fetch raw Notion blocks (images, GIFs, embeds, code blocks preserved)
    const { rawMarkdown, resolvedTitle } = await fetchRawNotionNoteMarkdown(
      pageId,
      customNotionToken
    );

    const finalTitle = pageTitle?.trim() || resolvedTitle || 'Offensive Technique Note';

    // 2. Refine using Gemini Notes Refiner (enjoyable + full technical rigor)
    const result = await refineNoteContent(rawMarkdown, {
      customApiKey: geminiApiKey,
      pageTitle: finalTitle,
      customInstructions:
        typeof customInstructions === 'string' ? customInstructions.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      pageId,
      rawMarkdown,
      refinedMarkdown: result.refinedMarkdown,
      metadata: result.metadata,
    });
  } catch (err: any) {
    console.error('Notion Notes AI refine API error:', err);
    return NextResponse.json({ error: err.message || 'AI note refinement failed' }, { status: 500 });
  }
}
