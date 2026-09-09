'use client';

import React from 'react';
import { Platform, Difficulty } from '@/types';
import { Search, Filter, X, LayoutGrid, ListFilter } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (p: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (d: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  availableTags: string[];
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
}

export default function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedPlatform,
  setSelectedPlatform,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStatus,
  setSelectedStatus,
  selectedTag,
  setSelectedTag,
  availableTags,
  viewMode,
  setViewMode,
  onReset,
  hasActiveFilters,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const platforms = ['All', 'HTB', 'THM'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const statuses = [
    { label: 'All Status', value: 'all' },
    { label: '✓ Retired (Full)', value: 'retired' },
    { label: '🔒 Active (Preview)', value: 'active' },
  ];

  return (
    <div className="space-y-4 mb-10 p-5 rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-xl">
      {/* Top row: Search input & View toggles */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Terminal styled Search bar */}
        <div className="relative w-full sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-xs">
            <Search className="w-4 h-4 text-[#00ff66] mr-1.5" />
            <span className="text-gray-500 hidden xs:inline">$ grep -i</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search box name, tag, CVE, or vector..."
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

        {/* View Mode Toggle & Results Count */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 font-mono text-xs">
          <span className="text-gray-400">
            Showing <strong className="text-[#00ff66]">{filteredCount}</strong> of {totalCount}
          </span>

          <div className="flex items-center rounded-lg bg-[#0e151b] border border-[#22313f] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#00ff66] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#00ff66] text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[#17222c]">
        {/* Platform Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Platform:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  selectedPlatform === p
                    ? 'bg-[#00ff66] text-black font-bold shadow-sm'
                    : 'bg-[#121920] text-gray-300 border border-[#22313f] hover:border-gray-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Difficulty:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  selectedDifficulty === d
                    ? 'bg-[#00ff66] text-black font-bold shadow-sm'
                    : 'bg-[#121920] text-gray-300 border border-[#22313f] hover:border-gray-500'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Retirement Status Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Lab Machine State:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  selectedStatus === s.value
                    ? 'bg-[#00ff66] text-black font-bold shadow-sm'
                    : 'bg-[#121920] text-gray-300 border border-[#22313f] hover:border-gray-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Tags row */}
      <div className="pt-3 border-t border-[#17222c] flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-mono text-gray-500 mr-1">FILTER TAG:</span>
        <button
          onClick={() => setSelectedTag('all')}
          className={`px-2 py-0.5 rounded text-[11px] font-mono ${
            selectedTag === 'all'
              ? 'bg-white/10 text-white font-bold border border-white/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Tags
        </button>
        {availableTags.slice(0, 8).map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? 'all' : tag)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              selectedTag === tag
                ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/50 font-bold'
                : 'bg-[#0e151b] text-gray-400 border border-[#22313f] hover:border-[#00ff66]/30 hover:text-gray-200'
            }`}
          >
            #{tag}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono text-red-400 hover:text-red-300 underline"
          >
            <X className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
