'use client';

import React from 'react';
import Link from 'next/link';
import { TilNote } from '@/types';
import {
  Calendar,
  Clock,
  Lock,
  CheckCircle2,
  ArrowUpRight,
  Shield,
  Tag,
} from 'lucide-react';

interface TilCardProps {
  note: TilNote;
}

export default function TilCard({ note }: TilCardProps) {
  return (
    <Link
      href={`/til/${note.slug}`}
      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/60 hover:bg-[#0e161d] transition-all duration-300 shadow-md shadow-black/50 overflow-hidden"
    >
      {/* Top green hover highlight bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[#00ff66] transition-colors duration-300" />

      <div>
        {/* Top Header: Category + Vault Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/25">
              {note.category}
            </span>
          </div>

          {/* Locked vs Public Badge */}
          {note.isLocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>LOCKED VAULT</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>PUBLIC</span>
            </span>
          )}
        </div>

        {/* Note Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-mono text-lg sm:text-xl font-bold text-white group-hover:text-[#00ff66] transition-colors tracking-tight line-clamp-2">
            {note.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#00ff66] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-1" />
        </div>

        {/* Short Summary Preview */}
        {note.summary && (
          <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed line-clamp-3 mb-4">
            {note.summary}
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {note.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141c24] text-gray-300 border border-[#22313f] group-hover:border-[#00ff66]/20 transition-colors"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
            {note.tags.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                +{note.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info: Date, Read Time & CTA */}
      <div className="pt-3 border-t border-[#17212a] flex items-center justify-between text-[11px] font-mono text-gray-500">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <span>{note.date}</span>
          </div>
          <span>&bull;</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>{note.readTime}</span>
          </div>
        </div>
        <span className="text-[#00ff66] font-semibold group-hover:underline flex items-center gap-1">
          {note.isLocked ? 'UNLOCK NOTE' : 'READ NOTE'} &gt;
        </span>
      </div>
    </Link>
  );
}
