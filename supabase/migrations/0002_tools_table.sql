-- Create tools table in Supabase
create table if not exists public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  language text not null default 'Python',
  category text not null default 'AD Exploitation',
  tags text[] not null default '{}',
  github_url text,
  related_writeup_slug text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tools_display_order_idx on public.tools (display_order);

alter table public.tools enable row level security;

grant select on public.tools to anon, authenticated;
grant all on public.tools to service_role;

drop trigger if exists tools_set_updated_at on public.tools;
create trigger tools_set_updated_at before update on public.tools
for each row execute function public.set_updated_at();

-- Insert initial security tools
insert into public.tools (name, description, language, category, tags, github_url, related_writeup_slug, display_order)
values 
(
  'BackupOperator-Dump',
  'Automation script for leveraging Windows Backup Operators group privileges (SeBackupPrivilege / SeRestorePrivilege) to safely extract NTDS.dit and the SYSTEM registry hive via disk shadow or robocopy without interactive prompt lag.',
  'Python',
  'AD Exploitation',
  array['Active Directory', 'BackupOperators', 'NTDS.dit', 'PrivEsc', 'SeBackupPrivilege'],
  'https://github.com/0xnullc0de',
  'htb-blackfield',
  1
),
(
  'BloodHound Quick-Triage',
  'CLI triage helper and Cypher query launcher to rapidly identify high-probability privilege escalation pathways, kerberoastable admins, and unconstrained delegation paths from Neo4j.',
  'Python',
  'AD Exploitation',
  array['Active Directory', 'BloodHound', 'Cypher', 'Neo4j', 'Recon'],
  'https://github.com/0xnullc0de',
  null,
  2
),
(
  'Chisel-Socks AutoPivot',
  'Lightweight bash automation script to spin up reverse Chisel tunnels, configure proxychains automatically, and monitor SOCKS5 port forwarding stability during multi-hop lab engagements.',
  'Bash',
  'Network Pivoting',
  array['Pivoting', 'Chisel', 'Proxychains', 'Tunneling', 'Pro Labs'],
  'https://github.com/0xnullc0de',
  'htb-prolab-dante',
  3
)
on conflict do nothing;
