'use client';

import React, { useState, useMemo } from 'react';
import { writeups } from '@/data/writeups';
import WriteupCard from '@/components/writeups/WriteupCard';
import FilterBar from '@/components/writeups/FilterBar';
import SectionHeader from '@/components/ui/SectionHeader';
import PlatformBadge from '@/components/ui/PlatformBadge';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import Link from 'next/link';
import { Terminal, Shield, Lock, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react';

export default function WriteupsPage() {
  const [allWriteups, setAllWriteups] = useState(writeups);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  React.useEffect(() => {
    fetch(`/api/writeups?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllWriteups(data);
        }
      })
      .catch((err) => console.error('Error fetching live writeups:', err));
  }, []);

  // Extract unique tags from all writeups
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    allWriteups.forEach((w) => w.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [allWriteups]);

  // Filtered writeups calculation
  const filteredWriteups = useMemo(() => {
    return allWriteups.filter((w) => {

      // 1. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = w.title.toLowerCase().includes(q);
        const matchesSummary = w.summary.toLowerCase().includes(q);
        const matchesVectors =
          w.initialAccessVector.toLowerCase().includes(q) ||
          w.privEscVector.toLowerCase().includes(q);
        const matchesTags = w.tags.some((t) => t.toLowerCase().includes(q));
        const matchesOs = w.os.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesVectors && !matchesTags && !matchesOs) {
          return false;
        }
      }

      // 2. Platform filter
      if (selectedPlatform !== 'All') {
        if (selectedPlatform === 'HTB Pro Lab' && !w.isProLab && w.platform !== 'HTB Pro Lab') {
          return false;
        }
        if (selectedPlatform !== 'HTB Pro Lab' && w.platform !== selectedPlatform) {
          return false;
        }
      }

      // 3. Difficulty filter
      if (selectedDifficulty !== 'All' && w.difficulty !== selectedDifficulty) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus === 'pro-lab' && !w.isProLab) {
        return false;
      }
      if (selectedStatus === 'retired' && (!w.isRetired || w.isProLab)) {
        return false;
      }
      if (selectedStatus === 'active' && (w.isRetired || w.isProLab)) {
        return false;
      }

      // 5. Tag filter
      if (selectedTag !== 'all' && !w.tags.includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [allWriteups, searchQuery, selectedPlatform, selectedDifficulty, selectedStatus, selectedTag]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedPlatform !== 'All' ||
    selectedDifficulty !== 'All' ||
    selectedStatus !== 'all' ||
    selectedTag !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPlatform('All');
    setSelectedDifficulty('All');
    setSelectedStatus('all');
    setSelectedTag('all');
  };

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <SectionHeader
        badge="OFFENSIVE VAULT"
        title="CTF & LAB EXPLOITATION WRITEUPS"
        description="Comprehensive, step-by-step penetration testing walkthroughs covering Hack The Box machines, HTB Pro Labs, and TryHackMe networks with complete privilege escalation chains."
      />

      {/* Datastore Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 rounded-xl bg-[#0a0f14] border border-[#1b2631]">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-pulse" />
          <span>DATASTORE:</span>
          <strong className="text-white">SUPABASE POSTGRESQL &amp; STORAGE</strong>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-gray-400">
            TOTAL WRITEUPS: <strong className="text-[#00ff66]">{allWriteups.length}</strong>
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-purple-400">
            PRO LABS: <strong>{allWriteups.filter(w => w.isProLab).length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        availableTags={availableTags}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={allWriteups.length}
        filteredCount={filteredWriteups.length}
      />

      {/* Writeups Cards Container */}
      {filteredWriteups.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWriteups.map((writeup) => (
              <WriteupCard key={writeup.slug} writeup={writeup} />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredWriteups.map((w) => (
              <Link
                key={w.slug}
                href={`/writeups/${w.slug}`}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/60 hover:bg-[#0e161d] transition-all gap-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={w.platform} size="sm" />
                    <DifficultyBadge difficulty={w.difficulty} size="sm" />
                  </div>

                  <div>
                    <h3 className="font-mono text-base font-bold text-white group-hover:text-[#00ff66] transition-colors">
                      {w.title} <span className="text-gray-500 font-normal text-xs">[{w.os}]</span>
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-1 max-w-xl font-sans">
                      {w.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 font-mono text-xs">
                  {w.isRetired ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Retired</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}

                  <span className="text-gray-500">{w.datePublished}</span>
                  <span className="text-[#00ff66] font-semibold flex items-center gap-1">
                    Read &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Zero Results State */
        <div className="text-center py-20 p-8 rounded-2xl bg-[#0a0f14] border border-[#1b2631]">
          <div className="w-12 h-12 rounded-full bg-[#141c24] border border-gray-700 mx-auto flex items-center justify-center mb-4">
            <Terminal className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-mono text-lg font-bold text-white mb-2">
            No matching writeups found
          </h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Try adjusting your search keywords, clearing difficulty or tag filters to display more machines.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00ff66] text-black font-mono font-bold text-xs uppercase"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
