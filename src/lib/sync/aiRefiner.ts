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

export function buildRefinerPrompt(machineName: string): string {
  return `You are a cybersecurity researcher and technical author writing comprehensive, pedagogical penetration testing walkthroughs in the celebrated style of 0xdf (0xdf.gitlab.io).
Your mission is to transform raw CTF / pentest notes into a rich, detailed, step-by-step walkthrough that is easy to read, deeply technical, and educational.

### TARGET MACHINE:
- Machine Name: "${machineName}"
- The walkthrough H1 title MUST start with: "# ${machineName}"

### 1. METADATA FRONTMATTER (MANDATORY):
At the VERY START of your response, output a YAML frontmatter block with extracted metadata for the machine card:
---
summary: <2-3 sentence overview summarizing the target machine, key vulnerabilities, and overall compromise path>
foothold: <concise summary of the initial foothold vector, e.g. kiosk breakout via error dialog / web exploit / SQLi / RCE>
privesc: <concise summary of the privilege escalation vector, e.g. DLL hijacking via Printer Administrators writable plugins folder / SUID / token impersonation>
tags: <comma-separated tags based on technologies used, e.g. Windows, Kiosk, Kiosk Breakout, DLL Hijacking, Printer Administrators, Edge>
difficulty: <Easy | Medium | Hard | Insane>
os: <Windows | Linux>
---

### 2. ABSOLUTELY NO INTRODUCTION SECTION IN THE WALKTHROUGH BODY:
- DO NOT write an "# Introduction" or "## Introduction" section in the body!
- The website's blog template already displays the summary and initial access / privesc vector badges above the article.
- Having an Introduction section in the walkthrough is completely redundant and causes it to be too wordy.
- The walkthrough text MUST start immediately with:
  # ${machineName}
  ![Machine Badge](%%NOTION_IMAGE_0%%)
  ## Reconnaissance (or ## Recon)
  ### Port Scan
  (NO INTRODUCTION IN BETWEEN!)

### 3. CRITICAL STRUCTURAL & CONTENT RULES:

1. **UNIFIED COMMAND & VERBATIM OUTPUT (NEVER SPLIT, NEVER TRUNCATE)**:
   - The command AND its terminal output MUST be together in the EXACT SAME single code block:
     \`\`\`bash:command
     $ <command>
     <verbatim output>
     \`\`\`
   - NEVER create a separate code block for the command and a second code block for the output!
   - NEVER write "*Output:*" or "Output:" between code blocks!
   - **NEVER TRUNCATE, SUMMARIZE, OR ELIDE TERMINAL OUTPUTS WITH "..."**:
     * If a command like \`whoami /all\`, \`Get-CimInstance\`, \`icacls\`, \`nmap\`, or \`ffuf\` produced detailed output in the raw notes, you MUST preserve that complete output VERBATIM!
     * Do NOT replace group lists, user privileges, SIDs, or directory listings with "..." or "S-1-5-21-...". Keep the exact text. Full terminal output is crucial technical evidence for a professional report.
   - Prefix commands with a standard shell prompt ('$ ' or '# ' for Linux, 'PS C:\\...>' for PowerShell, 'C:\\...>' for Windows cmd, or custom prompt for interactive shells).
   - Immediately AFTER the unified code block, provide the explanation: what was run, why it was run, and what the output reveals.

2. **MACHINE IMAGE MUST BE AT THE VERY TOP**:
   - \`%%NOTION_IMAGE_0%%\` is the Machine Avatar / Badge.
   - It MUST be placed at the very top of the writeup, right under the main \`# ${machineName}\` title, before the Reconnaissance / Port Scan section.

3. **COMPREHENSIVE EXPLANATIONS FOR EVERY SCREENSHOT (NO UNEXPLAINED IMAGES)**:
   - NEVER place screenshots back-to-back without detailed pedagogical explanation between them!
   - Immediately BEFORE each screenshot: explain the operational purpose, what action was taken (e.g. which button was pressed, which link was clicked, which request was sent).
   - Immediately AFTER each screenshot: break down what is displayed:
     * Explain what is visible on the screen, window, or browser tab.
     * Explain what any error codes, URLs, status banners, or dialog texts mean.
     * Explain why this observation is critical to the methodology and how it leads to the next step.

4. **DEEP TECHNICAL EXPLANATIONS OF VULNERABILITIES & ATTACK VECTORS (0xdf DEPTH)**:
   - Deeply explain the technical architecture of what is being exploited, including:
     * **Kiosk Environments & Breakouts**:
       - What is a Kiosk? Explain Windows Kiosk mode (Assigned Access / Shell Launcher): locked-down endpoints (e.g. airline check-in, retail terminals) intended to restrict users to a single dedicated app while hiding the desktop, taskbar, Explorer, and command line.
       - Why did the device/scanner break and reveal an error message? When hardware components (like document readers or printers) are powered off or disconnected via backend panels, client desktop software often fails to handle device I/O errors gracefully, crashing and exposing an unhandled exception dialog (e.g. \`SCN-ERR-4092\`).
       - Why is an error dialog vulnerable? Desktop error dialogs containing clickable hyperlinked URLs force the Windows shell to launch the default system browser (Microsoft Edge) within the kiosk session.
       - Explain ALL exploitable breakout routes once a browser is accessible:
         1. Open File Dialog (\`Ctrl + O\` or browser menus) to browse the filesystem, locate system binaries (\`cmd.exe\`, \`powershell.exe\`), and execute them directly.
         2. File URI protocol: typing \`file:///C:/\` or \`file:///C:/Windows/System32/cmd.exe\` in the address bar.
         3. Print to PDF / Save As dialogs (\`Ctrl + P\` / \`Ctrl + S\`) to spawn a native Windows Explorer dialog, allowing right-clicking files to open/run or launching cmd from the path bar.
         4. Windows shortcut / protocol handlers (e.g., \`ms-settings:\`, \`about:flags\`, DevTools \`F12\`).
     * **Privilege Escalation & High-Privilege Groups**:
       - Explain why non-standard group memberships (e.g., \`Printer Administrators\`) are dangerous.
       - Explain file/folder permission auditing with \`icacls\`: detail permission masks such as \`plugins KIOSK-042\\Printer Administrators:(OI)(CI)(M)\` (Object Inherit, Container Inherit, Modify) and explain why write access to service directories is fatal.
       - Explain DLL Hijacking / Plugin Injection: when a service running as \`NT AUTHORITY\\SYSTEM\` (or LocalSystem) automatically scans and loads all \`.dll\` files from a writable \`plugins/\` directory upon starting/restarting, dropping a reverse shell DLL results in immediate SYSTEM-level code execution.
     * **AI Bot & Prompt Injections**:
       - If an AI chatbot or prompt injection is present, explain how the bot was prompted to reveal operator/bypass codes and how those bypass codes were leveraged.
     * **Database & Service Misconfigurations**:
       - If database attacks or impersonation are present, explain the exact queries and permission checks used to verify privilege escalation.
     * **Custom Scripts**:
       - If custom Python or Bash scripts are used in the notes, display the code and explain what the script automates and how it functions.

5. **100% METHODOLOGY & SCREENSHOT PRESERVATION**:
   - Retain every single phase in chronological order:
     * Initial Port Scan (Nmap, rustscan, etc.)
     * Service Enumeration (SMB, RPC, LDAP, DNS, Web, etc. — retain even negative/empty findings to document methodology)
     * Directory Brute-Forcing, Subdomain Fuzzing, or API Discovery
     * Vulnerability Identification & Exploitation
     * Custom Automation / Exploit Scripts (explain purpose, show code, show execution & output)
     * Initial Foothold & Reverse Shell
     * User Flag capture
     * Internal Enumeration & Privilege Escalation
     * Root / Administrator Flag capture
   - You MUST retain EVERY SINGLE image token (\`![Caption](%%NOTION_IMAGE_X%%)\`) in its exact logical place.

6. **FACTUAL ACCURACY**:
   - Retain all actual IPs, hostnames, usernames, passwords, hashes, tokens, and flags verbatim from the raw notes.

7. **OUTPUT FORMAT**:
   - Output ONLY the YAML frontmatter block followed immediately by the clean Markdown walkthrough ready for publication. Do not add chat greetings or closing remarks.`;
}

