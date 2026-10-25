'use client';

import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, ExternalLink, ArrowRight, GitFork, Key, Terminal, Lock, CheckCircle2 } from 'lucide-react';

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

// Tag to MITRE ATT&CK automated mapping dictionary
export const TAG_TO_MITRE: Record<string, MitreTTP> = {
  ASREPRoasting: {
    id: 'T1558.004',
    name: 'Steal or Forge Kerberos Tickets: AS-REP Roasting',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1558/004/',
  },
  Kerberoasting: {
    id: 'T1558.003',
    name: 'Steal or Forge Kerberos Tickets: Kerberoasting',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1558/003/',
  },
  BloodHound: {
    id: 'T1087.002',
    name: 'Account Discovery: Domain Account',
    tactic: 'Discovery',
    url: 'https://attack.mitre.org/techniques/T1087/002/',
  },
  LSASS: {
    id: 'T1003.001',
    name: 'OS Credential Dumping: LSASS Memory',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/001/',
  },
  Pypykatz: {
    id: 'T1003.001',
    name: 'OS Credential Dumping: LSASS Memory',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/001/',
  },
  BackupOperators: {
    id: 'T1003.003',
    name: 'OS Credential Dumping: NTDS.dit Extraction',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/003/',
  },
  Diskshadow: {
    id: 'T1003.003',
    name: 'OS Credential Dumping: NTDS.dit via Diskshadow',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/003/',
  },
  NTDS: {
    id: 'T1003.003',
    name: 'OS Credential Dumping: NTDS',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/003/',
  },
  SecretsDump: {
    id: 'T1003.002',
    name: 'OS Credential Dumping: Security Account Manager',
    tactic: 'Credential Access',
    url: 'https://attack.mitre.org/techniques/T1003/002/',
  },
  'Evil-WinRM': {
    id: 'T1021.006',
    name: 'Remote Services: Windows Remote Management',
    tactic: 'Lateral Movement',
    url: 'https://attack.mitre.org/techniques/T1021/006/',
  },
  ForceChangePassword: {
    id: 'T1098',
    name: 'Account Manipulation: ForceChangePassword ACE',
    tactic: 'Persistence',
    url: 'https://attack.mitre.org/techniques/T1098/',
  },
  RPC: {
    id: 'T1087.002',
    name: 'Account Discovery: RPC User Enumeration',
    tactic: 'Discovery',
    url: 'https://attack.mitre.org/techniques/T1087/002/',
  },
  SMB: {
    id: 'T1021.002',
    name: 'Remote Services: SMB/Windows Admin Shares',
    tactic: 'Lateral Movement',
    url: 'https://attack.mitre.org/techniques/T1021/002/',
  },
  SeImpersonate: {
    id: 'T1134.001',
    name: 'Access Token Manipulation: Token Impersonation/Theft',
    tactic: 'Privilege Escalation',
    url: 'https://attack.mitre.org/techniques/T1134/001/',
  },
  SQLi: {
    id: 'T1190',
    name: 'Exploit Public-Facing Application: SQL Injection',
    tactic: 'Initial Access',
    url: 'https://attack.mitre.org/techniques/T1190/',
  },
  Chisel: {
    id: 'T1572',
    name: 'Protocol Tunneling: Reverse SOCKS Proxy',
    tactic: 'Lateral Movement',
    url: 'https://attack.mitre.org/techniques/T1572/',
  },
};

interface AttackFlowAndMitreProps {
  slug: string;
  tags: string[];
}

export default function AttackFlowAndMitre({ slug, tags }: AttackFlowAndMitreProps) {
  const [showMitre, setShowMitre] = useState(true);
  const [showFlow, setShowFlow] = useState(true);

  // Compute matched MITRE techniques from tags
  const matchedMitre: MitreTTP[] = React.useMemo(() => {
    const list: MitreTTP[] = [];
    const seen = new Set<string>();

    tags.forEach((tag) => {
      // Normalise tag: strip whitespace & special characters
      const clean = tag.replace(/[^a-zA-Z0-9-]/g, '');
      const match = TAG_TO_MITRE[tag] || TAG_TO_MITRE[clean];
      if (match && !seen.has(match.id)) {
        seen.add(match.id);
        list.push(match);
      }
    });

    return list;
  }, [tags]);

  // Demo attack graph kill-chain for Blackfield
  const isBlackfield = slug === 'htb-blackfield';
  const blackfieldKillChain: KillChainStep[] = [
    {
      step: 1,
      phase: 'Recon & Discovery',
      action: 'SMB Anonymous Share & RPC User Enum',
      technique: 'RID cycling & account harvesting',
      mitreId: 'T1087.002',
      target: '10.10.10.192:445',
      status: 'completed',
    },
    {
      step: 2,
      phase: 'Initial Foothold',
      action: 'AS-REP Roasting against support account',
      technique: 'Kerberos pre-auth disabled extraction',
      mitreId: 'T1558.004',
      target: 'support@BLACKFIELD.LOCAL',
      status: 'completed',
    },
    {
      step: 3,
      phase: 'Internal Enum & Pivoting',
      action: 'BloodHound Graph & Password Reset',
      technique: 'ForceChangePassword abuse on audit2020',
      mitreId: 'T1098',
      target: 'audit2020',
      status: 'checkpoint',
    },
    {
      step: 4,
      phase: 'Credential Harvesting',
      action: 'LSASS Memory Dump Analysis',
      technique: 'pypykatz offline parsing of memory.dmp',
      mitreId: 'T1003.001',
      target: 'svc_backup credentials',
      status: 'checkpoint',
    },
    {
      step: 5,
      phase: 'Full Domain Pwn',
      action: 'SeBackupPrivilege & NTDS Extraction',
      technique: 'Diskshadow snapshot + secretsdump',
      mitreId: 'T1003.003',
      target: 'Administrator (Domain Admin)',
      status: 'root',
    },
  ];

  return (
    <div className="space-y-6 pt-3">
      {/* 1. VISUAL ATTACK GRAPH / KILL-CHAIN */}
      {isBlackfield && (
        <div className="rounded-xl bg-[#0a0f14] border border-[#1b2631] overflow-hidden shadow-lg">
          <div className="px-4 py-3 bg-[#0d141b] border-b border-[#1b2631] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-[#00ff66]" />
              <h3 className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider uppercase">
                EXPLOITATION KILL-CHAIN &amp; ATTACK FLOW
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                5 PHASES
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
                {blackfieldKillChain.map((item, idx) => {
                  const isLast = idx === blackfieldKillChain.length - 1;
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
      )}

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
                Offensive tactics, techniques, and procedures (TTPs) demonstrated in this target, mapped to the
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
