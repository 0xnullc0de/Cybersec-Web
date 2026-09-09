import React from 'react';
import { Trophy, FileCheck, Skull, Award } from 'lucide-react';
import { siteConfig } from '@/data/siteConfig';

export default function StatsStrip() {
  const stats = [
    {
      value: siteConfig.stats.htbRank.split(' ')[0] + ' ' + siteConfig.stats.htbRank.split(' ')[1], // 'Pro Hacker'
      subValue: 'Top 1% Global',
      label: 'Hack The Box Ranking',
      description: 'Active competitor in competitive HTB VIP & Pro Labs',
      icon: Trophy,
      glow: 'from-[#9fef00]/10',
      accent: 'text-[#9fef00]',
    },
    {
      value: `${siteConfig.stats.writeupsPublished}+`,
      subValue: 'Full-Chain Guides',
      label: 'Writeups Published',
      description: 'Step-by-step methodologies from nmap to root shell',
      icon: FileCheck,
      glow: 'from-[#00ff66]/10',
      accent: 'text-[#00ff66]',
    },
    {
      value: `${siteConfig.stats.machinesPwned}+`,
      subValue: 'Machines Pwned',
      label: 'Roots & Flags Captured',
      description: 'Linux kernels, Windows Domains & AD forests breached',
      icon: Skull,
      glow: 'from-purple-500/10',
      accent: 'text-purple-400',
    },
    {
      value: '4 / 1',
      subValue: 'CRTO In Progress',
      label: 'Industry Certifications',
      description: 'OSCP, HTB CPTS, BSCP, eJPTv2 validated hands-on',
      icon: Award,
      glow: 'from-amber-500/10',
      accent: 'text-amber-400',
    },
  ];

  return (
    <section className="relative z-20 -mt-4 mb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative p-5 sm:p-6 rounded-xl bg-[#0a0f13] border border-[#1b2631] hover:border-[#00ff66]/50 hover:bg-[#0e161c] transition-all duration-300 shadow-lg shadow-black/60 overflow-hidden"
            >
              {/* Subtle background gradient glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              {/* Top stat value and icon */}
              <div className="relative z-10 flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight group-hover:text-[#00ff66] transition-colors">
                    {item.value}
                  </div>
                  <div className={`font-mono text-xs font-semibold ${item.accent} tracking-wide mt-0.5`}>
                    {item.subValue}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#121920] border border-[#22313f] text-gray-400 group-hover:text-[#00ff66] group-hover:border-[#00ff66]/30 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="relative z-10 space-y-1">
                <h3 className="font-mono text-xs uppercase tracking-wider text-gray-200 font-bold">
                  {item.label}
                </h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom decorative scanline accent */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[#00ff66] transition-all duration-300" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
