import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhtzmnhmdlmsuxivwgua.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHptbmhtZGxtc3V4aXZ3Z3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDIwNzEsImV4cCI6MjEwMzk3ODA3MX0.ub5aHUHbTpLc6tvzcFVuCp8CE6JpOqXi9NBCDpIXKbg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const GITHUB_REPO = '0xnullc0de/0xnullc0de.github.io';
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/master`;

async function fetchPostsList() {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/_posts`, {
    headers: { 'User-Agent': 'Node-Migration-Script' },
  });
  if (!res.ok) {
    throw new Error(`Failed to list _posts: ${res.statusText}`);
  }
  const files = await res.json();
  return files.filter((f) => f.name.endsWith('.md') && !f.name.startsWith('.'));
}

function parseFrontmatterAndBody(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const frontText = match[1];
  const body = match[2];
  const meta = {};

  let currentKey = null;
  let inList = false;

  for (const line of frontText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- ') && currentKey) {
      if (!Array.isArray(meta[currentKey])) meta[currentKey] = [];
      meta[currentKey].push(trimmed.slice(2).trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      currentKey = key;
      if (val) {
        meta[key] = val;
      } else {
        meta[key] = [];
      }
    }
  }

  return { meta, body };
}

function normalizeTitle(title) {
  return title
    .replace(/^HTB\s*-\s*/i, '')
    .replace(/^Lab\s*-\s*@?/i, '')
    .replace(/\s+Walkthrough$/i, '')
    .replace(/\s*@\s*HackTheBox$/i, '')
    .trim();
}

function deriveDifficulty(tags, body) {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.includes('insane') || body.toLowerCase().includes('insane-difficulty')) return 'Insane';
  if (lower.includes('hard') || body.toLowerCase().includes('hard-difficulty')) return 'Hard';
  if (lower.includes('medium') || body.toLowerCase().includes('medium-difficulty')) return 'Medium';
  if (lower.includes('easy') || body.toLowerCase().includes('easy-difficulty')) return 'Easy';
  return 'Medium';
}

function deriveOs(tags, body) {
  const lower = tags.map((t) => t.toLowerCase());
  if (lower.includes('active-directory') || lower.includes('windows')) return 'Windows';
  if (lower.includes('linux')) return 'Linux';
  if (body.toLowerCase().includes('windows domain controller')) return 'Windows';
  if (body.toLowerCase().includes('linux machine')) return 'Linux';
  return 'Linux';
}

function derivePlatform(tags, categories, body) {
  const all = [...tags, ...(Array.isArray(categories) ? categories : [categories])].map((s) => String(s).toLowerCase());
  if (all.some((x) => x.includes('vulnlab'))) return 'VulnLab';
  if (all.some((x) => x.includes('tryhackme') || x.includes('thm'))) return 'THM';
  if (all.some((x) => x.includes('prolab') || x.includes('pro lab'))) return 'HTB Pro Lab';
  return 'HTB';
}

