import React from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import CertCard from '@/components/about/CertCard';
import CertificationsList from '@/components/about/CertificationsList';
import { certifications } from '@/data/certifications';
import { siteConfig } from '@/data/siteConfig';
import { 
  Terminal, 
  Shield, 
  Network, 
  Target, 
  Lock, 
  Cpu, 
  Github, 
  Linkedin, 
  Twitter, 
  Mail, 
  Key, 
  ExternalLink,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  const focusAreas = [
    {
      title: 'Active Directory Exploitation',
      description:
        'Specializing in domain reconnaissance, Kerberoasting, AS-REP roasting, DCSync attacks, DACL and ACE abuse, BloodHound graph pathing, and cross-forest trust hopping.',
      icon: Network,
      color: 'text-[#00ff66]',
    },
    {
      title: 'Red Teaming & Internal Pivoting',
      description:
        'Adversary simulation across multi-tier enterprise networks using Chisel, SOCKS5, reverse tunnels, Cobalt Strike C2 architecture, and egress filtering evasion.',
      icon: Target,
      color: 'text-amber-400',
    },
    {
      title: 'Web Application Vulnerability Research',
      description:
        'Uncovering server-side vulnerabilities including SSRF, command injection, deserialization, auth bypasses, and chained exploitation leading to initial perimeter breaches.',
      icon: Lock,
      color: 'text-blue-400',
    },
    {
      title: 'Linux & Windows Privilege Escalation',
      description:
        'Low-level system compromise utilizing token manipulation, service misconfigurations, unquoted service paths, sudo permissions, and kernel exploits.',
      icon: Cpu,
      color: 'text-purple-400',
    },
  ];

  const tools = [
    { name: 'Impacket Suite', category: 'AD & Protocols' },
    { name: 'BloodHound', category: 'Graph AD Auditing' },
    { name: 'Chisel & Proxychains', category: 'Network Pivoting' },
    { name: 'Burp Suite Pro', category: 'Web App Pentesting' },
    { name: 'Evil-WinRM', category: 'Remote Access' },
    { name: 'Hashcat / John', category: 'Password Cracking' },
    { name: 'Mimikatz / Rubeus', category: 'Kerberos & LSASS' },
    { name: 'NetExec / CME', category: 'Network Spraying' },
    { name: 'Ligolo-ng', category: 'TUN/TAP Pivoting' },
    { name: 'Cobalt Strike', category: 'Adversary C2' },
  ];

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* 1. Header & Bio Card */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#0a0f14] border border-[#1b2631] shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#00ff66]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/25 text-[#00ff66] font-mono text-xs font-semibold uppercase">
              <Terminal className="w-3.5 h-3.5" />
              <span>WHOAMI // RED TEAM OPERATOR PROFILE</span>
            </div>

            <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              {siteConfig.name} <span className="text-[#00ff66]">[{siteConfig.handle}]</span>
            </h1>

            <p className="text-gray-300 font-sans text-base sm:text-lg leading-relaxed">
              I am Max, an offensive security researcher and penetration tester focused on internal infrastructure compromise, Active Directory domain dominance, and offensive tooling development.
            </p>

            <p className="text-gray-400 font-sans text-sm sm:text-base leading-relaxed">
              My methodology is grounded in deep technical understanding rather than automated vulnerability scanners. Whether chaining subtle DACL misconfigurations in Windows forests or exploiting memory dumps to recover privileged secrets, I approach offensive tradecraft with precision, documentation discipline, and continuous learning.
            </p>

            {/* Socials row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-[#0e151b] border border-[#22313f] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 font-mono text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-[#0e151b] border border-[#22313f] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 font-mono text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
              <a
                href={siteConfig.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-[#0e151b] border border-[#22313f] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 font-mono text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Twitter className="w-4 h-4" />
                <span>Twitter</span>
              </a>
              <a
                href={`mailto:${siteConfig.socials.email}`}
                className="px-4 py-2 rounded-lg bg-[#0e151b] border border-[#22313f] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 font-mono text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Email Secure</span>
              </a>
            </div>
          </div>

          {/* Right Status Card */}
          <div className="lg:col-span-4 p-6 rounded-2xl bg-[#070b0e] border border-[#1b2631] font-mono text-xs space-y-4">
            <div className="text-gray-400 font-bold border-b border-[#1b2631] pb-2 flex items-center justify-between">
              <span>OPERATOR STATUS</span>
              <span className="text-[#00ff66]">ACTIVE</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">PRIMARY FOCUS:</span>
                <span className="text-white font-semibold">Active Directory / Red Team</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">HTB RANK:</span>
                <span className="text-[#9fef00] font-semibold">{siteConfig.stats.htbRank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CERTS COMPLETED:</span>
                <span className="text-white font-semibold">4 Validated</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CURRENT GOAL:</span>
                <span className="text-amber-400 font-semibold">CRTO Certification</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0a1117] border border-[#17222c] space-y-1">
              <div className="text-[10px] text-gray-500">PUBLIC PGP FINGERPRINT</div>
              <div className="text-[11px] text-[#00ff66] break-all font-mono">
                9B2F 881C 440A 119E D31C 7A8B E410 999A
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Focus Areas */}
      <section className="space-y-8">
        <SectionHeader
          badge="TACTICAL SPECIALIZATION"
          title="CORE FOCUS & METHODOLOGY"
          description="Areas of rigorous study and deep offensive domain mastery."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {focusAreas.map((area, idx) => {
            const Icon = area.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/40 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0e161c] border border-[#22313f] flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${area.color}`} />
                </div>
                <h3 className="font-mono text-lg font-bold text-white">
                  {area.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
                  {area.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Certifications Section (Anchor target #certifications) */}
      <section id="certifications" className="space-y-8 scroll-mt-24">
        <SectionHeader
          badge="OFFENSIVE CREDENTIALS"
          title="CERTIFICATIONS & QUALIFICATIONS"
          description="Hands-on examination certifications proving real-world adversary tradecraft, report writing, and network exploitation."
        />

        <div className="mt-8">
          <CertificationsList />
        </div>
      </section>

      {/* 4. Weapons & Toolset Inventory */}
      <section className="space-y-8">
        <SectionHeader
          badge="WEAPONRY & TOOLS"
          title="OFFENSIVE TOOLKIT & ARSENAL"
          description="Everyday utilities utilized for network mapping, credential dumping, tunneling, and exploitation."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {tools.map((t, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0a0f14] border border-[#1b2631] font-mono text-center space-y-1 hover:border-[#00ff66]/40 transition-colors"
            >
              <div className="text-white text-xs font-bold">{t.name}</div>
              <div className="text-[10px] text-gray-500">{t.category}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
