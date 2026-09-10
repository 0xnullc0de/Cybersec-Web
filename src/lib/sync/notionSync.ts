import { Client } from '@notionhq/client';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { uploadWriteupPdfToSupabase } from '@/lib/pdf/generateWriteupPdf';

// Load token from environment or fallback file
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

export interface SyncStats {
  success: boolean;
  message: string;
  pagesFound: number;
  pagesSynced: number;
  imagesRehosted: number;
  pdfsGenerated: number;
  errors: string[];
  syncedWriteups: {
    slug: string;
    title: string;
    platform: string;
    isRetired: boolean;
    imagesCount: number;
    pdfUrl: string | null;
  }[];
}

/**
 * Downloads an image from Notion's temporary S3 URL and uploads it
 * to Supabase Storage bucket 'writeup-images' for permanent hosting.
 */
async function rehostNotionImage(
  notionImageUrl: string,
  slug: string,
  blockId: string
): Promise<string | null> {
  const admin = supabaseAdmin;
  if (!admin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for sync and storage uploads');

  try {
    const res = await fetch(notionImageUrl);
    if (!res.ok) {
      console.warn(`Failed to download image from Notion: ${res.status}`);
      return null;
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await res.arrayBuffer());

    let ext = 'png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';

    const storagePath = `${slug}/${blockId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin!.storage
      .from('writeup-images')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase image upload error:', uploadError.message);
      return null;
    }

    const { data: publicData } = supabaseAdmin!.storage
      .from('writeup-images')
      .getPublicUrl(storagePath);

    return publicData.publicUrl;
  } catch (err: any) {
    console.error('rehostNotionImage error:', err.message);
    return null;
  }
}

/**
 * Extracts plain text from Notion rich_text array.
 */
function getPlainText(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((t) => t.plain_text || '').join('');
}

/**
 * Recursively converts Notion blocks into Markdown, tagging code blocks
 * as terminal command blocks and rehosting all embedded images.
 */
async function parseNotionBlocksToMarkdown(
  notion: Client,
  blockId: string,
  slug: string,
  rehostedImages: string[]
): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const blocksResponse: any = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of blocksResponse.results as any[]) {
      const type = block.type;

      switch (type) {
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
          const text = getPlainText(block.paragraph.rich_text);
          if (text) lines.push(text);
          break;
        }

        case 'bulleted_list_item':
          lines.push(`- ${getPlainText(block.bulleted_list_item.rich_text)}`);
          break;

        case 'numbered_list_item':
          lines.push(`1. ${getPlainText(block.numbered_list_item.rich_text)}`);
          break;

        case 'to_do': {
          const checked = Boolean(block.to_do?.checked);
          const todoText = getPlainText(block.to_do?.rich_text);
          lines.push(`- [${checked ? 'x' : ' '}] ${todoText}`);
          break;
        }

        case 'toggle': {
          const toggleTitle = getPlainText(block.toggle?.rich_text);
          if (toggleTitle) {
            lines.push(`\n<details>\n<summary><strong>${toggleTitle}</strong></summary>\n`);
          }
          if (block.has_children) {
            const nested = await parseNotionBlocksToMarkdown(notion, block.id, slug, rehostedImages);
            if (nested) lines.push(nested);
          }
          if (toggleTitle) {
            lines.push(`\n</details>\n`);
          }
          break;
        }

        case 'callout': {
          const calloutText = getPlainText(block.callout?.rich_text);
          const icon = block.callout?.icon?.emoji || '💡';
          lines.push(`\n> ${icon} **Note:** ${calloutText}\n`);
          break;
        }

        case 'quote':
          lines.push(`> ${getPlainText(block.quote.rich_text)}`);
          break;

        case 'divider':
          lines.push('\n---\n');
          break;

        // ─── CHILD PAGES & DATABASES ─────────────────────────────────────
        // CRITICAL: Child pages represent separate individual machine writeups
        // (e.g. Flight or DARKZERORETURNS inside category folder Hard).
        // Never recursively swallow child pages into the current writeup.
        case 'child_page':
        case 'child_database':
          break;

        // ─── CODE / TERMINAL COMMAND BLOCK ──────────────────────────────────
        // Crucial requirement: code blocks are preserved and tagged as
        // distinct command elements (e.g. ```bash:command) rather than plain text
        case 'code': {
          const codeText = getPlainText(block.code.rich_text);
          const language = block.code.language || 'bash';
          // Tag as terminal command block
          lines.push(`\n\`\`\`${language}:command\n${codeText}\n\`\`\`\n`);
          break;
        }

        // ─── EMBEDDED IMAGES / SCREENSHOTS ───────────────────────────────────
        // Crucial requirement: download from expiring Notion URL and re-upload
        // to permanent Supabase Storage bucket 'writeup-images'
        case 'image': {
          const imageUrl = block.image.file?.url || block.image.external?.url;
          const caption = getPlainText(block.image.caption) || 'Exploitation Screenshot';

          if (imageUrl) {
            const permUrl = await rehostNotionImage(imageUrl, slug, block.id);
            if (permUrl) {
              rehostedImages.push(permUrl);
              lines.push(`\n![${caption}](${permUrl})\n`);
            } else {
              // Fallback to original if rehost fails
              lines.push(`\n![${caption}](${imageUrl})\n`);
            }
          }
          break;
        }

        default:
          // Handle other nested child blocks
          if (block.has_children) {
            const nested = await parseNotionBlocksToMarkdown(notion, block.id, slug, rehostedImages);
            if (nested) lines.push(nested);
          }
          break;
      }
    }

    cursor = blocksResponse.has_more ? blocksResponse.next_cursor : undefined;
  } while (cursor);

  return lines.join('\n\n');
}

