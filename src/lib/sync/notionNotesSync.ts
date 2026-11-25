import { Client } from '@notionhq/client';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import {
  isGifOrMediaUrl,
  normalizeGifUrl,
  parseNotionBlocksToRaw,
  richTextToMarkdown,
} from './aiRefiner';

function getPlainText(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((t) => t.plain_text || '').join('');
}

/**
 * Resolves the Notion integration token specifically for the Notes workspace.
 * Intentionally kept separate from NOTION_API_KEY so Writeups and Notes workspaces stay isolated.
 */
export function getNotesNotionToken(customToken?: string | null): string | null {
  if (customToken && customToken.trim()) {
    return customToken.trim();
  }
  if (process.env.NOTION_NOTES_API_KEY && process.env.NOTION_NOTES_API_KEY.trim()) {
    return process.env.NOTION_NOTES_API_KEY.trim();
  }

  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^(?:export\s+)?NOTION_NOTES_API_KEY\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
      if (match && match[1]?.trim()) {
        process.env.NOTION_NOTES_API_KEY = match[1].trim();
        return match[1].trim();
      }
    }
  } catch (_) {}

  try {
    const tokenPath = path.join(process.cwd(), 'notion-notes-token');
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf-8').trim();
    }
  } catch (_) {}

  return null;
}

/**
 * Checks whether a URL is an expiring Notion-hosted S3 URL that must be rehosted.
 */
function isExpiringNotionMediaUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('amazonaws.com') ||
    lower.includes('notion-static.com') ||
    lower.includes('x-amz-signature') ||
    lower.includes('prod-files-secure')
  );
}

/**
 * Downloads an image or animated GIF from Notion's temporary S3 URL
 * and permanently uploads it to Supabase Storage bucket 'writeup-images' under 'notes/{slug}/'.
 */