function extractSummary(body, title) {
  // Grab the text following ## Introduction or intro paragraph
  const introMatch = body.match(/##\s*Intro(?:duction)?\s*\n+([\s\S]*?)(?=\n+##|\n+---|$)/i);
  if (introMatch && introMatch[1].trim()) {
    return introMatch[1].trim().split('\n\n')[0].replace(/\n/g, ' ').trim();
  }
  const firstParagraph = body.split('\n\n').find((p) => p.trim() && !p.startsWith('#') && !p.startsWith('`'));
  if (firstParagraph) {
    return firstParagraph.replace(/\n/g, ' ').trim();
  }
  return `${title} penetration testing walkthrough and technical breakdown.`;
}

function resolveImages(body, mediaSubpath) {
  let resolved = body;
  const sub = mediaSubpath ? mediaSubpath.replace(/^\/+|\/+$/g, '') : '';

  // 1. Replace relative markdown images ![alt](image.png)
  resolved = resolved.replace(/!\[(.*?)\]\((?!https?:\/\/)(.*?)\)/g, (match, alt, src) => {
    let cleanSrc = src.replace(/^\/+/, '');
    if (cleanSrc.startsWith('assets/')) {
      return `![${alt}](${RAW_BASE}/${cleanSrc})`;
    }
    if (sub) {
      return `![${alt}](${RAW_BASE}/${sub}/${cleanSrc})`;
    }
    return `![${alt}](${RAW_BASE}/assets/images/${cleanSrc})`;
  });

  return resolved;
}

async function main() {
  console.log('🔍 Fetching existing writeups from Supabase...');
  const { data: existingRows, error: fetchErr } = await supabase
    .from('writeups')
    .select('slug, title');

  if (fetchErr) {
    console.error('Error fetching existing writeups:', fetchErr);
    process.exit(1);
  }

  const existingSlugs = new Set((existingRows || []).map((r) => r.slug.toLowerCase()));
  const existingTitles = new Set((existingRows || []).map((r) => r.title.toLowerCase().replace(/[^a-z0-9]/g, '')));

  console.log(`Found ${existingSlugs.size} existing writeups in database.`);

  console.log('📂 Fetching post files from GitHub repo:', GITHUB_REPO);
  const posts = await fetchPostsList();
  console.log(`Discovered ${posts.length} post files in _posts.`);

  let importedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    // Extract date and name from filename: e.g. 2026-5-19-timelapse-hackthebox.md
    const fileMatch = post.name.match(/^(\d{4}-\d{1,2}-\d{1,2})-(.*)\.md$/);
    const dateStr = fileMatch ? fileMatch[1] : new Date().toISOString().split('T')[0];
    const rawName = fileMatch ? fileMatch[2] : post.name.replace(/\.md$/, '');

    // Form candidate slug
    const cleanMachineName = rawName.replace(/-hackthebox$|-vulnlab$|-thm$/, '');
    const candidateSlug = `htb-${cleanMachineName}`;
    const altSlug = cleanMachineName;

    // Check if already in database
    const alreadyExists =
      existingSlugs.has(candidateSlug.toLowerCase()) ||
      existingSlugs.has(altSlug.toLowerCase()) ||
      existingSlugs.has(rawName.toLowerCase()) ||
      existingTitles.has(cleanMachineName.toLowerCase().replace(/[^a-z0-9]/g, ''));

    if (alreadyExists) {
      console.log(`⏭️  SKIP (Already exists): ${post.name} -> matches slug '${candidateSlug}'`);
      skippedCount++;
      continue;
    }

    console.log(`📥 IMPORTING: ${post.name} ...`);

    // Download raw markdown
    const fileRes = await fetch(post.download_url);
    if (!fileRes.ok) {
      console.warn(`Failed to download ${post.name}: ${fileRes.status}`);
      continue;
    }
    const rawContent = await fileRes.text();
    const { meta, body } = parseFrontmatterAndBody(rawContent);

    const title = meta.title ? normalizeTitle(meta.title) : cleanMachineName.charAt(0).toUpperCase() + cleanMachineName.slice(1);
    const tags = Array.isArray(meta.tags) ? meta.tags : ['Active Directory', 'Pentest'];
    const difficulty = deriveDifficulty(tags, body);
    const os = deriveOs(tags, body);
    const platform = derivePlatform(tags, meta.categories, body);
    const summary = extractSummary(body, title);
    const formattedContent = resolveImages(body, meta.media_subpath);

    // Extract foothold & privesc if mentioned
    let foothold = '';
    let privesc = '';
    const footholdMatch = body.match(/foothold|initial access/i);
    if (footholdMatch) {
      foothold = `${title} initial access and service exploitation.`;
    }
    const privescMatch = body.match(/privilege escalation|privesc/i);
    if (privescMatch) {
      privesc = `Internal escalation to Administrator / root.`;
    }

    const record = {
      slug: candidateSlug,
      title,
      platform,
      difficulty,
      os,
      tags: tags.map((t) => t.replace(/^#/, '')).filter(Boolean),
      date_published: dateStr,
      retirement_date: dateStr,
      is_retired: true,
      points: difficulty === 'Insane' ? 50 : difficulty === 'Hard' ? 40 : difficulty === 'Medium' ? 30 : 20,
      featured: false,
      summary,
      initial_access_vector: foothold,
      priv_esc_vector: privesc,
      preview_content: formattedContent.slice(0, 800) + '\n\n...',
      full_content: formattedContent,
      pdf_path: null,
      image_paths: [],
      updated_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase
      .from('writeups')
      .upsert(record, { onConflict: 'slug' });

    if (insertErr) {
      console.error(`❌ Failed to insert ${candidateSlug}:`, insertErr.message);
    } else {
      console.log(`✅ Successfully imported: "${title}" (${candidateSlug}) [${platform} • ${difficulty} • ${os}]`);
      existingSlugs.add(candidateSlug.toLowerCase());
      importedCount++;
    }
  }

  console.log('\n==========================================');
  console.log(`🏁 MIGRATION COMPLETE!`);
  console.log(`   Imported: ${importedCount} writeups`);
  console.log(`   Skipped (already on site): ${skippedCount} writeups`);
  console.log('==========================================\n');
}

main().catch(console.error);
