import { Tool } from '@/types';

export const fallbackTools: Tool[] = [
  {
    id: 'd0000001-0000-4000-a000-000000000001',
    name: 'BackupOperator-Dump',
    description: 'Automation script for leveraging Windows Backup Operators group privileges (SeBackupPrivilege / SeRestorePrivilege) to safely extract NTDS.dit and the SYSTEM registry hive via disk shadow or robocopy without interactive prompt lag.',
    language: 'Python',
    category: 'AD Exploitation',
    tags: ['Active Directory', 'BackupOperators', 'NTDS.dit', 'PrivEsc', 'SeBackupPrivilege'],
    githubUrl: 'https://github.com/0xnullc0de',
    relatedWriteupSlug: 'htb-blackfield',
    displayOrder: 1,
    createdAt: '2024-05-10',
  },
  {
    id: 'd0000002-0000-4000-a000-000000000002',
    name: 'BloodHound Quick-Triage',
    description: 'CLI triage helper and Cypher query launcher to rapidly identify high-probability privilege escalation pathways, kerberoastable admins, and unconstrained delegation paths from Neo4j.',
    language: 'Python',
    category: 'AD Exploitation',
    tags: ['Active Directory', 'BloodHound', 'Cypher', 'Neo4j', 'Recon'],
    githubUrl: 'https://github.com/0xnullc0de',
    displayOrder: 2,
    createdAt: '2024-06-15',
  },
  {
    id: 'd0000003-0000-4000-a000-000000000003',
    name: 'Chisel-Socks AutoPivot',
    description: 'Lightweight bash automation script to spin up reverse Chisel tunnels, configure proxychains automatically, and monitor SOCKS5 port forwarding stability during multi-hop lab engagements.',
    language: 'Bash',
    category: 'Network Pivoting',
    tags: ['Pivoting', 'Chisel', 'Proxychains', 'Tunneling', 'Pro Labs'],
    githubUrl: 'https://github.com/0xnullc0de',
    relatedWriteupSlug: 'htb-prolab-dante',
    displayOrder: 3,
    createdAt: '2024-08-01',
  },
];
