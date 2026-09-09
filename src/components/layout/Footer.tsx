'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, Github, Linkedin, Twitter, Shield, ArrowUp, Mail } from 'lucide-react';
import { siteConfig } from '@/data/siteConfig';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-[#1b2631] bg-[#050708] relative overflow-hidden">
      {/* Subtle top green line accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00ff66]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Terminal prompt */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#0e141a] border border-[#00ff66]/50 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-[#00ff66]" />
              </div>
              <span className="font-mono text-lg font-bold tracking-wider text-white">
                {siteConfig.handle}<span className="text-[#00ff66] animate-blink">_</span>
              </span>
            </div>
            
            <p className="text-gray-400 text-sm max-w-md font-sans leading-relaxed">
              {siteConfig.bio}
            </p>

            {/* Terminal snippet */}
            <div className="p-3 rounded-lg bg-[#0a0f13] border border-[#1b2631] font-mono text-xs text-gray-400 max-w-md">
              <div className="flex items-center gap-1.5 mb-1 text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                <span className="ml-2 text-[10px] text-gray-400">session: active</span>
              </div>
              <p className="text-gray-300">
                <span className="text-[#00ff66]">Nullbyt3@redteam</span>:<span className="text-blue-400">~</span>$ whoami
              </p>
              <p className="text-[#00ff66] pl-2 font-semibold">
                uid=0(root) gid=0(root) groups=0(root),27(sudo),1000(Nullbyt3)
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#00ff66]" />
              Navigation
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <Link href="/writeups" className="text-gray-400 hover:text-[#00ff66] transition-colors">
                  &gt; /writeups
                </Link>
              </li>
              <li>
                <Link href="/about#certifications" className="text-gray-400 hover:text-[#00ff66] transition-colors">
                  &gt; /certifications
                </Link>
              </li>
              <li>
                <Link href="/til" className="text-gray-400 hover:text-[#00ff66] transition-colors">
                  &gt; /til-notes
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-[#00ff66] transition-colors">
                  &gt; /about-whoami
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect & Socials */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs uppercase tracking-widest text-gray-300 font-semibold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
              Transmissions
            </h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={siteConfig.socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={siteConfig.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${siteConfig.socials.email}`}
                className="p-2 rounded-lg bg-[#0e141a] border border-[#1b2631] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/40 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] font-mono text-gray-400">
              PGP: <span className="text-gray-300">4A89 2F1C 990B 31DA</span>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#1b2631] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-gray-400">
          <div>
            &copy; {new Date().getFullYear()} {siteConfig.handle}. All rights reserved. Zero telemetry.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#00ff66]">v2.4.0-stable</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-gray-400 hover:text-[#00ff66] transition-colors"
              aria-label="Scroll to top"
            >
              <span>TOP</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
