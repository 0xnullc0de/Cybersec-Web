import React from 'react';
import Hero from '@/components/home/Hero';
import StatsStrip from '@/components/home/StatsStrip';
import FeaturedWriteups from '@/components/home/FeaturedWriteups';
import RecentTilSection from '@/components/home/RecentTilSection';
import InteractiveTerminal from '@/components/home/InteractiveTerminal';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from 'next/link';
import { ArrowRight, Shield, Award, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-6 pb-20">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Stats Strip */}
      <StatsStrip />

      {/* 3. Featured Writeups */}
      <FeaturedWriteups />

      {/* 4. Live Interactive Terminal Workstation */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="SIMULATED RED TEAM CONSOLE"
          title="INTERACTIVE OPERATOR TERMINAL"
          description="Test out commands directly in the embedded shell to query credentials, offensive toolsets, and flag capture."
          align="center"
        />
        <InteractiveTerminal />
      </section>

      {/* 5. TIL & Techniques Section */}
      <RecentTilSection />

      {/* 6. Certification & Tradecraft Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="relative p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-[#0a1117] via-[#0e1720] to-[#0a1117] border border-[#00ff66]/30 shadow-2xl overflow-hidden">
          {/* Subtle green glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00ff66]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff66]/10 text-[#00ff66] font-mono text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>OFFENSIVE CREDENTIALS & SPECIALIZATIONS</span>
              </div>
              <h3 className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                VIEW CERTIFICATIONS & ATTACK PATHS
              </h3>
              <p className="text-gray-400 text-sm max-w-xl font-sans">
                Explore verified OffSec OSCP, Hack The Box CPTS, PortSwigger BSCP credentials, and current red team syllabus objectives.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/about#certifications"
                className="px-6 py-3 rounded-lg bg-[#00ff66] text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase hover:bg-[#00e55b] hover:shadow-glow transition-all"
              >
                VIEW CERTIFICATIONS
              </Link>
              <Link
                href="/about"
                className="px-6 py-3 rounded-lg bg-[#141d26] text-white border border-[#22313f] font-mono font-semibold text-xs sm:text-sm tracking-wider uppercase hover:border-[#00ff66]/40 transition-all"
              >
                OPERATOR BIO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