/**
 * Main Notion-to-Supabase synchronization runner.
 * Single action that pulls new or updated writeup pages from Notion,
 * re-hosts images into Supabase Storage, generates matching dark-mode PDFs,
 * hashes passphrases, and upserts into the Supabase database.
 */
export async function syncNotionToWriteups(): Promise<SyncStats> {
  const token = getNotionToken();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();

  const stats: SyncStats = {
    success: false,
    message: '',
    pagesFound: 0,
    pagesSynced: 0,
    imagesRehosted: 0,
    pdfsGenerated: 0,
    errors: [],
    syncedWriteups: [],
  };

  if (!token) {
    stats.message = 'No Notion API token found in environment (NOTION_API_KEY) or notion-token file.';
    return stats;
  }

  if (!supabaseAdmin) {
    stats.message = 'SUPABASE_SERVICE_ROLE_KEY is required for sync and storage uploads.';
    return stats;
  }

  const notion = new Client({ auth: token });

  try {
    let pages: any[] = [];

    // Option A: Specific Database ID
    if (databaseId) {
      let dbQuery: any;
      if (typeof (notion as any).databases?.query === 'function') {
        dbQuery = await (notion as any).databases.query({ database_id: databaseId });
      } else if (typeof (notion as any).dataSources?.query === 'function') {
        dbQuery = await (notion as any).dataSources.query({ data_source_id: databaseId });
      } else {
        dbQuery = await (notion as any).request({ path: `databases/${databaseId}/query`, method: 'post' });
      }
      pages = dbQuery?.results || [];
    } else {
      // Option B: Search all pages in workspace
      const searchRes = await notion.search({
        filter: { property: 'object', value: 'page' },
        page_size: 50,
      });
      pages = searchRes.results;
    }

    stats.pagesFound = pages.length;

    if (pages.length === 0) {
      stats.success = true;
      stats.message = 'Connected to Notion successfully, but no writeup pages were found in the integration workspace.';
      return stats;
    }

    for (const page of pages) {
      try {
        const props = page.properties || {};

        // Extract Title
        let title = 'Untitled Writeup';
        if (props.Title?.title) title = getPlainText(props.Title.title);
        else if (props.title?.title) title = getPlainText(props.title.title);
        else if (props.Name?.title) title = getPlainText(props.Name.title);
        else if (props.name?.title) title = getPlainText(props.name.title);
        else if (page.title) title = getPlainText(page.title);

        if (!title || title === 'Untitled Writeup') continue;
        const normalized = title.toLowerCase().replace(/^[^\w\s]+/, '').trim();
        if (['hard', 'medium', 'easy', 'insane'].includes(normalized)) continue;

        // Extract Slug
        let slug = '';
        if (props.Slug?.rich_text) slug = getPlainText(props.Slug.rich_text);
        if (!slug) {
          slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }

        // Extract Platform, Difficulty, OS
        const platform = props.Platform?.select?.name || 'HTB';
        const difficulty = props.Difficulty?.select?.name || 'Medium';
        const os = props.OS?.select?.name || 'Linux';

        // Extract Tags
        const tags = props.Tags?.multi_select?.map((t: any) => t.name) || ['CTF'];

        // Dates
        const datePublished =
          props['Date Published']?.date?.start ||
          props.Date?.date?.start ||
          page.created_time.split('T')[0];

        const retirementDate = props['Retirement Date']?.date?.start || null;

        // Status
        const statusProp = props.Status?.select?.name?.toLowerCase();
        const isRetired =
          statusProp === 'retired' ||
          (retirementDate ? new Date(retirementDate) <= new Date() : false);

        // Vectors & metadata
        const summary = getPlainText(props.Summary?.rich_text) || `${title} machine walkthrough.`;
        const initialAccessVector = getPlainText(props['Initial Access']?.rich_text) || 'Initial reconnaissance and foothold.';
        const privEscVector = getPlainText(props['Privilege Escalation']?.rich_text) || 'Internal privilege escalation to root/administrator.';
        const ipAddress = getPlainText(props.IP?.rich_text) || undefined;
        const points = props.Points?.number || 20;
        const featured = Boolean(props.Featured?.checkbox);

        // Password for active machines
        const rawPassword = getPlainText(props.Password?.rich_text || props.Passphrase?.rich_text);
        let passwordHash: string | null = null;
        if (rawPassword) {
          passwordHash = await bcrypt.hash(rawPassword.trim(), 10);
        }

        // Parse page blocks & download/rehost images
        const rehostedImages: string[] = [];
        const fullMarkdown = await parseNotionBlocksToMarkdown(
          notion,
          page.id,
          slug,
          rehostedImages
        );

        stats.imagesRehosted += rehostedImages.length;

        // Split preview content (e.g. section 1 / recon before '---')
        let previewContent = fullMarkdown;
        if (fullMarkdown.includes('---')) {
          previewContent = fullMarkdown.split('---')[0].trim();
        } else if (fullMarkdown.includes('## 2.')) {
          previewContent = fullMarkdown.split('## 2.')[0].trim();
        }

        // Generate Dark-Mode PDF and store in Supabase Storage
        let pdfPath: string | null = null;
        try {
          pdfPath = await uploadWriteupPdfToSupabase({
            slug,
            title,
            platform,
            difficulty,
            os,
            datePublished,
            summary,
            initialAccessVector,
            privEscVector,
            content: fullMarkdown,
          });
          if (pdfPath) stats.pdfsGenerated++;
        } catch (pdfErr) {
          console.warn(`PDF generation skipped for ${slug}:`, pdfErr);
        }

        // Upsert into Supabase writeups table
        const writeupRecord = {
          slug,
          title,
          platform,
          difficulty,
          os,
          tags,
          date_published: datePublished,
          retirement_date: retirementDate ? new Date(retirementDate).toISOString() : null,
          is_retired: isRetired,
          points,
          ip_address: ipAddress,
          featured,
          summary,
          initial_access_vector: initialAccessVector,
          priv_esc_vector: privEscVector,
          preview_content: previewContent,
          full_content: fullMarkdown,
          password_hash: passwordHash,
          pdf_path: pdfPath,
          image_paths: rehostedImages,
          notion_page_id: page.id,
          notion_last_edited_time: page.last_edited_time,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseAdmin!
          .from('writeups')
          .upsert(writeupRecord, { onConflict: 'slug' });

        if (upsertError) {
          stats.errors.push(`Failed to upsert ${slug}: ${upsertError.message}`);
        } else {
          stats.pagesSynced++;
          stats.syncedWriteups.push({
            slug,
            title,
            platform,
            isRetired,
            imagesCount: rehostedImages.length,
            pdfUrl: pdfPath,
          });
        }
      } catch (pageErr: any) {
        stats.errors.push(`Error parsing page ${page.id}: ${pageErr.message}`);
      }
    }

    stats.success = stats.pagesSynced > 0 || stats.pagesFound === 0;
    stats.message = `Sync completed: ${stats.pagesSynced} of ${stats.pagesFound} pages synchronized to Supabase with ${stats.imagesRehosted} images rehosted and ${stats.pdfsGenerated} PDFs generated.`;
    return stats;
  } catch (apiErr: any) {
    stats.message = `Notion API Error: ${apiErr.message}`;
    stats.errors.push(apiErr.message);
    return stats;
  }
}

/**
 * Lists all pages accessible in the Notion workspace so the user can select which to import.
 * Traverses parent categories (Hard, Medium, Easy, Insane) and identifies individual machines.
 */
export async function listNotionPages(): Promise<any[]> {
  const token = getNotionToken();
  if (!token) return [];
  const notion = new Client({ auth: token });
  try {
    const allPages: any[] = [];
    let cursor: string | undefined = undefined;

    do {
      const searchRes: any = await notion.search({
        filter: { property: 'object', value: 'page' },
        page_size: 100,
        start_cursor: cursor,
      });
      allPages.push(...searchRes.results);
      cursor = searchRes.has_more ? searchRes.next_cursor : undefined;
    } while (cursor);

    // Build title map for parent resolution
    const titleMap = new Map<string, string>();
    for (const page of allPages) {
      const props = page.properties || {};
      let title = '';
      if (props.Title?.title) title = getPlainText(props.Title.title);
      else if (props.title?.title) title = getPlainText(props.title.title);
      else if (props.Name?.title) title = getPlainText(props.Name.title);
      else if (props.name?.title) title = getPlainText(props.name.title);
      else if (page.title) title = getPlainText(page.title);
      titleMap.set(page.id, title.trim());
    }

    return allPages.map((page: any) => {
      const title = titleMap.get(page.id) || 'Untitled';
      const parent = page.parent;
      let category = 'Other';
      let isContainer = false;

      if (parent?.type === 'page_id') {
        const parentTitle = titleMap.get(parent.page_id) || '';
        if (/hard/i.test(parentTitle)) category = 'Hard';
        else if (/medium/i.test(parentTitle)) category = 'Medium';
        else if (/easy/i.test(parentTitle)) category = 'Easy';
        else if (/insane/i.test(parentTitle)) category = 'Insane';
        else if (parentTitle) category = parentTitle.replace(/^[^\w\s]+/, '').trim();
      } else if (parent?.type === 'workspace') {
        if (/hard/i.test(title)) { category = 'Hard'; isContainer = true; }
        else if (/medium/i.test(title)) { category = 'Medium'; isContainer = true; }
        else if (/easy/i.test(title)) { category = 'Easy'; isContainer = true; }
        else if (/insane/i.test(title)) { category = 'Insane'; isContainer = true; }
      }

      // Also check if title itself is a known category name
      const cleanTitle = title.replace(/^[^\w\s]+/, '').trim().toLowerCase();
      if (['hard', 'medium', 'easy', 'insane'].includes(cleanTitle)) {
        isContainer = true;
      }

      return {
        id: page.id,
        title: title || 'Untitled',
        category,
        isContainer,
        parentTitle: parent?.page_id ? (titleMap.get(parent.page_id) || null) : null,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
      };
    });
  } catch (e: any) {
    console.error('listNotionPages error:', e);
    return [];
  }
}

/**
 * Selectively imports a single Notion page into Supabase with optional user overrides
 * (e.g. marking as HTB Pro Lab, assigning custom unlock passphrase).
 */
export async function importSingleNotionPage(
  pageId: string,
  overrides: {
    title?: string;
    slug?: string;
    isProLab?: boolean;
    platform?: string;
    difficulty?: string;
    os?: string;
    tags?: string[] | string;
    unlockPassword?: string;
    summary?: string;
    initialAccessVector?: string;
    privEscVector?: string;
  } = {}
) {
  const token = getNotionToken();
  if (!token) throw new Error('Notion token not configured');
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY required');

  const notion = new Client({ auth: token });
  const page: any = await notion.pages.retrieve({ page_id: pageId });
  const props = page.properties || {};

  // Resolve title
  let title = overrides.title?.trim();
  if (!title) {
    if (props.Title?.title) title = getPlainText(props.Title.title);
    else if (props.title?.title) title = getPlainText(props.title.title);
    else if (props.Name?.title) title = getPlainText(props.Name.title);
    else if (props.name?.title) title = getPlainText(props.name.title);
    else if (page.title) title = getPlainText(page.title);
  }
  if (!title) title = 'Untitled Writeup';

  // Resolve slug
  const isProLab = Boolean(overrides.isProLab);
  const platform = overrides.platform || (isProLab ? 'HTB Pro Lab' : (props.Platform?.select?.name || 'HTB'));

  // Auto-infer difficulty from parent category if not explicitly provided
  let inferredDifficulty = 'Medium';
  if (page.parent?.type === 'page_id') {
    try {
      const parentPage: any = await notion.pages.retrieve({ page_id: page.parent.page_id });
      const parentProps = parentPage.properties || {};
      let parentTitle = '';
      if (parentProps.title?.title) parentTitle = getPlainText(parentProps.title.title);
      else if (parentProps.Title?.title) parentTitle = getPlainText(parentProps.Title.title);
      else if (parentProps.Name?.title) parentTitle = getPlainText(parentProps.Name.title);
      if (/hard/i.test(parentTitle)) inferredDifficulty = 'Hard';
      else if (/easy/i.test(parentTitle)) inferredDifficulty = 'Easy';
      else if (/insane/i.test(parentTitle)) inferredDifficulty = 'Insane';
      else if (/medium/i.test(parentTitle)) inferredDifficulty = 'Medium';
    } catch (e) {}
  }

  const difficulty = overrides.difficulty || props.Difficulty?.select?.name || (isProLab ? 'Hard' : inferredDifficulty);
  const os = overrides.os || props.OS?.select?.name || (isProLab ? 'Active Directory' : 'Linux');
  
  // Resolve tags
  const rawTags = overrides.tags || props.Tags?.multi_select?.map((t: any) => t.name) || [isProLab ? 'Pro Lab' : 'CTF'];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
    ? rawTags.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean)
    : ['CTF'];

  const summary = overrides.summary || getPlainText(props.Summary?.rich_text) || `${title} enterprise walkthrough.`;

  // Resolve vectors (Foothold & PrivEsc)
  const initialAccessVector =
    overrides.initialAccessVector?.trim() ||
    getPlainText(props['Initial Access']?.rich_text) ||
    getPlainText(props.Foothold?.rich_text) ||
    (isProLab ? 'Enterprise network entry vector' : 'Initial reconnaissance and foothold.');

  const privEscVector =
    overrides.privEscVector?.trim() ||
    getPlainText(props['Privilege Escalation']?.rich_text) ||
    getPlainText(props.Privesc?.rich_text) ||
    (isProLab ? 'Domain persistence & forest privilege escalation' : 'Internal privilege escalation to root/administrator.');

  const slug = (overrides.slug || `${platform.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
    .replace(/(^-|-$)/g, '');

  // Parse blocks and re-host images
  const rehostedImages: string[] = [];
  const fullMarkdown = await parseNotionBlocksToMarkdown(notion, pageId, slug, rehostedImages);

  // Split preview content
  let previewContent = fullMarkdown;
  if (fullMarkdown.includes('---')) {
    previewContent = fullMarkdown.split('---')[0].trim();
  } else if (fullMarkdown.includes('## 2.')) {
    previewContent = fullMarkdown.split('## 2.')[0].trim();
  }

  // Generate dark-mode PDF
  let pdfPath: string | null = null;
  try {
    pdfPath = await uploadWriteupPdfToSupabase({
      slug,
      title,
      platform,
      difficulty,
      os,
      datePublished: page.created_time?.split('T')[0] || new Date().toISOString().split('T')[0],
      summary,
      initialAccessVector,
      privEscVector,
      content: fullMarkdown,
    });
  } catch (pdfErr) {
    console.warn(`PDF generation skipped for ${slug}:`, pdfErr);
  }

  // Password setup: for Pro Labs or locked writeups
  const unlockPassword = overrides.unlockPassword?.trim() || (isProLab ? `HTB{${title.replace(/[^a-zA-Z0-9]/g, '')}_ProLab_Enterprise_Pwned!}` : '');
  let passwordHash: string | null = null;
  if (unlockPassword) {
    passwordHash = await bcrypt.hash(unlockPassword, 10);
  }

  const writeupRecord = {
    slug,
    title,
    platform,
    difficulty,
    os,
    tags,
    date_published: page.created_time?.split('T')[0] || new Date().toISOString().split('T')[0],
    is_retired: !isProLab, // Pro labs are NEVER retired by default
    is_pro_lab: isProLab,
    points: isProLab ? 100 : 30,
    summary,
    initial_access_vector: initialAccessVector,
    priv_esc_vector: privEscVector,
    preview_content: previewContent,
    full_content: fullMarkdown,
    password_hash: passwordHash,
    unlock_password: unlockPassword || null,
    pdf_path: pdfPath,
    image_paths: rehostedImages,
    notion_page_id: pageId,
    notion_last_edited_time: page.last_edited_time,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin!
    .from('writeups')
    .upsert(writeupRecord, { onConflict: 'slug' })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save to Supabase: ${error.message}`);
  }

  return {
    success: true,
    writeup: data,
    imagesRehosted: rehostedImages.length,
    pdfGenerated: Boolean(pdfPath),
  };
}