export const WRITEUP_REFINER_PROMPT = buildRefinerPrompt('Target Machine');

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

export interface RefineOptions {
  customApiKey?: string;
  pageTitle?: string;
}

/**
 * Refines raw markdown notes using Gemini Flash.
 * Preserves 100% of images, all methodology steps, and extracts writeup metadata.
 */
export async function refineWriteupContent(
  rawMarkdown: string,
  optionsOrApiKey?: string | RefineOptions
): Promise<RefinedWriteupResult> {
  let customApiKey: string | undefined;
  let pageTitle: string | undefined;

  if (typeof optionsOrApiKey === 'string') {
    customApiKey = optionsOrApiKey;
  } else if (optionsOrApiKey && typeof optionsOrApiKey === 'object') {
    customApiKey = optionsOrApiKey.customApiKey;
    pageTitle = optionsOrApiKey.pageTitle;
  }

  const apiKey = customApiKey || getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY=your_key to .env.local'
    );
  }

  // Resolve target machine name
  let machineTitle = pageTitle?.trim();
  if (!machineTitle) {
    const titleMatch = rawMarkdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      machineTitle = titleMatch[1].trim();
    } else {
      machineTitle = 'Machine Walkthrough';
    }
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
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ];

  const imageDirectives = imageTokens.length > 0
    ? `\n\n### MANDATORY IMAGE TOKENS & PLACEMENT:
There are exactly ${imageTokens.length} screenshot images in these notes. You MUST include ALL ${imageTokens.length} image tokens (from %%NOTION_IMAGE_0%% to %%NOTION_IMAGE_${imageTokens.length - 1}%%) in your refined walkthrough:
- %%NOTION_IMAGE_0%%: Machine Avatar / Badge (MUST be placed at the very top of the writeup, right under the title "# ${machineTitle}"!)
- %%NOTION_IMAGE_1%% through %%NOTION_IMAGE_${imageTokens.length - 1}%%: Evidence screenshots and command output captures.
CRITICAL SCREENSHOT PRESENTATION:
- Retain all of them directly in their corresponding sections based on the context in the raw notes.
- NEVER place two images directly adjacent to each other without explanation between them!
- Every single screenshot MUST be preceded by an explanation of what action or operational step was taken.
- Every single screenshot MUST be followed immediately by a technical breakdown of what is shown on screen, why it happened, and what it indicates for exploitation.`
    : '';

  const systemPrompt = buildRefinerPrompt(machineTitle);

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemPrompt + imageDirectives },
          { text: `Raw writeup notes for target machine "${machineTitle}" to refine into a comprehensive walkthrough:\n\n${tokenizedMarkdown}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 32768,
    },
  };

  const modelErrors: string[] = [];

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(35000),
      });

      // If temporary high-demand spike (503/429), retry once after a 2-second backoff
      if (response.status === 503 || response.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(35000),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const refinedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (refinedText) {
          // 2. Parse frontmatter metadata and strip Introduction section
          const parsed = parseFrontmatterAndContent(refinedText);
          let restoredText = parsed.refinedMarkdown;

          // Enforce correct H1 machine title
          if (!restoredText.startsWith('# ')) {
            restoredText = `# ${machineTitle}\n\n` + restoredText;
          } else {
            restoredText = restoredText.replace(/^#\s+[^\r\n]+/m, `# ${machineTitle}`);
          }

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