export async function rehostNoteMedia(
  notionMediaUrl: string,
  slug: string,
  uniqueId: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for media uploads');
  }

  try {
    const res = await fetch(notionMediaUrl);
    if (!res.ok) {
      console.warn(`Failed to download note media from Notion: ${res.status}`);
      return null;
    }

    const rawContentType = (res.headers.get('content-type') || '').toLowerCase();
    const urlPathLower = notionMediaUrl.split('?')[0].toLowerCase();
    const buffer = Buffer.from(await res.arrayBuffer());

    let ext = 'png';
    let contentType = rawContentType || 'image/png';

    if (rawContentType.includes('gif') || urlPathLower.endsWith('.gif')) {
      ext = 'gif';
      contentType = 'image/gif';
    } else if (rawContentType.includes('jpeg') || rawContentType.includes('jpg') || urlPathLower.endsWith('.jpg') || urlPathLower.endsWith('.jpeg')) {
      ext = 'jpg';
      contentType = 'image/jpeg';
    } else if (rawContentType.includes('webp') || urlPathLower.endsWith('.webp')) {
      ext = 'webp';
      contentType = 'image/webp';
    } else if (rawContentType.includes('svg') || urlPathLower.endsWith('.svg')) {
      ext = 'svg';
      contentType = 'image/svg+xml';
    }

    const storagePath = `notes/${slug}/${uniqueId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('writeup-images')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase note media upload error:', uploadError.message);
      return null;
    }

    const { data: publicData } = supabaseAdmin.storage
      .from('writeup-images')
      .getPublicUrl(storagePath);

    return publicData.publicUrl;
  } catch (err: any) {
    console.error('rehostNoteMedia error:', err.message);
    return null;
  }
}

/**
 * Converts Notion blocks directly into permanent Markdown (rehosting Notion S3 images/GIFs
 * while keeping permanent external GIFs intact). Used when importing without AI edits.
 */
async function parseNotionNoteBlocksWithRehost(
  notion: Client,
  blockId: string,
  slug: string,
  rehostedMedia: string[]
): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const res: any = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of res.results as any[]) {
      switch (block.type) {
        case 'heading_1':
          lines.push(`\n# ${getPlainText(block.heading_1.rich_text)}\n`);
          break;
        case 'heading_2':
          lines.push(`\n## ${getPlainText(block.heading_2.rich_text)}\n`);
          break;
        case 'heading_3':
          lines.push(`\n### ${getPlainText(block.heading_3.rich_text)}\n`);
          break;
        case 'paragraph': {
          const text = richTextToMarkdown(block.paragraph.rich_text);
          if (text) {
            const trimmed = text.trim();
            if (/^https?:\/\/\S+$/i.test(trimmed) && isGifOrMediaUrl(trimmed)) {
              const normalized = normalizeGifUrl(trimmed);
              rehostedMedia.push(normalized);
              lines.push(`\n![Animated GIF](${normalized})\n`);
            } else {
              lines.push(text);
            }
          }
          break;
        }
        case 'bulleted_list_item': {
          lines.push(`- ${richTextToMarkdown(block.bulleted_list_item.rich_text)}`);
          if (block.has_children) {
            const nested = await parseNotionNoteBlocksWithRehost(notion, block.id, slug, rehostedMedia);
            if (nested) lines.push(nested);
          }
          break;
        }
        case 'numbered_list_item': {
          lines.push(`1. ${richTextToMarkdown(block.numbered_list_item.rich_text)}`);
          if (block.has_children) {
            const nested = await parseNotionNoteBlocksWithRehost(notion, block.id, slug, rehostedMedia);
            if (nested) lines.push(nested);
          }
          break;
        }
        case 'to_do': {
          const checked = Boolean(block.to_do?.checked);
          lines.push(`- [${checked ? 'x' : ' '}] ${richTextToMarkdown(block.to_do?.rich_text)}`);
          break;
        }
        case 'callout': {
          const calloutText = richTextToMarkdown(block.callout?.rich_text);
          const icon = block.callout?.icon?.emoji || '💡';
          lines.push(`\n> ${icon} **Note:** ${calloutText}\n`);
          if (block.has_children) {
            const nested = await parseNotionNoteBlocksWithRehost(notion, block.id, slug, rehostedMedia);
            if (nested) lines.push(nested);
          }
          break;
        }
        case 'quote':
          lines.push(`> ${richTextToMarkdown(block.quote.rich_text)}`);
          break;
        case 'toggle': {
          const toggleTitle = richTextToMarkdown(block.toggle?.rich_text);
          if (toggleTitle) lines.push(`\n**${toggleTitle}**\n`);
          if (block.has_children) {
            const nested = await parseNotionNoteBlocksWithRehost(notion, block.id, slug, rehostedMedia);
            if (nested) lines.push(nested);
          }
          break;
        }
        case 'code': {
          const code = getPlainText(block.code.rich_text);
          const lang = block.code.language || 'bash';
          lines.push(`\n\`\`\`${lang}:command\n${code}\n\`\`\`\n`);
          break;
        }
        case 'image': {
          const isExternal = Boolean(block.image.external?.url);
          const rawUrl = block.image.file?.url || block.image.external?.url;
          if (rawUrl) {
            let finalUrl = isExternal ? normalizeGifUrl(rawUrl) : rawUrl;
            if (!isExternal || isExpiringNotionMediaUrl(rawUrl)) {
              const permUrl = await rehostNoteMedia(rawUrl, slug, block.id);
              if (permUrl) finalUrl = permUrl;
            }
            const rawCaption = getPlainText(block.image.caption);
            const isGif = finalUrl.toLowerCase().includes('.gif') || finalUrl.includes('giphy.com');
            const caption = rawCaption || (isGif ? 'Animated GIF' : 'Note Visual');
            rehostedMedia.push(finalUrl);
            lines.push(`\n![${caption}](${finalUrl})\n`);
          }
          break;
        }
        case 'embed':
        case 'bookmark': {
          const rawUrl = block[block.type]?.url;
          if (rawUrl) {
            if (isGifOrMediaUrl(rawUrl)) {
              const normalized = normalizeGifUrl(rawUrl);
              const caption = getPlainText(block[block.type]?.caption) || 'Animated GIF';
              rehostedMedia.push(normalized);
              lines.push(`\n![${caption}](${normalized})\n`);
            } else {
              const caption = getPlainText(block[block.type]?.caption) || rawUrl;
              lines.push(`[${caption}](${rawUrl})`);
            }
          }
          break;
        }
        case 'video': {
          const vidUrl = block.video?.external?.url || block.video?.file?.url;
          if (vidUrl && isGifOrMediaUrl(vidUrl)) {
            const normalized = normalizeGifUrl(vidUrl);
            rehostedMedia.push(normalized);
            lines.push(`\n![Animated GIF](${normalized})\n`);
          } else if (vidUrl) {
            lines.push(`[Video Reference](${vidUrl})`);
          }
          break;
        }
        case 'table_row': {
          const cells = (block.table_row?.cells || []).map((cell: any[]) => richTextToMarkdown(cell));
          if (cells.length > 0) lines.push(`| ${cells.join(' | ')} |`);
          break;
        }
        case 'divider':
          lines.push('\n---\n');
          break;
        case 'child_page':
        case 'child_database':
          break;
        default:
          if (block.has_children) {
            const nested = await parseNotionNoteBlocksWithRehost(notion, block.id, slug, rehostedMedia);
            if (nested) lines.push(nested);
          }
          break;
      }
    }

    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return lines.join('\n\n');
}

