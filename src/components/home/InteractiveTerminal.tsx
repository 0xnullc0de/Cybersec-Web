'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Copy, Check } from 'lucide-react';
import { siteConfig } from '@/data/siteConfig';

export default function InteractiveTerminal() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Array<{ cmd: string; output: string | React.ReactNode }>>([
    {
      cmd: 'nmap -sV -p- -T4 targets.local',
      output: (
        <div className="text-gray-300 font-mono text-xs space-y-1">
          <div>Starting Nmap 7.94 scan on targets.local (10.10.14.0/24)</div>
          <div className="text-[#00ff66]">PORT 22/tcp  OPEN  OpenSSH 8.9p1 Ubuntu (ed25519)</div>
          <div className="text-[#00ff66]">PORT 88/tcp  OPEN  Microsoft Windows Kerberos (KDC)</div>
          <div className="text-[#00ff66]">PORT 389/tcp OPEN  LDAP Active Directory (Domain: LAB.LOCAL)</div>
          <div className="text-[#00ff66]">PORT 445/tcp OPEN  microsoft-ds (SMBv2/v3 Signing: Enabled)</div>
          <div className="text-gray-400">&gt; Type <span className="text-[#00ff66] font-bold">help</span> or <span className="text-[#00ff66] font-bold">whoami</span> to interact.</div>
        </div>
      ),
    },
  ]);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Prevent scrolling the page on initial load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only scroll the terminal inner container, never the window
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    let response: React.ReactNode = '';

    switch (trimmed) {
      case 'help':
        response = (
          <div className="text-gray-300 space-y-1">
            <div>Available terminal commands:</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-400 max-w-sm">
              <div><span className="text-[#00ff66]">whoami</span> - Display operator profile</div>
              <div><span className="text-[#00ff66]">certs</span> - List active certifications</div>
              <div><span className="text-[#00ff66]">cat flag.txt</span> - Capture root flag</div>
              <div><span className="text-[#00ff66]">skills</span> - Offensive tradecraft</div>
              <div><span className="text-[#00ff66]">clear</span> - Clear console output</div>
              <div><span className="text-[#00ff66]">contact</span> - Transmit secure message</div>
            </div>
          </div>
        );
        break;

      case 'whoami':
        response = (
          <div className="text-gray-300 space-y-0.5">
            <div>Handle: <span className="text-[#00ff66] font-bold">{siteConfig.handle}</span></div>
            <div>Role: {siteConfig.role}</div>
            <div>Location: Offensive Security Red Team // Europe/Global</div>
            <div>Current Focus: Active Directory forest trusts, EDR evasion, AMSI bypasses.</div>
          </div>
        );
        break;

      case 'certs':
        response = (
          <div className="text-gray-300 space-y-1">
            <div className="text-[#00ff66]">[+] Active Certifications:</div>
            <div>&bull; OffSec OSCP - Offensive Security Certified Professional (Earned)</div>
            <div>&bull; Hack The Box CPTS - Certified Penetration Testing Specialist (Earned)</div>
            <div>&bull; PortSwigger BSCP - Burp Suite Certified Practitioner (Earned)</div>
            <div>&bull; Zero-Point CRTO - Certified Red Team Operator (In Progress)</div>
          </div>
        );
        break;

      case 'skills':
        response = (
          <div className="text-gray-300 space-y-1">
            <div className="text-[#00ff66]">[+] Core Offensive Competencies:</div>
            <div>&bull; Active Directory: Kerberoasting, AS-REP, DCSync, BloodHound, DACL abuse</div>
            <div>&bull; Pivoting: Chisel, SOCKS5, Proxychains, Ligolo-ng, SSH port-forwarding</div>
            <div>&bull; Web Exploitation: SSRF, SQLi, Deserialization, JWT forgery, IDOR</div>
            <div>&bull; Linux / Windows Privesc: Token impersonation, capabilities, sudo, SeBackupPrivilege</div>
          </div>
        );
        break;

      case 'cat flag.txt':
      case 'cat /root/flag.txt':
      case 'flag':
        response = (
          <div className="p-2 rounded bg-[#053315] border border-[#00ff66] text-[#00ff66] font-bold">
            CONGRATULATIONS! FLAG: HTB&#123;Nullbyt3_r00t_pr1v1l3g3_4cqu1r3d_2024&#125;
          </div>
        );
        break;

      case 'contact':
        response = (
          <div className="text-gray-300">
            Email: <span className="text-[#00ff66]">{siteConfig.socials.email}</span> | PGP ID: 4A892F1C990B31DA
          </div>
        );
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      default:
        response = (
          <span className="text-red-400">
            zsh: command not found: {trimmed}. Type &apos;help&apos; for available commands.
          </span>
        );
    }

    setHistory((prev) => [...prev, { cmd: input, output: response }]);
    setInput('');
  };

  const copyLog = () => {
    navigator.clipboard.writeText(
      history.map((h) => `$ ${h.cmd}\n${typeof h.output === 'string' ? h.output : ''}`).join('\n')
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-xl bg-[#090d10] border border-[#1b2631] shadow-2xl overflow-hidden font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-[#0e141a] border-b border-[#1b2631] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 font-semibold text-xs ml-3">
            <TerminalIcon className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Nullbyt3@kali-linux: ~/ctf-workspace (zsh)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={copyLog}
            className="p-1 hover:text-white transition-colors"
            title="Copy Terminal History"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00ff66]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div ref={terminalBodyRef} className="p-4 sm:p-5 h-72 sm:h-80 overflow-y-auto space-y-3 bg-[#06090c]/95">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-[#00ff66] font-bold">Nullbyt3@redteam:~$</span>
              <span className="text-white font-medium">{item.cmd}</span>
            </div>
            <div className="pl-4 text-gray-300">{item.output}</div>
          </div>
        ))}
      </div>


      {/* Interactive Input Line */}
      <form
        onSubmit={handleCommand}
        className="px-4 py-2.5 bg-[#0e141a] border-t border-[#1b2631] flex items-center gap-2"
      >
        <span className="text-[#00ff66] font-bold">Nullbyt3@redteam:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type 'help', 'whoami', 'certs', 'cat flag.txt'..."
          className="flex-grow bg-transparent text-white focus:outline-none placeholder-gray-600 font-mono text-xs"
        />
        <span className="text-[10px] text-gray-600 hidden sm:inline">[ENTER] TO EXECUTE</span>
      </form>
    </div>
  );
}
