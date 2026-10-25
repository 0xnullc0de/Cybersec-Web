'use client';

import React, { useState, useMemo } from 'react';
import { 
  Shield, ChevronDown, ChevronUp, ExternalLink, ArrowRight, GitFork, 
  Terminal, Lock, CheckCircle2, Server, Key, AlertTriangle, Zap
} from 'lucide-react';
import { Writeup } from '@/types';

export interface MitreTTP {
  id: string;
  name: string;
  tactic: 'Reconnaissance' | 'Initial Access' | 'Execution' | 'Persistence' | 'Privilege Escalation' | 'Credential Access' | 'Discovery' | 'Lateral Movement';
  subTechnique?: string;
  url: string;
}

export interface KillChainStep {
  step: number;
  phase: string;
  action: string;
  technique: string;
  mitreId: string;
  target: string;
  status: 'completed' | 'checkpoint' | 'root';
}

const TACTIC_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Reconnaissance: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  'Initial Access': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Execution: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Persistence: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Privilege Escalation': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Credential Access': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  Discovery: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  'Lateral Movement': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
};

// Comprehensive Automated Tag & Keyword Mapping to Official MITRE ATT&CK TTPs
export const COMPREHENSIVE_MITRE_MAP: Record<string, MitreTTP> = {
  // Credential Access
  asreproasting: { id: 'T1558.004', name: 'Steal/Forge Kerberos: AS-REP Roasting', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1558/004/' },
  kerberoasting: { id: 'T1558.003', name: 'Steal/Forge Kerberos: Kerberoasting', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1558/003/' },
  lsass: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/001/' },
  mimikatz: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/001/' },
  pypykatz: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/001/' },
  backupoperators: { id: 'T1003.003', name: 'OS Credential Dumping: NTDS.dit', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/003/' },
  diskshadow: { id: 'T1003.003', name: 'OS Credential Dumping: NTDS Snapshot', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/003/' },
  ntds: { id: 'T1003.003', name: 'OS Credential Dumping: NTDS.dit', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/003/' },
  dcsync: { id: 'T1003.006', name: 'OS Credential Dumping: DCSync', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/006/' },
  secretsdump: { id: 'T1003.002', name: 'OS Credential Dumping: SAM Hive', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/002/' },
  sam: { id: 'T1003.002', name: 'OS Credential Dumping: SAM Hive', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1003/002/' },
  bruteforce: { id: 'T1110', name: 'Brute Force Password Guessing', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1110/' },
  hydra: { id: 'T1110.001', name: 'Password Spraying / Brute Force', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1110/001/' },
  wireshark: { id: 'T1040', name: 'Network Sniffing: Credential Interception', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1040/' },
  pcap: { id: 'T1040', name: 'Network Sniffing: PCAP Forensics', tactic: 'Credential Access', url: 'https://attack.mitre.org/techniques/T1040/' },

  // Initial Access
  sqli: { id: 'T1190', name: 'Exploit Public App: SQL Injection', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  sqlinjection: { id: 'T1190', name: 'Exploit Public App: SQL Injection', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  fileupload: { id: 'T1190', name: 'Exploit Public App: Unrestricted Upload', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  rce: { id: 'T1190', name: 'Exploit Public-Facing App: Remote Code Exec', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  lfi: { id: 'T1083', name: 'File and Directory Discovery: LFI', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1083/' },
  deserialization: { id: 'T1190', name: 'Exploit Public App: Insecure Deserialization', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  web: { id: 'T1190', name: 'Exploit Public-Facing Web Application', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1190/' },
  defaultcredentials: { id: 'T1078.003', name: 'Valid Accounts: Default Credentials', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1078/003/' },
  ftp: { id: 'T1078.003', name: 'Valid Accounts: Anonymous/Cleartext FTP', tactic: 'Initial Access', url: 'https://attack.mitre.org/techniques/T1078/003/' },

  // Privilege Escalation
  sudo: { id: 'T1548.003', name: 'Abuse Elevation Control: Sudo Privileges', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1548/003/' },
  suid: { id: 'T1548.001', name: 'Abuse Elevation Control: Setuid Binary', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1548/001/' },
  capabilities: { id: 'T1548', name: 'Abuse Elevation Control: Linux Capabilities', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1548/' },
  cron: { id: 'T1053.003', name: 'Scheduled Task/Job: Cron Job Hijack', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1053/003/' },
  seimpersonate: { id: 'T1134.001', name: 'Access Token Manipulation: Impersonation', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1134/001/' },
  printspoofer: { id: 'T1134.001', name: 'Access Token Manipulation: Named Pipes', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1134/001/' },
  juicypotato: { id: 'T1134.001', name: 'Access Token Manipulation: BITS/COM', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1134/001/' },
  godpotato: { id: 'T1134.001', name: 'Access Token Manipulation: DCOM Token', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1134/001/' },
  kernel: { id: 'T1068', name: 'Exploitation for Privilege Escalation: Kernel', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1068/' },
  docker: { id: 'T1611', name: 'Escape to Host: Container Breakout', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1611/' },
  alwaysinstallelevated: { id: 'T1548.002', name: 'Bypass UAC: AlwaysInstallElevated MSI', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1548/002/' },
  dllhijacking: { id: 'T1574.001', name: 'Hijack Execution Flow: DLL Search Order', tactic: 'Privilege Escalation', url: 'https://attack.mitre.org/techniques/T1574/001/' },

  // Lateral Movement & Tunneling
  pivoting: { id: 'T1572', name: 'Protocol Tunneling: Multi-Hop SOCKS', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1572/' },
  chisel: { id: 'T1572', name: 'Protocol Tunneling: Reverse Chisel Proxy', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1572/' },
  proxychains: { id: 'T1572', name: 'Protocol Tunneling: Proxychains Routing', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1572/' },
  ligolo: { id: 'T1572', name: 'Protocol Tunneling: TUN Interface Pivoting', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1572/' },
  passthehash: { id: 'T1550.002', name: 'Use Alternate Auth Material: Pass the Hash', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1550/002/' },
  pth: { id: 'T1550.002', name: 'Use Alternate Auth Material: Pass the Hash', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1550/002/' },
  evilwinrm: { id: 'T1021.006', name: 'Remote Services: Windows Remote Management', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1021/006/' },
  winrm: { id: 'T1021.006', name: 'Remote Services: Windows Remote Management', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1021/006/' },
  ssh: { id: 'T1021.004', name: 'Remote Services: SSH Interactive Shell', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1021/004/' },
  smb: { id: 'T1021.002', name: 'Remote Services: SMB/Windows Admin Shares', tactic: 'Lateral Movement', url: 'https://attack.mitre.org/techniques/T1021/002/' },

  // Discovery
  bloodhound: { id: 'T1087.002', name: 'Account Discovery: Domain Account / Graph', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1087/002/' },
  rpc: { id: 'T1087.002', name: 'Account Discovery: RPC User Enumeration', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1087/002/' },
  nmap: { id: 'T1046', name: 'Network Service Discovery: Port Scanning', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1046/' },
  recon: { id: 'T1046', name: 'Network Service Discovery: Active Recon', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1046/' },
  activedirectory: { id: 'T1069.002', name: 'Permission Groups Discovery: Domain Groups', tactic: 'Discovery', url: 'https://attack.mitre.org/techniques/T1069/002/' },

  // Persistence
  forcechangepassword: { id: 'T1098', name: 'Account Manipulation: ForceChangePassword ACE', tactic: 'Persistence', url: 'https://attack.mitre.org/techniques/T1098/' },
};

/**
 * AUTOMATED KILL-CHAIN GENERATOR:
 * Synthesizes the 4 to 5 exploitation phases for ANY writeup completely dynamically
 * from initialAccessVector, privEscVector, tags, OS, and title.
 */
function generateAutomatedKillChain(writeup: Writeup): KillChainStep[] {
  const isAD = writeup.os === 'Active Directory' || writeup.tags.some(t => /activedirectory|domain|kerberos/i.test(t));
  const hasPivoting = writeup.tags.some(t => /pivoting|chisel|tunnel|prolab/i.test(t)) || writeup.platform === 'HTB Pro Lab';
  
  // Phase 1: Recon & Discovery
  const p1: KillChainStep = {
    step: 1,
    phase: 'Recon & Discovery',
    action: isAD 
      ? 'Domain Service Portscan & Protocol Enumeration' 
      : 'Network Portscan & Web Surface Mapping',
    technique: isAD
      ? 'Nmap, RPC Lookupsids, SMB anonymous shares'
      : 'Nmap -sC -sV, Dirsearch / FFUF endpoint discovery',
    mitreId: 'T1046',
    target: writeup.ipAddress ? `${writeup.ipAddress}` : 'Perimeter Services',
    status: 'completed',
  };

  // Phase 2: Initial Foothold
  const initialText = writeup.initialAccessVector || 'Vulnerability exploitation against discovered service';
  const p2: KillChainStep = {
    step: 2,
    phase: 'Initial Foothold',
    action: initialText.length > 55 ? initialText.slice(0, 52) + '...' : initialText,
    technique: writeup.tags.find(t => /sqli|rce|upload|lfi|asrep|ftp|ssh/i.test(t)) || 'Service Exploitation',
    mitreId: writeup.tags.some(t => /asrep/i.test(t)) ? 'T1558.004' : 'T1190',
    target: 'Low-Privilege Shell',
    status: 'completed',
  };

  // Phase 3: Staging / Pivot / Internal Enum (Optional depending on machine architecture)
  const p3: KillChainStep = {
    step: 3,
    phase: isAD ? 'Internal Domain Triage' : hasPivoting ? 'Network Pivoting' : 'Local System Audit',
    action: isAD
      ? 'BloodHound Graph Ingestion & Domain ACL Audit'
      : hasPivoting
      ? 'Reverse SOCKS Proxy & Subnet Lateral Routing'
      : 'LinPEAS / WinPEAS Local Configuration Audit',
    technique: isAD ? 'Neo4j Cypher Path Analysis' : hasPivoting ? 'Chisel / Proxychains Routing' : 'System Credential Hunting',
    mitreId: isAD ? 'T1087.002' : hasPivoting ? 'T1572' : 'T1082',
    target: isAD ? 'Service Accounts' : 'Internal Subnet',
    status: 'checkpoint',
  };

  // Phase 4: Privilege Escalation
  const privText = writeup.privEscVector || 'Local privilege escalation vector execution';
  const p4: KillChainStep = {
    step: 4,
    phase: 'Privilege Escalation',
    action: privText.length > 55 ? privText.slice(0, 52) + '...' : privText,
    technique: writeup.tags.find(t => /sudo|suid|capabilit|backup|kernel|impersonat|token/i.test(t)) || 'Privilege Abuse',
    mitreId: writeup.tags.some(t => /backup|ntds|lsass/i.test(t)) ? 'T1003.003' : 'T1548',
    target: isAD ? 'Domain Admin / SYSTEM' : 'root',
    status: 'checkpoint',
  };

  // Phase 5: Final Domain Dominance or Root Flag Capture
  const p5: KillChainStep = {
    step: 5,
    phase: isAD ? 'Domain Dominance' : 'Target Full Compromise',
    action: isAD 
      ? 'Full NTDS.dit Extraction & Enterprise Domain Dominance' 
      : 'Root Shell Access & Flag Extraction (root.txt)',
    technique: isAD ? 'SecretsDump / DCSync Hashes' : 'UID 0 Elevation Verified',
    mitreId: isAD ? 'T1003.006' : 'T1552',
    target: isAD ? 'Domain Controller' : 'root@system',
    status: 'root',
  };

  return [p1, p2, p3, p4, p5];
}

interface AttackFlowAndMitreProps {
  writeup: Writeup;
}

export default function AttackFlowAndMitre({ writeup }: AttackFlowAndMitreProps) {
  const [showMitre, setShowMitre] = useState(true);
  const [showFlow, setShowFlow] = useState(true);

  // 1. AUTOMATED MITRE TECHNIQUES EXTRACTION:
  // Scans writeup tags AND vectors to extract all matching MITRE techniques automatically!
  const matchedMitre: MitreTTP[] = useMemo(() => {
    const list: MitreTTP[] = [];
    const seen = new Set<string>();

    const searchPool = [
      ...writeup.tags,
      ...(writeup.initialAccessVector ? writeup.initialAccessVector.split(' ') : []),
      ...(writeup.privEscVector ? writeup.privEscVector.split(' ') : []),
    ];

    searchPool.forEach((rawWord) => {
      const clean = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = COMPREHENSIVE_MITRE_MAP[clean];
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        list.push(match);
      }
    });

    // If fewer than 2 matched, add standard baseline reconnaissance & access techniques
    if (list.length < 2) {
      if (!seen.has('T1046')) {
        list.unshift(COMPREHENSIVE_MITRE_MAP.nmap);
      }
      if (!seen.has('T1190')) {
        list.push(COMPREHENSIVE_MITRE_MAP.web);
      }
    }

    return list;
  }, [writeup]);

  // 2. AUTOMATED ATTACK FLOW KILL-CHAIN:
  // Dynamically constructed on the fly for this writeup
  const killChain = useMemo(() => {
    return generateAutomatedKillChain(writeup);
  }, [writeup]);

  return (
    <div className="space-y-6 pt-3">
      {/* 1. AUTOMATED VISUAL ATTACK GRAPH / KILL-CHAIN */}
      <div className="rounded-xl bg-[#0a0f14] border border-[#1b2631] overflow-hidden shadow-lg">
        <div className="px-4 py-3 bg-[#0d141b] border-b border-[#1b2631] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-[#00ff66]" />
            <h3 className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider uppercase">
              EXPLOITATION KILL-CHAIN &amp; ATTACK FLOW
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
              {killChain.length} PHASES
            </span>
          </div>
          <button
            onClick={() => setShowFlow(!showFlow)}
            className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1"
          >
            <span>{showFlow ? 'Collapse' : 'Expand'}</span>
            {showFlow ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showFlow && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
              {killChain.map((item, idx) => {
                const isLast = idx === killChain.length - 1;
                const isRoot = item.status === 'root';
                return (
                  <div key={item.step} className="relative flex flex-col justify-between">
                    <div
                      className={`p-3.5 rounded-lg border h-full flex flex-col justify-between transition-all ${
                        isRoot
                          ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-[#0e161f] border-[#202f3d] hover:border-[#00ff66]/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              isRoot
                                ? 'bg-red-500 text-black'
                                : 'bg-[#1b2733] text-[#00ff66]'
                            }`}
                          >
                            PHASE 0{item.step}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px]">{item.mitreId}</span>
                        </div>

                        <h4 className="font-mono text-xs font-bold text-white mb-1">{item.phase}</h4>
                        <p className="text-[11px] text-gray-300 font-sans leading-tight mb-2">
                          {item.action}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#1b2631]/80 mt-2">
                        <span className="text-[10px] font-mono text-gray-500 block">Target:</span>
                        <span
                          className={`text-[11px] font-mono font-semibold truncate block ${
                            isRoot ? 'text-red-400 font-bold' : 'text-[#00ff66]'
                          }`}
                        >
                          {item.target}
                        </span>
                      </div>
                    </div>

                    {/* Desktop connector arrow */}
                    {!isLast && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-600">
                        <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. AUTOMATED MITRE ATT&CK MATRIX */}
      {matchedMitre.length > 0 && (
        <div className="rounded-xl bg-[#0a0f14] border border-[#1b2631] overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-[#0d141b] border-b border-[#1b2631] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider uppercase">
                MITRE ATT&amp;CK&reg; TTPs COVERAGE MATRIX
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {matchedMitre.length} TECHNIQUES IDENTIFIED
              </span>
            </div>
            <button
              onClick={() => setShowMitre(!showMitre)}
              className="text-xs font-mono text-gray-400 hover:text-white flex items-center gap-1"
            >
              <span>{showMitre ? 'Collapse' : 'Expand'}</span>
              {showMitre ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showMitre && (
            <div className="p-4 sm:p-5 space-y-3">
              <p className="text-xs text-gray-400 font-sans">
                Offensive tactics, techniques, and procedures (TTPs) automatically mapped to the
                official MITRE ATT&amp;CK Enterprise matrix:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {matchedMitre.map((mitre) => {
                  const style = TACTIC_COLORS[mitre.tactic] || {
                    bg: 'bg-gray-500/10',
                    text: 'text-gray-300',
                    border: 'border-gray-500/20',
                  };
                  return (
                    <a
                      key={mitre.id}
                      href={mitre.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2.5 rounded-lg border ${style.bg} ${style.border} hover:border-cyan-400/50 transition-all flex flex-col justify-between group`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-mono text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                          {mitre.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${style.text} ${style.border}`}
                        >
                          {mitre.tactic}
                        </span>
                      </div>
                      <div className="flex items-end justify-between gap-2 mt-1">
                        <span className="text-xs text-gray-300 font-sans line-clamp-1">{mitre.name}</span>
                        <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 shrink-0" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
