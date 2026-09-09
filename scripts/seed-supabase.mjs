import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bhtzmnhmdlmsuxivwgua.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodHptbmhtZGxtc3V4aXZ3Z3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDIwNzEsImV4cCI6MjEwMzk3ODA3MX0.ub5aHUHbTpLc6tvzcFVuCp8CE6JpOqXi9NBCDpIXKbg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read writeups data from file
const writeupsFilePath = path.join(__dirname, '../src/data/writeups.ts');
const rawTs = fs.readFileSync(writeupsFilePath, 'utf-8');

// We parse the exported writeups
// For clean seeding, let's import the data or define the list
import('../src/data/writeups.ts').catch(() => {});

// Let's create the records array directly matching writeups.ts
const writeupsList = [
  {
    slug: 'htb-keeper',
    title: 'Keeper',
    platform: 'HTB',
    difficulty: 'Easy',
    os: 'Linux',
    tags: ['Web', 'Default Credentials', 'KeePass', 'CVE-2023-32784', 'Putty'],
    date_published: '2024-05-18',
    retirement_date: '2024-05-15',
    is_retired: true,
    points: 20,
    ip_address: '10.10.11.227',
    featured: true,
    initial_access_vector: 'Default RT ticketing credentials leading to KeePass database dump',
    priv_esc_vector: 'Exploiting KeePass CVE-2023-32784 memory dump to reconstruct master password',
    summary: 'Keeper is an easy Linux machine showcasing default credentials on Request Tracker (RT) followed by memory extraction of KeePassXC master key to unlock root SSH keys.',
    preview_content: `## 1. Initial Reconnaissance & Port Scanning\n\nWe initiate scanning using automated \`nmap\` with default NSE scripts and service detection against \`10.10.11.227\`:\n\n\`\`\`bash\n# Nmap 7.94 scan initiated\n$ nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/all_ports.txt 10.10.11.227\n\`\`\`\n\nNavigating to port 80 redirects to \`keeper.htb\`. The web application is running **Request Tracker (RT) 4.4.4**.`,
    full_content: `## 1. Initial Reconnaissance & Port Scanning\n\nWe initiate scanning using automated \`nmap\` with default NSE scripts and service detection against \`10.10.11.227\`:\n\n\`\`\`bash\n# Nmap 7.94 scan initiated\n$ nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/all_ports.txt 10.10.11.227\n\`\`\`\n\nNavigating to port 80 redirects to \`keeper.htb\`.\n\n---\n\n## 2. Foothold: Default Credentials in Request Tracker\n\nDefault administrative credentials on RT: \`root:password\`.\nUser profile for \`lnorgaard\` reveals SSH password: \`Welcome2023!\`.\n\n---\n\n## 3. Privilege Escalation: KeePass CVE-2023-32784\n\nExtracting KeePass process dump uncovers the master key \`rødgrød med fløde\`. Inside \`passwords.kdbx\` lies root's PuTTY SSH private key. Converting via \`puttygen\` yields root shell.`,
    password: null,
  },
  {
    slug: 'htb-cicada',
    title: 'Cicada',
    platform: 'HTB',
    difficulty: 'Medium',
    os: 'Active Directory',
    tags: ['Active Directory', 'RID Cycling', 'Kerberoasting', 'SMB', 'LAPS', 'Backup Operators'],
    date_published: '2024-08-12',
    retirement_date: '2026-12-31',
    is_retired: false,
    points: 30,
    ip_address: '10.10.11.35',
    featured: true,
    initial_access_vector: 'Guest access on SMB share revealing cleartext password for service account',
    priv_esc_vector: 'Backup Operators privilege abuse via SeBackupPrivilege to extract NTDS.dit',
    summary: 'Cicada is an active medium Active Directory machine featuring anonymous SMB enumeration, RID cycling, and privilege abuse via Windows Backup Operators group.',
    preview_content: `## 1. Initial Reconnaissance & Domain Enumeration\n\nScanning the host reveals an Active Directory Domain Controller (\`CICADA.LOCAL\`):\n\n\`\`\`bash\n$ nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269 -oN nmap/dc_ports.txt 10.10.11.35\n\`\`\`\n\nTesting anonymous and guest access with \`crackmapexec\` shows readable shares: \`HR\` and \`IPC$\`.`,
    full_content: `## 1. Initial Reconnaissance & Domain Enumeration\n\nScanning the host reveals an Active Directory Domain Controller (\`CICADA.LOCAL\`):\n\n\`\`\`bash\n$ nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269 -oN nmap/dc_ports.txt 10.10.11.35\n\`\`\`\n\n---\n\n## 2. Share Enumeration & Password Leak\n\nConnecting to HR share via smbclient reveals \`Password_Policy_Update.txt\` with default credential pattern \`Cicada$M4p!2024\`.\n\n---\n\n## 3. RID Cycling & Password Spray\n\nUsing lookupsid via impacket extracts domain user accounts. Spraying the found password unlocks user \`david.b\`.\n\n---\n\n## 4. SeBackupPrivilege Exploitation to Domain Admin\n\nUser is member of Backup Operators with \`SeBackupPrivilege\`. Copying \`ntds.dit\` and \`system.hive\` dumps the Domain Administrator NTLM hash.`,
    password: 'HTB{C1c4d4_4D_pwn3d_S3Backup_r00t_2024!xK9mNqL7}',
  },
  {
    slug: 'thm-wreath',
    title: 'Wreath Network',
    platform: 'THM',
    difficulty: 'Hard',
    os: 'Multi',
    tags: ['Pivoting', 'Active Directory', 'Chisel', 'Proxychains', 'BloodHound', 'AV Evasion'],
    date_published: '2024-03-10',
    retirement_date: '2024-01-01',
    is_retired: true,
    points: 50,
    featured: true,
    initial_access_vector: 'MiniWeb CVE-2019-10650 RCE on edge web server',
    priv_esc_vector: 'Unquoted service path escalation leading to local Administrator and network pivot',
    summary: 'Wreath is a realistic multi-network penetration testing network involving dual-homed machine pivots, SOCKS proxies, AV evasion, and Windows domain takeover.',
    preview_content: `## 1. Edge Web Server Assessment\n\nWe begin on the perimeter target (\`10.200.x.200\`). Port scan reveals MiniWeb 0.8.2 on port 80 and Apache on 443.\nMiniWeb 0.8.2 contains a known stack buffer overflow (\`CVE-2019-10650\`).`,
    full_content: `## 1. Edge Web Server Assessment\n\nWe begin on the perimeter target (\`10.200.x.200\`). Port scan reveals MiniWeb 0.8.2.\n\n---\n\n## 2. Exploiting MiniWeb & Reverse Shell\n\nSending EIP overwrite payload lands a shell on port 4444.\n\n---\n\n## 3. Pivoting with Chisel & SOCKS5\n\nChisel reverse SOCKS tunnel pivots into isolated subnet \`10.200.x.0/24\`.\n\n---\n\n## 4. Internal Git Server & Takeover\n\nUnauthenticated Gitstack API command injection grants SYSTEM privileges.`,
    password: null,
  },
  {
    slug: 'htb-sauna',
    title: 'Sauna',
    platform: 'HTB',
    difficulty: 'Easy',
    os: 'Active Directory',
    tags: ['Active Directory', 'AS-REP Roasting', 'BloodHound', 'Mimikatz', 'DCSync'],
    date_published: '2023-11-20',
    retirement_date: '2023-09-01',
    is_retired: true,
    points: 20,
    featured: false,
    initial_access_vector: 'Username harvesting from corporate team page and AS-REP roasting',
    priv_esc_vector: 'BloodHound path discovery: GetChangesAll permissions enabling DCSync attack',
    summary: 'Classic Active Directory machine teaching OSINT username generation, Kerberos AS-REP roasting, Winlogon credential recovery, and DCSync privilege escalation.',
    preview_content: `## 1. Reconnaissance & OSINT Name Scraping\n\nPort scan against Sauna (\`10.10.10.175\`) reveals typical Domain Controller footprint.\nScraping the 'About Us' staff roster produces employee usernames.`,
    full_content: `## 1. Reconnaissance & OSINT Name Scraping\n\nScraping roster produces user accounts for AS-REP roasting.\n\n---\n\n## 2. AS-REP Roasting with GetNPUsers\n\n\`impacket-GetNPUsers\` retrieves Kerberos ticket for \`fsmith\`. Hashcat cracks password: \`Thestrokes23\`.\n\n---\n\n## 3. Winlogon Credentials & DCSync\n\nWinPEAS extracts plaintext AutoLogon password for \`svc_loanmanager\`. BloodHound analysis confirms \`DS-Replication-Get-Changes-All\` rights, permitting secretsdump DCSync.`,
    password: null,
  },
  {
    slug: 'htb-blackfield',
    title: 'Blackfield',
    platform: 'HTB',
    difficulty: 'Hard',
    os: 'Active Directory',
    tags: ['Active Directory', 'RPC', 'SMB', 'Forensics', 'LSASS', 'Privilege Escalation'],
    date_published: '2024-07-04',
    retirement_date: '2026-11-15',
    is_retired: false,
    points: 40,
    featured: false,
    initial_access_vector: 'RPC user enumeration and SMB share file audit',
    priv_esc_vector: 'Backup Operators privilege abuse and LSASS memory dump extraction',
    summary: 'Active hard Windows box focused on thorough domain enumeration, RPC lookupsids, LSASS forensics, and Active Directory permission chaining.',
    preview_content: `## 1. Initial Reconnaissance\n\nBlackfield (\`10.10.10.192\`) is a full Windows Server 2019 Active Directory Domain Controller.\nAnonymous RPC binding allows querying domain accounts: \`audit2020\`, \`support\`.`,
    full_content: `## 1. Initial Reconnaissance\n\nAnonymous RPC enumdomusers discovers domain users.\n\n---\n\n## 2. Password Reset on Support Account\n\nAccount \`audit2020\` has \`ForceChangePassword\` extended rights over \`support\`.\n\n---\n\n## 3. LSASS Dump & Domain Compromise\n\nForensic share contains disk snapshot with \`lsass.DMP\`. Extracting NT hash for \`svc_backup\` enables SeBackupPrivilege attack against NTDS.dit.`,
    password: 'HTB{Bl4ckf13ld_NTDS_3xtr4ct3d_LSASS_dump_pwn3d!vZ2wXpR8}',
  },
  {
    slug: 'thm-alfred',
    title: 'Alfred',
    platform: 'THM',
    difficulty: 'Easy',
    os: 'Windows',
    tags: ['Jenkins', 'Groovy', 'Token Impersonation', 'Juicy Potato', 'SeImpersonate'],
    date_published: '2023-10-15',
    retirement_date: '2023-01-01',
    is_retired: true,
    points: 15,
    featured: false,
    initial_access_vector: 'Default admin:admin credentials on Jenkins CI console',
    priv_esc_vector: 'Abusing SeImpersonatePrivilege with JuicyPotato to spawn SYSTEM process',
    summary: 'Introductory Windows machine covering Jenkins Groovy reverse shells and token impersonation privilege escalation via Juicy Potato.',
    preview_content: `## 1. Scanning & Port Enumeration\n\nScan reveals Jenkins CI server on port 8080.\nTesting default credentials \`admin:admin\` grants access to Jenkins Script Console.`,
    full_content: `## 1. Scanning & Port Enumeration\n\nJenkins on 8080 authenticated with \`admin:admin\`.\n\n---\n\n## 2. Groovy Reverse Shell\n\nExecuting Groovy reverse shell via Script Console spawns initial shell.\n\n---\n\n## 3. SeImpersonatePrivilege Escalation\n\nService account holds \`SeImpersonatePrivilege\`. Executing Juicy Potato with BITS CLSID spawns shell as \`NT AUTHORITY\\SYSTEM\`.`,
    password: null,
  }
];

