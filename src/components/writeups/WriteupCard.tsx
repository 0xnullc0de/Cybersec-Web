import React from 'react';
import Link from 'next/link';
import { Writeup } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import { Lock, CheckCircle2, ArrowUpRight, Terminal, Calendar } from 'lucide-react';

interface WriteupCardProps {
  writeup: Writeup;
}

export default function WriteupCard({ writeup }: WriteupCardProps) {
  return (
    <Link
      href={`/writeups/${writeup.slug}`}
      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/60 hover:bg-[#0e161d] transition-all duration-300 shadow-md shadow-black/50 overflow-hidden"
    >
      {/* Top green hover highlight bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[#00ff66] transition-colors duration-300" />

      {/* Top Header: Platform + Difficulty + Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={writeup.platform} size="sm" />
            <DifficultyBadge difficulty={writeup.difficulty} size="sm" />
          </div>

          {/* Retirement Status Badge */}
          {writeup.isRetired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>RETIRED</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>ACTIVE LAB</span>
            </span>
          )}
        </div>

        {/* Machine Title with Terminal Prompt */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-mono text-lg sm:text-xl font-bold text-white group-hover:text-[#00ff66] transition-colors tracking-tight flex items-center gap-1.5">
            <span>{writeup.title}</span>
            <span className="text-gray-500 text-xs font-normal">[{writeup.os}]</span>
          </h3>
          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00ff66] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        {/* Short Summary */}
        <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed line-clamp-2 mb-4">
          {writeup.summary}
        </p>

        {/* Attack Vectors summary */}
        <div className="mb-4 p-2.5 rounded-lg bg-[#070b0e] border border-[#17212a] font-mono text-[11px] space-y-1 text-gray-400">
          <div className="truncate">
            <span className="text-[#00ff66] font-semibold">FOOTHOLD:</span> {writeup.initialAccessVector}
          </div>
          <div className="truncate">
            <span className="text-amber-400 font-semibold">PRIVESC:</span> {writeup.privEscVector}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {writeup.tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141c24] text-gray-300 border border-[#22313f] group-hover:border-[#00ff66]/20 transition-colors"
            >
              #{tag}
            </span>
          ))}
          {writeup.tags.length > 4 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
              +{writeup.tags.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info: Date & Read CTA */}
      <div className="pt-3 border-t border-[#17212a] flex items-center justify-between text-[11px] font-mono text-gray-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-gray-500" />
          <span>{writeup.datePublished}</span>
        </div>
        <span className="text-[#00ff66] font-semibold group-hover:underline flex items-center gap-1">
          {writeup.isRetired ? 'READ WRITEUP' : 'RECON PREVIEW'} &gt;
        </span>
      </div>
    </Link>
  );
}
