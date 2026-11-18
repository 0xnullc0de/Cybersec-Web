import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

loadEnv();

function getPlainText(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((t) => t.plain_text || '').join('');
}

/**
 * Parses raw Notion blocks into standard markdown preserving images and code blocks.
 */
async function parseNotionBlocks(notion: Client, blockId: string): Promise<string> {
  const lines: string[] = [];
  let cursor: string | undefined = undefined;

  do {
    const res: any = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const block of res.results) {
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
          const t = getPlainText(block.paragraph.rich_text);
          if (t) lines.push(t);
          break;
        }
        case 'bulleted_list_item':
          lines.push(`- ${getPlainText(block.bulleted_list_item.rich_text)}`);
          break;
        case 'numbered_list_item':
          lines.push(`1. ${getPlainText(block.numbered_list_item.rich_text)}`);
          break;
        case 'code': {
          const code = getPlainText(block.code.rich_text);
          const lang = block.code.language || 'bash';
          lines.push(`\n\`\`\`${lang}:command\n${code}\n\`\`\`\n`);
          break;
        }
        case 'image': {
          const url = block.image.file?.url || block.image.external?.url;
          const caption = getPlainText(block.image.caption) || 'Exploitation Screenshot';
          if (url) lines.push(`\n![${caption}](${url})\n`);
          break;
        }
        case 'divider':
          lines.push('\n---\n');
          break;
        default:
          if (block.has_children) {
            const nested = await parseNotionBlocks(notion, block.id);
            if (nested) lines.push(nested);
          }
          break;
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return lines.join('\n\n');
}

export const WRITEUP_REFINER_PROMPT = `You are a sharp, experienced Red Team operator and technical author for a premier cybersecurity research blog (Nulbyt3 Vault).
Your goal is to articulate raw, casual CTF notes into a clean, concise, and professional penetration testing walkthrough.

### CRITICAL STYLE GUIDELINES (ANTI-WORDINESS):
- **BE CONCISE & DIRECT**: Cut unnecessary filler, fluff, and academic preamble. Avoid stating the obvious.
- **DO NOT LECTURE ON BASIC FLAGS**: Do NOT explain standard tool flags (e.g. do not explain what -sC, -sV, -p-, -oA, or sudo do). Pentesters already know what they do.
- **NO GENERIC HEADERS**: Do NOT write headers like "**Technical Analysis:**" or "**Flag Breakdown:**". Simply state what was found and what it means directly in 1 to 3 punchy sentences.
- **KEEP PARAGRAPHS LEAN**: Focus on actionable findings: what port is open, what vulnerability exists, what response was returned, and the immediate next move.

### STRICT STRUCTURAL RULES:
1. **UNIFIED COMMAND & OUTPUT (DO NOT SPLIT)**:
   - Keep the command and its terminal output together in the SAME code block. Do NOT split them into separate command and output blocks.
   - Prefix the command with a prompt character (e.g. '$ ' or '# ' for Linux, or 'PS C:\\...>' for PowerShell, or 'SQLi> ' for interactive tools):
     \`\`\`bash:command
     $ <command>
     <verbatim output>
     \`\`\`
   - Immediately follow the code block with a crisp, direct explanation of the findings (e.g. key open ports, user identities, misconfigurations) without fluff.

2. **SCREENSHOTS / EVIDENCE**:
   - Keep images in place: \`![Caption](url)\`.
   - Add a brief 1-2 sentence description explaining what is shown (e.g. the input form, Burp request/response, or error message).

3. **CUSTOM SCRIPTS**:
   - Provide a concise 2-3 bullet summary explaining what the script automates (payload structure, endpoints, parsing).
   - Display the script code block (\`\`\`python:command or \`\`\`python).
   - Follow with the command used to run it, its output, and the immediate takeaway.

4. **100% FACTUAL ACCURACY**:
   - NEVER alter or hallucinate IP addresses, ports, usernames, passwords, hashes, tokens, or flags.
   - Retain all actual credentials, tokens (e.g. HTB-OPS-4471, svc_tracer_ro, svc_reports, unclaimed\\svc_sql), and flag strings verbatim.

5. **OUTPUT**:
   - Output ONLY the clean Markdown walkthrough ready for publication. Do not add chat greetings or closing remarks.`;

