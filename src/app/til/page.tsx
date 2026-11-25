'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tilNotes as fallbackNotes } from '@/data/til';
import { TilNote } from '@/types';
import TilCard from '@/components/til/TilCard';
import SectionHeader from '@/components/ui/SectionHeader';
import {
  Search,
  X,
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  LayoutGrid,
  List,
  RotateCcw,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

function TilContent({ initialView }: { initialView?: 'all' | 'public' | 'locked' }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryView = searchParams.get('view');
  const defaultTab: 'all' | 'public' | 'locked' =
    initialView || (queryView === 'vault' || queryView === 'locked' ? 'locked' : queryView === 'public' ? 'public' : 'all');

  const [notes, setNotes] = useState<TilNote[]>(fallbackNotes);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'locked'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queryView === 'vault' || queryView === 'locked') {
      setActiveTab('locked');
    } else if (queryView === 'public') {
      setActiveTab('public');
    }
  }, [queryView]);

  useEffect(() => {
    setLoading(true);
    fetch('/api/til')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setNotes(data);
        }
      })
      .catch((err) => console.error('Failed to load notes:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = notes.length;
  const lockedCount = useMemo(() => notes.filter((n) => !!n.isLocked).length, [notes]);
  const publicCount = totalCount - lockedCount;

  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean)));
    return ['All', ...rawCategories];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // 1. Vault Tab Filter
      if (activeTab === 'public' && note.isLocked) return false;
      if (activeTab === 'locked' && !note.isLocked) return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = (note.content || '').toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        const matchesSummary = (note.summary || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesSummary) {
          return false;
        }
      }

      // 3. Category Filter
      if (selectedCategory !== 'All' && note.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [notes, activeTab, searchQuery, selectedCategory]);

  const handleTabChange = (tab: 'all' | 'public' | 'locked') => {
    setActiveTab(tab);
    if (tab === 'all') {
      router.push('/til');
    } else if (tab === 'locked') {
      router.push('/til?view=vault');
    } else {
      router.push('/til?view=public');
    }
  };

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <SectionHeader
        badge={activeTab === 'locked' ? 'ENCRYPTED INTEL VAULT' : 'PERSISTENT KNOWLEDGE BASE'}
        title={activeTab === 'locked' ? 'LOCKED RESEARCH VAULT' : 'TODAY I LEARNED (TIL) & TECHNIQUES'}
        description={
          activeTab === 'locked'
            ? 'Restricted red team tradecraft notes, internal evasion mechanics, and sensitive operational payloads protected by cryptographic passphrases.'
            : 'Offensive security attack patterns, Active Directory evasion techniques, and tooling field notes compiled during research, engagements, and CTFs.'
        }
      />

      {/* Sub-Navigation Tabs: Public vs Locked Vault */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-xl bg-[#080d12] border border-[#1b2631]">
        <div className="flex items-center gap-1.5 p-1 bg-[#0b1218] rounded-lg">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#15212d] text-white shadow-sm border border-[#233342]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>ALL TECHNIQUES</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a2632] text-gray-300">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('public')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'public'
                ? 'bg-[#00ff66]/15 text-[#00ff66] shadow-sm border border-[#00ff66]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>PUBLIC</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1a2632] text-gray-300">
              {publicCount}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('locked')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'locked'
                ? 'bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/50'
                : 'text-gray-400 hover:text-amber-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>LOCKED VAULT</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
              {lockedCount}
            </span>
          </button>
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex items-center justify-end gap-2 px-2">
          <div className="flex items-center p-1 bg-[#0b1218] rounded-lg border border-[#1b2631]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#00ff66]/15 text-[#00ff66]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#00ff66]/15 text-[#00ff66]'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

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
            placeholder={
              activeTab === 'locked'
                ? 'Search locked vault techniques, tags, or topics...'
                : 'Search notes, syntax, tools, or techniques...'
            }
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

      {/* Grid or List Cards Container */}
      {filteredNotes.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <TilCard key={note.id || note.slug} note={note} />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Link
                key={note.id || note.slug}
                href={`/til/${note.slug}`}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/60 hover:bg-[#0e161d] transition-all gap-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/25">
                      {note.category}
                    </span>
                    {note.isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Public</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-mono text-base font-bold text-white group-hover:text-[#00ff66] transition-colors">
                      {note.title}
                    </h3>
                    {note.summary && (
                      <p className="text-gray-400 text-xs line-clamp-1 max-w-xl font-sans">
                        {note.summary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 font-mono text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{note.date}</span>
                  </div>
                  <span>&bull;</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{note.readTime}</span>
                  </div>
                  <span className="text-[#00ff66] font-semibold flex items-center gap-1">
                    Read &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 p-8 rounded-2xl bg-[#0a0f14] border border-[#1b2631]">
          {activeTab === 'locked' ? (
            <Lock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          ) : (
            <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          )}
          <h3 className="font-mono text-base font-bold text-white mb-1">
            {activeTab === 'locked'
              ? 'No locked vault techniques match this filter'
              : 'No matching techniques found'}
          </h3>
          <p className="text-gray-400 text-xs font-sans mb-4">
            Try adjusting your query, resetting category selection, or switching tabs.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ff66] text-black font-mono font-bold text-xs uppercase"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
            {activeTab === 'locked' && (
              <button
                onClick={() => handleTabChange('all')}
                className="px-4 py-2 rounded-lg bg-[#15212d] text-white font-mono text-xs font-semibold uppercase border border-[#2a3c4f]"
              >
                View All Techniques
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TilPage() {
  return (
    <Suspense fallback={<div className="pt-32 text-center font-mono text-xs text-gray-500">LOADING TECHNIQUES...</div>}>
      <TilContent />
    </Suspense>
  );
}
