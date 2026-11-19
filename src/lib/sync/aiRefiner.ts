import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';

export function getGeminiApiKey(): string | null {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) {
    return process.env.GOOGLE_API_KEY.trim();
  }

  // Check multiple likely paths for .env.local
  const candidatePaths = [
    path.join(process.cwd(), '.env.local'),
    '/home/d4rkc0de/Cyber/Cybersec-Web/.env.local',
  ];

  for (const envPath of candidatePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/^(?:export\s+)?GEMINI_API_KEY\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
        if (match && match[1]?.trim()) {
          process.env.GEMINI_API_KEY = match[1].trim();
          return match[1].trim();
        }
      }
    } catch (e) {}
  }

  // Also check ~/.zshrc fallback
  try {
    const home = process.env.HOME || '/home/d4rkc0de';
    const zshrcPath = path.join(home, '.zshrc');
    if (fs.existsSync(zshrcPath)) {
      const content = fs.readFileSync(zshrcPath, 'utf8');
      const match = content.match(/^(?:export\s+)?GEMINI_API_KEY\s*=\s*['"]?([^'"\r\n]+)['"]?/m);
      if (match && match[1]?.trim()) {
        process.env.GEMINI_API_KEY = match[1].trim();
        return match[1].trim();
      }
    }
  } catch (e) {}

  return null;
}

getGeminiApiKey();

function getPlainText(richTextArray: any[]): string {
  if (!Array.isArray(richTextArray)) return '';
  return richTextArray.map((t) => t.plain_text || '').join('');
}

export const WRITEUP_REFINER_PROMPT = `You are a cybersecurity researcher and technical author writing comprehensive, pedagogical penetration testing walkthroughs in the celebrated style of 0xdf (0xdf.gitlab.io).
Your mission is to transform raw CTF / pentest notes into a rich, detailed, step-by-step walkthrough that is easy to read, deeply technical, and educational.

### CRITICAL STRUCTURAL & CONTENT RULES:

1. **COMMAND / SCREENSHOT FIRST -> EXPLANATION AFTER (MANDATORY)**:
   - For every step, present the technical command or screenshot FIRST, followed immediately by its explanation:
     * For tools and commands:
       \`\`\`bash:command
       $ <command>
       <verbatim output>
       \`\`\`
       Followed by: The explanation of what was run, why it was run, and what the output reveals.
     * For screenshots:
       ![Caption](%%NOTION_IMAGE_X%%)
       Followed by: The explanation of what is visible in the interface/request, what you observed, and what it indicates.
   - Do NOT put lengthy explanations before the command block. The command and output lead, and the analysis follows.

2. **MACHINE IMAGE MUST BE AT THE VERY TOP**:
   - \`%%NOTION_IMAGE_0%%\` is the Machine Avatar / Badge (the blue suitcase on a conveyor belt in an orange circle).
   - It MUST be placed at the very top of the writeup, right under the main \`# Unclaimed\` title, before the Introduction or Port Scan section.
   - Do NOT place the machine avatar under the web application or HTB Airlines section.

3. **DETAILED AI BOT & BYPASS CODE EXPLANATION**:
   - The web application hosts "TracerBot" (an AI chatbot at \`/ask\`) that takes natural language queries, converts them into SQL statements via an LLM, and queries the backend Microsoft SQL Server database.
   - When attempting arbitrary SQL injection payloads directly, the AI bot's guardrail intercepts it and replies that it cannot execute the code.
   - By prompting the AI bot to reveal its internal operator/emergency bypass code (prompt injection / social engineering the bot), the bot reveals the bypass code: \`HTB-OPS-4471\`.
   - Prepending \`HTB-OPS-4471\` before our input completely bypasses the bot's validation check and safety filter, allowing direct, arbitrary SQL injection (\`' UNION SELECT ...\`).
   - Thoroughly document and explain this vulnerability mechanism in full detail.

4. **MSSQL IMPERSONATION ENUMERATION TECHNIQUE (\`svc_reports\`)**:
   - Detail the exact technique used to discover that \`svc_tracer_ro\` has access to impersonate \`svc_reports\`:
     * Checking current privileges: Running \`SELECT IS_SRVROLEMEMBER('sysadmin')\` as \`svc_tracer_ro\` returns \`0\` (Role: 0), confirming we are not a database administrator.
     * Impersonation audit query: To find privilege escalation paths in SQL Server, we query SQL Server's permission catalog:
       \`SELECT STRING_AGG(name, ', ') FROM sys.server_principals WHERE principal_id IN (SELECT major_id FROM sys.server_permissions WHERE permission_name = 'IMPERSONATE' AND grantee_principal_id = (SELECT principal_id FROM sys.server_principals WHERE name = 'svc_tracer_ro'))\`
     * Explain what this query does: It inspects \`sys.server_permissions\` to find any server logins where \`svc_tracer_ro\` is granted \`IMPERSONATE\` rights.
     * The query returns \`svc_reports\`.
     * We test impersonating this account: \`EXECUTE AS LOGIN = 'svc_reports'; SELECT IS_SRVROLEMEMBER('sysadmin')\`. The result is \`1\`, confirming \`svc_reports\` IS a full sysadmin!
     * As sysadmin, we use \`sp_configure\` to enable \`show advanced options\` and \`xp_cmdshell\`, enabling direct operating system command execution on the target Windows host as \`svc_sql\`.

5. **100% METHODOLOGY & SCREENSHOT PRESERVATION**:
   - Retain every single phase in chronological order:
     * Initial Nmap Port Scan
     * SMB Enumeration (NetExec / smbclient) — retain even negative/empty findings, explaining that null sessions are disabled
     * DNS / Hosts File Configuration (/etc/hosts)
     * Web Service Enumeration (HTB Airlines TracerBot portal)
     * Directory Brute-Forcing & Subdomain Fuzzing
     * Vulnerability Discovery & Bypass Code extraction from the AI bot
     * Custom Python Automation Scripts (explain what the script automates, show the script code, show execution and output)
     * Database Exploitation & Impersonation of \`svc_reports\`
     * Enabling \`xp_cmdshell\` and Foothold Reverse Shell (Penelope)
     * User Flag capture
     * Post-Exploitation Privilege Auditing
   - You MUST retain EVERY SINGLE image token (\`![Caption](%%NOTION_IMAGE_X%%)\`) in its exact logical place.

6. **FACTUAL ACCURACY**:
   - Retain all actual IPs, hostnames, usernames, passwords, hashes, tokens, and flags verbatim.

7. **OUTPUT FORMAT**:
   - Output ONLY the clean Markdown walkthrough ready for publication. Do not add chat greetings or closing remarks.`;

