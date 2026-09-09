'use client';

import React, { useState } from 'react';
import { TilNote } from '@/types';
import MarkdownRenderer from '@/components/writeups/MarkdownRenderer';
import { Calendar, Clock, ChevronDown, ChevronUp, Share2, Check, Tag } from 'lucide-react';

interface TilCardProps {
  note: TilNote;
}

export default function TilCard({ note }: TilCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleShare = () => {
    const url = `${window.location.origin}/til#${note.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <article
      id={note.slug}
      className="relative pl-6 sm:pl-10 pb-12 group scroll-mt-28"
    >
      {/* Timeline vertical connector line */}
      <div className="absolute left-[7px] sm:left-[11px] top-6 bottom-0 w-[2px] bg-[#1a2530] group-last:hidden" />

      {/* Glowing Timeline Marker Dot */}
      <div className="absolute left-0 sm:left-1 top-2.5 w-4 h-4 rounded-full bg-[#090d10] border-2 border-[#00ff66] flex items-center justify-center shadow-glow group-hover:scale-125 transition-transform">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66]" />
      </div>

      {/* Note Card Container */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0a0f14] border border-[#1b2631] group-hover:border-[#00ff66]/40 transition-all shadow-xl space-y-4">
        {/* Card Header: Category + Date + Share */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#00ff66]/10 text-[#00ff66] font-semibold border border-[#00ff66]/25">
              {note.category}
            </span>
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {note.date}
            </span>
            <span className="text-gray-500 hidden sm:inline">&bull;</span>
            <span className="text-gray-500 hidden sm:inline flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {note.readTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded bg-[#121921] hover:bg-[#1a2430] text-gray-400 hover:text-white transition-colors"
              title="Copy link to note"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00ff66]" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded bg-[#121921] hover:bg-[#1a2430] text-gray-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse note' : 'Expand note'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h2 className="font-mono text-xl sm:text-2xl font-bold text-white group-hover:text-[#00ff66] transition-colors">
          <a href={`#${note.slug}`} className="hover:underline">
            {note.title}
          </a>
        </h2>

        {/* Short Summary */}
        <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
          {note.summary}
        </p>

        {/* Note Body (Markdown rendered) */}
        {isExpanded && (
          <div className="pt-4 border-t border-[#17222c]">
            <MarkdownRenderer content={note.content} />
          </div>
        )}

        {/* Tags Row */}
        <div className="pt-3 border-t border-[#17222c] flex flex-wrap items-center gap-1.5">
          <Tag className="w-3 h-3 text-gray-600 mr-1" />
          {note.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#111820] text-gray-400 border border-[#1e2a36]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