/**
 * Refines raw markdown using Google Gemini API (free tier).
 */
export async function refineWriteupContent(rawMarkdown: string, customApiKey?: string): Promise<string> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Get a free API key in 10 seconds at https://aistudio.google.com/apikey and add GEMINI_API_KEY=your_key to .env.local'
    );
  }

  // Active Gemini Flash models (with automatic fallback)
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: WRITEUP_REFINER_PROMPT },
          { text: `Raw writeup notes to refine:\n\n${rawMarkdown}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    },
  };

  let lastError: string = '';

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedText) return refinedText;
      } else {
        const errText = await response.text();
        lastError = `Model ${model} returned (${response.status}): ${errText}`;
      }
    } catch (e: any) {
      lastError = `Model ${model} request error: ${e.message}`;
    }
  }

  throw new Error(`Gemini refinement failed across available models. Details: ${lastError}`);
}

async function main() {
  const targetTitle = process.argv[2] || 'Unclaimed';
  console.log('====================================================');
  console.log(`⚡ AI Writeup Refiner // Target: "${targetTitle}"`);
  console.log('====================================================');

  const notionToken = process.env.NOTION_API_KEY;
  if (!notionToken) {
    console.error('Error: NOTION_API_KEY is missing in .env.local');
    process.exit(1);
  }

  const notion = new Client({ auth: notionToken });

  console.log('[1/4] Searching Notion for page matching:', targetTitle);
  const searchRes = await notion.search({
    query: targetTitle,
    filter: { property: 'object', value: 'page' },
    page_size: 10,
  });

  const page = searchRes.results.find((p: any) => {
    const props = p.properties || {};
    let title = '';
    if (props.Title?.title) title = getPlainText(props.Title.title);
    else if (props.title?.title) title = getPlainText(props.title.title);
    else if (props.Name?.title) title = getPlainText(props.Name.title);
    else if (props.name?.title) title = getPlainText(props.name.title);
    return title.toLowerCase().includes(targetTitle.toLowerCase());
  });

  if (!page) {
    console.error(`Could not find any Notion page matching "${targetTitle}".`);
    process.exit(1);
  }

  console.log(`✓ Found page: ${page.id}`);
  console.log('[2/4] Parsing blocks and extracting raw content...');
  const rawMarkdown = await parseNotionBlocks(notion, page.id);
  console.log(`✓ Extracted ${rawMarkdown.length} characters of raw notes.`);

  // Save raw backup
  const outDir = path.join(process.cwd(), 'writeups', 'local-refinement');
  fs.mkdirSync(outDir, { recursive: true });
  const rawPath = path.join(outDir, `${targetTitle.toLowerCase()}-raw.md`);
  fs.writeFileSync(rawPath, rawMarkdown, 'utf8');
  console.log(`✓ Saved raw notes to: ${rawPath}`);

  // Check for Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    console.log('\n[!] GEMINI_API_KEY is not configured in .env.local.');
    console.log('    To run AI refinement automatically via script:');
    console.log('    1. Get a 100% free API key from: https://aistudio.google.com/apikey');
    console.log('    2. Add `GEMINI_API_KEY=your_key_here` to .env.local');
    console.log('    3. Re-run: npm run refine:writeup Unclaimed\n');
    return;
  }

  console.log('[3/4] Sending to Gemini Flash AI for professional refinement...');
  const refinedMarkdown = await refineWriteupContent(rawMarkdown, geminiKey);

  const refinedPath = path.join(outDir, `${targetTitle.toLowerCase()}-refined.md`);
  fs.writeFileSync(refinedPath, refinedMarkdown, 'utf8');
  console.log(`✓ Saved refined writeup to: ${refinedPath}`);
  console.log('====================================================');
  console.log('✨ Refinement Complete!');
  console.log(`🛡️  NOTION SAFETY: Your original Notion notes are 100% UNTOUCHED.`);
  console.log(`📁 Local refined file: ${refinedPath}`);
  console.log('   You can inspect, tweak, or compare it before deciding to publish.');
  console.log('====================================================');
}

if (require.main === module || process.argv[1]?.includes('ai-refine-writeup')) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
