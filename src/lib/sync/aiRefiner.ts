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

export interface WriteupMetadata {
  summary: string;
  initialAccessVector: string;
  privEscVector: string;
  tags: string;
  difficulty: string;
  os: string;
}

export interface RefinedWriteupResult {
  metadata: WriteupMetadata;
  refinedMarkdown: string;
}

export const WRITEUP_REFINER_PROMPT = `You are a cybersecurity researcher and technical author writing comprehensive, pedagogical penetration testing walkthroughs in the celebrated style of 0xdf (0xdf.gitlab.io).
Your mission is to transform raw CTF / pentest notes into a rich, detailed, step-by-step walkthrough that is easy to read, deeply technical, and educational.

### 1. METADATA FRONTMATTER (MANDATORY):
At the VERY START of your response, output a YAML frontmatter block with extracted metadata for the machine card:
---
summary: <2-3 sentence overview summarizing the target machine, key vulnerabilities, and overall compromise path>
foothold: <concise summary of the initial foothold vector, e.g. TracerBot prompt injection -> bypass code (HTB-OPS-4471) -> MSSQL error/union SQLi -> xp_cmdshell command execution>
privesc: <concise summary of the privilege escalation vector, e.g. MSSQL server principal impersonation (svc_reports) -> sysadmin role -> xp_cmdshell as svc_sql>
tags: <comma-separated tags, e.g. Windows, MSSQL, SQLi, AI Bot, Prompt Injection, Impersonation>
difficulty: <Easy | Medium | Hard | Insane>
os: <Windows | Linux>
---

### 2. ABSOLUTELY NO INTRODUCTION SECTION IN THE WALKTHROUGH BODY:
- DO NOT write an "# Introduction" or "## Introduction" section in the body!
- The website's blog template already displays the summary and initial access / privesc vector badges above the article.
- Having an Introduction section in the walkthrough is completely redundant and causes it to be too wordy.
- The walkthrough text MUST start immediately with:
  # <Machine Name>
  ![Machine Badge](%%NOTION_IMAGE_0%%)
  ## Reconnaissance (or ## Recon)
  ### Port Scan
  (NO INTRODUCTION IN BETWEEN!)

### 3. CRITICAL STRUCTURAL & CONTENT RULES:

1. **UNIFIED COMMAND & OUTPUT (NEVER SPLIT, NO "*Output:*")**:
   - The command AND its terminal output MUST be together in the EXACT SAME single code block:
     \`\`\`bash:command
     $ <command>
     <verbatim output>
     \`\`\`
   - NEVER create a separate code block for the command and a second code block for the output!
   - NEVER write "*Output:*" or "Output:" between code blocks!
   - Prefix commands with a standard shell prompt ('$ ' or '# ' for Linux, 'PS C:\\...>' for PowerShell, 'SQLi>' or 'RAW SQL>' for custom script prompts).
   - Immediately AFTER the unified code block, provide the explanation: what was run, why it was run, and what the output reveals.
   - For screenshots:
     ![Caption](%%NOTION_IMAGE_X%%)
     Followed immediately by: The explanation of what is visible in the interface/request, what you observed, and what it indicates.

2. **MACHINE IMAGE MUST BE AT THE VERY TOP**:
   - \`%%NOTION_IMAGE_0%%\` is the Machine Avatar / Badge (the blue suitcase on a conveyor belt in an orange circle).
   - It MUST be placed at the very top of the writeup, right under the main \`# Unclaimed\` title, before the Reconnaissance / Port Scan section.
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
   - Output ONLY the YAML frontmatter block followed immediately by the clean Markdown walkthrough ready for publication. Do not add chat greetings or closing remarks.`;

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
 * Parses frontmatter metadata and markdown content from AI output.
 */
