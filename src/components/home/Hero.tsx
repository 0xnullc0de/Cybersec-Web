'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, Shield, ArrowRight, BookOpen, Github, Linkedin, Twitter, Sparkles, ExternalLink } from 'lucide-react';
import CyberFingerprint from '@/components/ui/CyberFingerprint';
import { siteConfig } from '@/data/siteConfig';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ff66]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cyber grid lines */}
      <div className="absolute inset-0 cyber-grid opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Top pill badge (identical to reference image) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1117] border border-[#00ff66]/30 shadow-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_8px_#00ff66]" />
              <span className="font-mono text-xs font-medium text-gray-300">
                {siteConfig.statusBadge}
              </span>
            </div>

            {/* Giant Monospace / Cyber Headline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-[#00ff66] tracking-wider uppercase">
                <Terminal className="w-4 h-4 text-[#00ff66]" />
                <span>ROOT PRIVILEGE AUTHORIZED // HANDLE: {siteConfig.handle}</span>
              </div>
              <h1 className="font-mono text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1]">
                OFFENSIVE SECURITY <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">
                  SOLUTIONS & LAB
                </span> <br />
                <span className="text-[#00ff66] drop-shadow-[0_0_15px_rgba(0,255,102,0.3)]">
                  EXPLOITATION
                </span>
              </h1>
            </div>

            {/* Subtitle / Bio */}
            <p className="text-base sm:text-lg text-gray-400 font-sans leading-relaxed max-w-2xl">
              {siteConfig.bio}
            </p>

            {/* CTA Action Buttons (exact shape and styling of the reference UI) */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary Green CTA Button */}
              <Link
                href="/writeups"
                className="px-6 py-3.5 rounded-md bg-[#00ff66] text-black font-mono font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-[#00e55b] hover:shadow-glow-lg transition-all duration-300 flex items-center gap-2 group"
              >
                <span>EXPLORE WRITEUPS</span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Dark/Outlined Button */}
              <Link
                href="/til"
                className="px-6 py-3.5 rounded-md bg-[#0d141a] text-gray-200 border border-[#22313f] font-mono font-bold text-xs sm:text-sm tracking-widest uppercase hover:border-[#00ff66]/50 hover:text-white hover:bg-[#121c24] transition-all duration-300 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#00ff66]" />
                <span>TECHNIQUES & TIL</span>
              </Link>
            </div>

            {/* Social Links Row & Terminal Handle */}
            <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-[#1b2631]/60">
              <span className="font-mono text-xs text-gray-500 uppercase tracking-wider">
                TRANSMISSIONS:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={siteConfig.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                  aria-label="GitHub profile"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href={siteConfig.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                  aria-label="LinkedIn profile"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href={siteConfig.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-400 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                  aria-label="Twitter profile"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
              <div className="h-4 w-[1px] bg-[#1b2631] hidden sm:block" />
              <div className="font-mono text-xs text-gray-400">
                <span className="text-[#00ff66]">CRTO</span> candidate &bull; OffSec OSCP
              </div>
            </div>
          </div>

          {/* Right Column: Biometric Cyber Fingerprint Scanner Visual */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <CyberFingerprint />
          </div>
        </div>

        {/* Platform Verification Bar (like reference image's trusted brands row) */}
        <div className="mt-16 pt-8 border-t border-[#1b2631]/80 flex flex-wrap items-center justify-between gap-6">
          <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
            PRACTICE FIELDS & VERIFIED PLATFORMS:
          </span>
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-gray-400 font-mono text-xs font-semibold">
            <span className="hover:text-[#9fef00] transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#9fef00]" /> HACK THE BOX
            </span>
            <span className="hover:text-[#ff2d55] transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff2d55]" /> TRYHACKME
            </span>
            <span className="hover:text-orange-400 transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" /> OFFSEC LABS
            </span>
            <span className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> PORTSWIGGER WEB
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
