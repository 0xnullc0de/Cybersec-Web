import React from 'react';
import Link from 'next/link';
import { tilNotes } from '@/data/til';
import SectionHeader from '@/components/ui/SectionHeader';
import { Terminal, BookOpen, ArrowRight, Tag } from 'lucide-react';

export default function RecentTilSection() {
  const recentNotes = tilNotes.slice(0, 3);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#1b2631]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <SectionHeader
          badge="RUNNING TRADE-CRAFT LOG"
          title="TODAY I LEARNED (TIL) & TECHNIQUES"
          description="A quick-reference feed of offensive techniques, Active Directory attack paths, pivoting one-liners, and bypass scripts."
        />

        <Link
          href="/til"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0e151b] border border-[#1b2631] text-gray-200 font-mono text-xs font-semibold hover:border-[#00ff66]/50 hover:text-[#00ff66] transition-all self-start md:self-auto"
        >
          <span>BROWSE ALL NOTES</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recentNotes.map((note) => (
          <Link
            key={note.id}
            href={`/til#${note.slug}`}
            className="group relative p-5 rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/60 hover:bg-[#0e161d] transition-all duration-300 flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20">
                  {note.category}
                </span>
                <span className="text-[11px] font-mono text-gray-500">{note.date}</span>
              </div>

              <h3 className="font-mono text-base font-bold text-white group-hover:text-[#00ff66] transition-colors line-clamp-2 mb-2">
                {note.title}
              </h3>

              <p className="text-gray-400 text-xs font-sans line-clamp-2 mb-4">
                {note.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-[#17212a] flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500">{note.readTime}</span>
              <span className="text-[#00ff66] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                READ TECHNIQUE &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
