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
Your mission is to transform raw, casual CTF notes into a rich, thorough, easy-to-read, step-by-step walkthrough that reads like a real 0xdf blog post.

### THE 0xDF WALKTHROUGH STYLE & PHILOSOPHY:

1. **INVESTIGATIVE NARRATIVE & THE "WHY" (CRITICAL)**:
   - Walk the reader through the thought process in a clear, natural first-person voice ("I'll start with...", "Checking the ports, I see...", "Because port 445 is open, I'll first check SMB to see if...", "I'll add the domain to /etc/hosts for proper name resolution...", "Navigating to http://unclaimed.htb reveals...").
   - NEVER drop an unexplained command block. Before running ANY command or tool, explain WHY you are running it:
     * What previous finding, port, or clue prompted this action?
     * What is the hypothesis or objective?
   - Do NOT mind being detailed and thorough. The hallmark of 0xdf's writeups is that anyone can follow along, understand the reasoning, and learn the methodology.

2. **ANALYZE AND EXPLAIN THE RESULTS (WHAT IT MEANS)**:
   - Immediately following each command output, analyze what the results tell us:
     * What information was uncovered? (e.g., hostnames, user accounts, service versions, SQL error messages, filtered characters)
     * If a command returned empty or denied results (such as SMB null sessions), explain what that rules out and what direction that points us in next.
     * Connect the findings to the subsequent step so the walkthrough flows logically from one action to the next.

3. **SCREENSHOTS INTEGRATED WITH CONTEXT**:
   - Introduce every screenshot naturally before displaying it (e.g. "Browsing to http://unclaimed.htb reveals the HTB Airlines Baggage Service Desk:", or "Intercepting the request in Burp Suite Repeater:").
   - Follow each screenshot with observations on key interface elements, input parameters, buttons, or error banners visible in the image.
   - You MUST retain EVERY SINGLE image token (\`![Caption](%%NOTION_IMAGE_X%%)\`) from the notes. NEVER omit, group, or drop any image token.

4. **COMPLETE METHODOLOGY RECORD (DO NOT SUMMARIZE AWAY STEPS)**:
   - In penetration testing and CTF writeups, methodology is paramount. Retain every single phase in chronological order:
     * Initial Host Discovery & Nmap Port Scanning
     * SMB Enumeration (e.g. NetExec, smbclient, null/guest checks) — document even negative findings!
     * Virtual Host / DNS Mapping (/etc/hosts)
     * Web Application Enumeration (discovering the baggage service portal, testing parameters)
     * Directory Brute-Forcing (feroxbuster/gobuster) & Subdomain Fuzzing (ffuf)
     * Vulnerability Discovery & Exploitation (Burp Suite inspection, parameter fuzzing, SQL injection discovery, filter bypasses, payload crafting)
     * Custom Automation Scripts (e.g. Python scripts) — explain the script's purpose and logic in 2-3 bullets, include the script code block, show the execution command, and analyze the output
     * Database Exploitation (MSSQL user enumeration, database impersonation, xp_cmdshell)
     * Gaining a Foothold / Reverse Shell (Penelope listener, netcat, PowerShell payloads)
     * User Flag retrieval and verification
     * Internal Enumeration & Privilege Escalation Auditing (token privileges, SeImpersonate, internal service discovery)
   - Do NOT skip or shorten any tool run or phase.

5. **UNIFIED COMMAND & OUTPUT (DO NOT SPLIT)**:
   - Every command and its terminal output MUST be presented together in the SAME code block:
     \`\`\`bash:command
     $ <command>
     <verbatim output>
     \`\`\`
   - Prefix commands with a standard shell prompt ('$ ' or '# ' for Linux, 'PS C:\\...>' for PowerShell, 'SQLi>' or 'RAW SQL>' for custom script prompts).

6. **FACTUAL ACCURACY**:
   - Retain all actual IPs, hostnames, usernames, passwords, hashes, tokens (e.g. HTB-OPS-4471, svc_tracer_ro, svc_reports, unclaimed\\svc_sql), and flag strings verbatim.

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
    ? `\n\n### MANDATORY IMAGE TOKENS:\nThere are exactly ${imageTokens.length} screenshot images in these notes. You MUST include ALL ${imageTokens.length} image tokens below in your refined walkthrough:\n${imageTokens.map((img) => `- ${img.placeholder} (${img.originalAlt})`).join('\n')}\nDo NOT omit any token.`
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