export function parseFrontmatterAndContent(text: string): RefinedWriteupResult {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  let rawMeta = '';
  let content = text;

  if (match) {
    rawMeta = match[1];
    content = match[2].trim();
  }

  const getField = (key: string): string => {
    const m = rawMeta.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
    return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '';
  };

  const metadata: WriteupMetadata = {
    summary: getField('summary') || 'CTF machine walkthrough and security report.',
    initialAccessVector: getField('foothold') || getField('initialAccessVector') || '',
    privEscVector: getField('privesc') || getField('privEscVector') || '',
    tags: getField('tags') || 'CTF, Walkthrough',
    difficulty: getField('difficulty') || 'Medium',
    os: getField('os') || 'Windows',
  };

  // Strip redundant # Introduction or ## Introduction sections if present
  content = content.replace(/^#+\s*Introduction\s*\r?\n[\s\S]*?(?=\r?\n#+)/im, '').trim();

  return { metadata, refinedMarkdown: content };
}

/**
 * Refines raw markdown notes using Gemini Flash.
 * Preserves 100% of images, all methodology steps, and extracts writeup metadata.
 */
export async function refineWriteupContent(rawMarkdown: string, customApiKey?: string): Promise<RefinedWriteupResult> {
  const apiKey = customApiKey || getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY=your_key to .env.local'
    );
  }

  // 1. Tokenize images to clean tokens: ![caption](%%NOTION_IMAGE_0%%)
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
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
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

  const modelErrors: string[] = [];

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000),
      });

      if (response.ok) {
        const data = await response.json();
        const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedText) {
          // 2. Parse frontmatter metadata and strip Introduction section
          const parsed = parseFrontmatterAndContent(refinedText);
          let restoredText = parsed.refinedMarkdown;
          const missedImages: typeof imageTokens = [];

          // 3. Restore image URLs
          for (const img of imageTokens) {
            if (restoredText.includes(img.placeholder)) {
              restoredText = restoredText.replaceAll(img.placeholder, img.originalUrl);
            } else {
              missedImages.push(img);
            }
          }

          // Fallback safety net: if any token was omitted, append it
          if (missedImages.length > 0) {
            restoredText += '\n\n## Additional Visual Evidence\n';
            for (const img of missedImages) {
              restoredText += `\n![${img.originalAlt}](${img.originalUrl})\n*Screenshot: ${img.originalAlt}*\n`;
            }
          }

          // 4. Automatically merge any split command and output code blocks
          restoredText = mergeSplitCommandAndOutput(restoredText);

          // 5. Ensure balanced code blocks
          const fences = (restoredText.match(/```/g) || []).length;
          if (fences % 2 !== 0) {
            restoredText += '\n```';
          }

          return {
            metadata: parsed.metadata,
            refinedMarkdown: restoredText,
          };
        }
      } else {
        const errText = await response.text();
        modelErrors.push(`[${model}] HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }
    } catch (e: any) {
      modelErrors.push(`[${model}] ${e.message}`);
    }
  }

  throw new Error(`Gemini refinement failed across available models: ${modelErrors.join(' | ')}`);
}

/**
 * Automatically merges any split command and output code blocks.
 * Eliminates separate "*Output:*" blocks and combines them into one unified code block.
 */
export function mergeSplitCommandAndOutput(markdown: string): string {
  const splitRegex = /```([a-zA-Z0-9_:-]+)\r?\n([\s\S]*?)\r?\n```\s*(?:\r?\n)*\s*(?:\*+(?:Command\s+|Scan\s+)?Output:?\*+|Output:?)?\s*(?:\r?\n)*\s*```(?:[a-zA-Z0-9_:-]+)?\r?\n([\s\S]*?)\r?\n```/gi;

  let merged = markdown;
  let prev = '';
  while (merged !== prev) {
    prev = merged;
    merged = merged.replace(splitRegex, (match, lang, cmd, output) => {
      const cleanLang = lang.includes(':command') ? lang : `${lang}:command`;
      const cleanCmd = cmd.trim();
      const cleanOutput = output.trim();
      const formattedCmd = cleanCmd.startsWith('$ ') || cleanCmd.startsWith('# ') || cleanCmd.startsWith('PS ') || cleanCmd.startsWith('SQLi>') || cleanCmd.startsWith('RAW SQL>')
        ? cleanCmd
        : `$ ${cleanCmd}`;
      return `\`\`\`${cleanLang}\n${formattedCmd}\n${cleanOutput}\n\`\`\``;
    });
  }
  return merged;
}