function extractPageTitle(page: any): string {
  const props = page.properties || {};
  for (const key of Object.keys(props)) {
    if (props[key]?.type === 'title' && Array.isArray(props[key].title)) {
      const t = getPlainText(props[key].title).trim();
      if (t) return t;
    }
  }
  if (page.title) {
    const t = getPlainText(page.title).trim();
    if (t) return t;
  }
  return 'Untitled Note';
}

export async function getNotesNotionStatus(customToken?: string | null) {
  const token = getNotesNotionToken(customToken);
  if (!token) {
    return {
      connected: false,
      missingToken: true,
      error: 'No Notes Notion integration token set. Paste your Notes workspace token below or set NOTION_NOTES_API_KEY in environment variables.',
    };
  }

  try {
    const notion = new Client({ auth: token });
    const me: any = await notion.users.me({});
    const searchRes: any = await notion.search({ page_size: 20 });

    return {
      connected: true,
      bot: me.name || 'Notes Integration Bot',
      workspace: me.bot?.workspace_name || 'Notes Notion Workspace',
      connectedItemsCount: searchRes.results?.length || 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Failed to connect to Notes Notion workspace',
    };
  }
}

export function extractNotionIdFromUrlOrString(input: string): string {
  const clean = input.trim();
  // Match standard 32-character Notion page id (with or without dashes)
  const match = clean.match(/([a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (match) {
    return match[1].replace(/-/g, '');
  }
  return clean;
}

export async function listNotionNotesPages(customToken?: string | null): Promise<any[]> {
  const token = getNotesNotionToken(customToken);
  if (!token) return [];

  const notion = new Client({ auth: token });
  const allPages: any[] = [];
  let cursor: string | undefined = undefined;

  // Search without strict filter so both Pages and Databases are discovered
  do {
    const searchRes: any = await notion.search({
      page_size: 100,
      start_cursor: cursor,
    });

    for (const item of searchRes.results || []) {
      if (item.object === 'page') {
        allPages.push(item);
      } else if (item.object === 'database') {
        // If a database is shared, query its rows (pages inside the database)
        try {
          const dbQuery: any = await (notion as any).request({
            path: `databases/${item.id}/query`,
            method: 'post',
            body: { page_size: 100 },
          });
          if (Array.isArray(dbQuery.results) && dbQuery.results.length > 0) {
            allPages.push(...dbQuery.results);
          } else {
            // Also include the database itself so the user sees it
            allPages.push(item);
          }
        } catch (_) {
          allPages.push(item);
        }
      }
    }

    cursor = searchRes.has_more ? searchRes.next_cursor : undefined;
  } while (cursor);

  const titleMap = new Map<string, string>();
  const parentIds = new Set<string>();

  for (const page of allPages) {
    titleMap.set(page.id, extractPageTitle(page));
    if (page.parent?.type === 'page_id' && page.parent.page_id) {
      parentIds.add(page.parent.page_id);
    }
  }

  return allPages.map((page: any) => {
    const title = titleMap.get(page.id) || extractPageTitle(page) || 'Untitled Note';
    const props = page.properties || {};
    const parentTitle =
      page.parent?.type === 'page_id' ? titleMap.get(page.parent.page_id) || null : null;

    // Category inference: Database select property -> parent folder title -> 'Tooling'
    let category =
      props.Category?.select?.name ||
      props.category?.select?.name ||
      (parentTitle ? parentTitle.replace(/^[^\w\s]+/, '').trim() : '') ||
      'Tooling';

    if (!category) category = 'Tooling';

    const propTags =
      props.Tags?.multi_select?.map((t: any) => t.name) ||
      props.tags?.multi_select?.map((t: any) => t.name) ||
      [];

    const propLocked = Boolean(
      props.Locked?.checkbox ??
      props.locked?.checkbox ??
      /locked|vault|private/i.test(parentTitle || '')
    );

    // Workspace-level pages that act as parent folders for child notes
    const isContainer =
      page.parent?.type === 'workspace' && parentIds.has(page.id);

    return {
      id: page.id,
      title,
      category,
      tags: propTags,
      suggestedLocked: propLocked,
      isContainer,
      parentTitle,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
    };
  });
}

export async function fetchSingleNotionNote(pageIdOrUrl: string, customToken?: string | null) {
  const token = getNotesNotionToken(customToken);
  if (!token) throw new Error('Notes Notion integration token is not configured.');

  const pageId = extractNotionIdFromUrlOrString(pageIdOrUrl);
  const notion = new Client({ auth: token });
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const title = extractPageTitle(page);
  const props = page.properties || {};

  let category =
    props.Category?.select?.name ||
    props.category?.select?.name ||
    'Tooling';

  const tags =
    props.Tags?.multi_select?.map((t: any) => t.name) ||
    props.tags?.multi_select?.map((t: any) => t.name) ||
    [];

  return {
    id: page.id,
    title,
    category,
    tags,
    url: page.url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

export async function fetchRawNotionNoteMarkdown(pageId: string, customToken?: string | null) {
  const token = getNotesNotionToken(customToken);
  if (!token) {
    throw new Error('Notes Notion integration token is not configured.');
  }
  const notion = new Client({ auth: token });
  const rawMarkdown = await parseNotionBlocksToRaw(notion, pageId);

  let resolvedTitle = '';
  try {
    const page: any = await notion.pages.retrieve({ page_id: pageId });
    resolvedTitle = extractPageTitle(page);
  } catch (_) {}

  return { rawMarkdown, resolvedTitle };
}

export async function importSingleNotionNotePage(
  pageId: string,
  overrides: {
    title?: string;
    slug?: string;
    category?: string;
    date?: string;
    tags?: string[] | string;
    readTime?: string;
    summary?: string;
    content?: string;
    isLocked?: boolean;
    unlockPassword?: string;
  } = {},
  customToken?: string | null
) {
  const token = getNotesNotionToken(customToken);
  if (!token) throw new Error('Notes Notion integration token is not configured');
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');

  const notion = new Client({ auth: token });
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const props = page.properties || {};

  const title = (overrides.title?.trim() || extractPageTitle(page) || 'Untitled Note').trim();

  // Infer category
  let inferredCategory =
    overrides.category?.trim() ||
    props.Category?.select?.name ||
    props.category?.select?.name ||
    '';

  if (!inferredCategory && page.parent?.type === 'page_id') {
    try {
      const parentPage: any = await notion.pages.retrieve({ page_id: page.parent.page_id });
      const parentTitle = extractPageTitle(parentPage);
      if (parentTitle && !/locked|vault|notes/i.test(parentTitle)) {
        inferredCategory = parentTitle.replace(/^[^\w\s]+/, '').trim();
      }
    } catch (_) {}
  }
  const category = inferredCategory || 'Tooling';

  const rawTags =
    overrides.tags ||
    props.Tags?.multi_select?.map((t: any) => t.name) ||
    props.tags?.multi_select?.map((t: any) => t.name) ||
    [];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
    ? rawTags.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean)
    : [];

  const candidateSlug = (overrides.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    .replace(/(^-|-$)/g, '') || `note-${pageId.slice(0, 8)}`;

  // Check existing note by notion_page_id or slug
  let existing: any = null;
  try {
    const { data: byNotion } = await supabaseAdmin
      .from('til_notes')
      .select('*')
      .eq('notion_page_id', pageId)
      .maybeSingle();
    if (byNotion) existing = byNotion;
  } catch (_) {}

  if (!existing) {
    const { data: bySlug } = await supabaseAdmin
      .from('til_notes')
      .select('*')
      .eq('slug', candidateSlug)
      .maybeSingle();
    if (bySlug) existing = bySlug;
  }

  const slug = overrides.slug
    ? overrides.slug.trim().replace(/(^-|-$)/g, '')
    : existing?.slug || candidateSlug;

  // Build content and rehost any temporary Notion S3 images/GIFs
  const rehostedMedia: string[] = [];
  let finalContent = '';

  if (overrides.content && overrides.content.trim()) {
    finalContent = overrides.content.trim();
    const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
    const replacements: { fullMatch: string; alt: string; permUrl: string }[] = [];
    let m;

    while ((m = imgRegex.exec(finalContent)) !== null) {
      const [fullMatch, alt, url] = m;
      if (isExpiringNotionMediaUrl(url)) {
        const permUrl = await rehostNoteMedia(url, slug, `note-${rehostedMedia.length}`);
        if (permUrl) {
          rehostedMedia.push(permUrl);
          replacements.push({ fullMatch, alt, permUrl });
        }
      } else {
        rehostedMedia.push(url);
      }
    }

    for (const rep of replacements) {
      finalContent = finalContent.replace(rep.fullMatch, `![${rep.alt}](${rep.permUrl})`);
    }
  } else {
    finalContent = await parseNotionNoteBlocksWithRehost(notion, pageId, slug, rehostedMedia);
  }

  // Compute readTime if omitted
  const wordCount = finalContent.trim().split(/\s+/).filter(Boolean).length;
  const computedReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  const readTime = overrides.readTime?.trim() || computedReadTime;

  const summary =
    overrides.summary?.trim() ||
    getPlainText(props.Summary?.rich_text) ||
    `${title} technical field note and attack tradecraft reference.`;

  const date =
    overrides.date?.trim() ||
    page.created_time?.split('T')[0] ||
    new Date().toISOString().split('T')[0];

  // Lock status & password hashing
  const isLocked =
    overrides.isLocked !== undefined ? Boolean(overrides.isLocked) : Boolean(existing?.is_locked);

  let unlockPassword = '';
  let passwordHash: string | null = null;

  if (isLocked) {
    unlockPassword =
      overrides.unlockPassword?.trim() ||
      existing?.unlock_password ||
      `NOTE{${title.replace(/[^a-zA-Z0-9]/g, '')}_Vault_${Math.random().toString(16).substring(2, 6).toUpperCase()}!}`;

    if (overrides.unlockPassword?.trim() || !existing?.password_hash) {
      passwordHash = await bcrypt.hash(unlockPassword, 10);
    } else {
      passwordHash = existing.password_hash;
    }
  }

  let nextOrder = existing?.display_order;
  if (nextOrder === undefined) {
    const { data: latest } = await supabaseAdmin
      .from('til_notes')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1);
    nextOrder = (latest?.[0]?.display_order || 0) + 1;
  }

  const noteRecord = {
    title,
    slug,
    category,
    date,
    tags,
    read_time: readTime,
    summary,
    content: finalContent,
    image_urls: rehostedMedia,
    is_locked: isLocked,
    password_hash: passwordHash,
    unlock_password: isLocked ? unlockPassword : null,
    notion_page_id: pageId,
    notion_last_edited_time: page.last_edited_time,
    display_order: nextOrder,
    updated_at: new Date().toISOString(),
  };

  let data: any = null;
  let error: any = null;

  if (existing?.id) {
    const res = await supabaseAdmin
      .from('til_notes')
      .update(noteRecord)
      .eq('id', existing.id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else {
    const res = await supabaseAdmin
      .from('til_notes')
      .insert(noteRecord)
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) {
    if (error.message?.includes('is_locked') || error.message?.includes('notion_page_id')) {
      throw new Error(
        `Supabase database is missing Vault/Notion columns on 'til_notes'. Please run supabase/migrations/0003_til_notes_notion_vault.sql in your Supabase SQL Editor first. (${error.message})`
      );
    }
    throw new Error(`Failed to save note to Supabase: ${error.message}`);
  }

  return {
    success: true,
    note: data,
    mediaRehosted: rehostedMedia.length,
  };
}