async function seed() {
  console.log('Seeding writeups to Supabase...');

  for (const item of writeupsList) {
    let passwordHash = null;
    if (item.password) {
      passwordHash = await bcrypt.hash(item.password, 10);
      console.log(`Hashed password for ${item.slug}: ${passwordHash.substring(0, 15)}...`);
    }

    const record = {
      slug: item.slug,
      title: item.title,
      platform: item.platform,
      difficulty: item.difficulty,
      os: item.os,
      tags: item.tags,
      date_published: item.date_published,
      retirement_date: item.retirement_date ? new Date(item.retirement_date).toISOString() : null,
      is_retired: item.is_retired,
      points: item.points,
      ip_address: item.ip_address,
      featured: item.featured,
      summary: item.summary,
      initial_access_vector: item.initial_access_vector,
      priv_esc_vector: item.priv_esc_vector,
      preview_content: item.preview_content,
      full_content: item.full_content,
      password_hash: passwordHash,
      pdf_path: null,
      image_paths: [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('writeups')
      .upsert(record, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error(`Error inserting ${item.slug}:`, error.message);
    } else {
      console.log(`✓ Inserted/Updated writeup: ${item.slug} (ID: ${data[0]?.id})`);
    }
  }

  console.log('Finished seeding writeups!');
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