/**
 * Extracts raw markdown text and images from Notion blocks.
 */
export async function parseNotionBlocksToRaw(notion: Client, blockId: string): Promise<string> {
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
            const nested = await parseNotionBlocksToRaw(notion, block.id);
            if (nested) lines.push(nested);
          }
          break;
      }
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return lines.join('\n\n');
}

/**
 * Refines raw markdown notes using Gemini Flash (with resilient model fallbacks).
 * Preserves 100% of images and all methodology steps.
 */
export async function refineWriteupContent(rawMarkdown: string, customApiKey?: string): Promise<string> {
  const apiKey = customApiKey || getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY=your_key to .env.local'
    );
  }

  // 1. Tokenize images to clean tokens: ![caption](%%NOTION_IMAGE_0%%)
  // This prevents huge S3 signed URLs (~800 chars each) from polluting LLM tokens and causing drops.
  const imageTokens: { placeholder: string; originalAlt: string; originalUrl: string }[] = [];
  const imgRegex = /!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g;
  let imgIndex = 0;

  const tokenizedMarkdown = rawMarkdown.replace(imgRegex, (fullMatch, alt, url) => {
    const placeholder = `%%NOTION_IMAGE_${imgIndex}%%`;
    imageTokens.push({
      placeholder,
      originalAlt: alt?.trim() || 'Exploitation Screenshot',
      originalUrl: url.trim(),
    });
    imgIndex++;
    return `![${alt?.trim() || 'Exploitation Screenshot'}](${placeholder})`;
  });

  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  const imageDirectives = imageTokens.length > 0
    ? `\n\n### MANDATORY IMAGE TOKENS & PLACEMENT:
There are exactly ${imageTokens.length} screenshot images in these notes. You MUST include ALL ${imageTokens.length} image tokens in your refined walkthrough:
- %%NOTION_IMAGE_0%%: Machine Avatar / Badge (MUST be placed at the very top of the writeup, right under the title "# Unclaimed"!)
- %%NOTION_IMAGE_1%%: HTB Airlines Baggage Service Desk website homepage
- %%NOTION_IMAGE_2%%: TracerBot chat / query interface
- %%NOTION_IMAGE_3%%: Burp Suite HTTP request / response observation
- %%NOTION_IMAGE_4%%: SQL query input attempt in TracerBot
- %%NOTION_IMAGE_5%%: AI bot blocking arbitrary SQL queries
- %%NOTION_IMAGE_6%%: Asking the AI bot for the operator bypass code and getting HTB-OPS-4471
- %%NOTION_IMAGE_7%%: Prepending HTB-OPS-4471 to bypass the AI filter and achieve SQL injection
- %%NOTION_IMAGE_8%%: Querying database schema / tables
Do NOT omit or switch any image token. Immediately follow each image with an explanation of what is shown.`
    : '';

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: WRITEUP_REFINER_PROMPT + imageDirectives },
          { text: `Raw writeup notes to refine into a comprehensive walkthrough:\n\n${tokenizedMarkdown}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.25,
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
        if (refinedText) {
          // 2. Restore all image placeholders back to their original URLs
          let restoredText = refinedText;
          const missedImages: typeof imageTokens = [];

          for (const img of imageTokens) {
            if (restoredText.includes(img.placeholder)) {
              restoredText = restoredText.replaceAll(img.placeholder, img.originalUrl);
            } else {
              missedImages.push(img);
            }
          }

          // 3. Fallback safety net: If Gemini somehow omitted any image token, append it!
          if (missedImages.length > 0) {
            restoredText += '\n\n## Additional Visual Evidence\n';
            for (const img of missedImages) {
              restoredText += `\n![${img.originalAlt}](${img.originalUrl})\n*Screenshot: ${img.originalAlt}*\n`;
            }
          }

          // 4. Ensure balanced code blocks
          const fences = (restoredText.match(/```/g) || []).length;
          if (fences % 2 !== 0) {
            restoredText += '\n```';
          }

          return restoredText;
        }
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
