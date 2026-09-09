import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

function getNotionToken(): string | null {
  if (process.env.NOTION_API_KEY && process.env.NOTION_API_KEY.trim()) {
    return process.env.NOTION_API_KEY.trim();
  }
  try {
    const tokenPath = path.join(process.cwd(), 'notion-token');
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf-8').trim();
    }
  } catch (e) {}
  return null;
}

export async function GET() {
  const token = getNotionToken();

  if (!token) {
    return NextResponse.json({
      connected: false,
      error: 'No Notion token found. Check .env.local or notion-token file.',
    }, { status: 400 });
  }

  try {
    const notion = new Client({ auth: token });
    const me = await notion.users.me({});

    const searchRes = await notion.search({
      page_size: 20,
    });

    const items = searchRes.results.map((r: any) => {
      let title = 'Untitled';
      if (r.properties?.title?.title) {
        title = r.properties.title.title.map((t: any) => t.plain_text).join('');
      } else if (r.properties?.Name?.title) {
        title = r.properties.Name.title.map((t: any) => t.plain_text).join('');
      } else if (r.title) {
        title = r.title.map((t: any) => t.plain_text).join('');
      }

      return {
        id: r.id,
        object: r.object,
        title: title || 'Untitled',
        url: r.url,
      };
    });

    return NextResponse.json({
      connected: true,
      bot: (me as any).name || 'Integration Bot',
      workspace: (me as any).bot?.workspace_name || 'Notion Workspace',
      connectedItemsCount: items.length,
      items,
      instruction: items.length === 0
        ? "Connected to Notion, but no pages are shared yet. In Notion, open your writeup page/database, click '...' -> 'Connections' -> select '" + ((me as any).name || 'website') + "'."
        : "Found " + items.length + " connected pages/databases ready for synchronization.",
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      error: err.message,
    }, { status: 500 });
  }
}
