'use client';

import React, { useState, useMemo } from 'react';
import { tilNotes } from '@/data/til';
import TilCard from '@/components/til/TilCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { Search, Filter, X, Terminal, BookOpen } from 'lucide-react';

export default function TilPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Active Directory', 'Privilege Escalation', 'Tooling'];

  const filteredNotes = useMemo(() => {
    return tilNotes.filter((note) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = note.content.toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSummary = note.summary.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesSummary) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'All' && note.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Page Header */}
      <SectionHeader
        badge="PERSISTENT KNOWLEDGE BASE"
        title="TODAY I LEARNED (TIL) & TECHNIQUES"
        description="A reverse-chronological timeline of offensive attack patterns, Active Directory evasion notes, and pivoting cheatsheets compiled during active research and CTFs."
      />

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-xl space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-xs">
            <Search className="w-4 h-4 text-[#00ff66] mr-1.5" />
            <span className="text-gray-500 hidden sm:inline">$ grep -E</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, syntax, tools, or techniques..."
            className="w-full pl-24 pr-4 py-2.5 rounded-lg bg-[#0e151b] border border-[#22313f] text-white placeholder-gray-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#17222c]">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#00ff66] text-black font-bold shadow-sm'
                    : 'bg-[#121920] text-gray-300 border border-[#22313f] hover:border-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs text-gray-500">
            Notes: <strong className="text-[#00ff66]">{filteredNotes.length}</strong>
          </div>
        </div>
      </div>

      {/* Timeline Feed Container */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-2 relative pt-4">
          {filteredNotes.map((note) => (
            <TilCard key={note.id} note={note} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-2xl bg-[#0a0f14] border border-[#1b2631]">
          <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <h3 className="font-mono text-base font-bold text-white mb-1">
            No matching techniques found
          </h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Try adjusting your query or resetting category selection.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-1.5 rounded bg-[#00ff66] text-black font-mono text-xs font-bold uppercase"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
