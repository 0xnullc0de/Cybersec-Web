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
  const [isTagsExpanded, setIsTagsExpanded] = React.useState(false);
  const [tagSearchQuery, setTagSearchQuery] = React.useState('');

  const platforms = ['All', 'HTB', 'HTB Pro Lab', 'THM'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Insane'];
  const statuses = [
    { label: 'All Status', value: 'all' },
    { label: '🏢 Pro Labs (Locked)', value: 'pro-lab' },
    { label: '✓ Retired (Full)', value: 'retired' },
    { label: '🔒 Active (Preview)', value: 'active' },
  ];

  // Filter tags based on tagSearchQuery
  const filteredTags = React.useMemo(() => {
    if (!tagSearchQuery.trim()) return availableTags;
    const q = tagSearchQuery.toLowerCase().trim();
    return availableTags.filter((t) => t.toLowerCase().includes(q));
  }, [availableTags, tagSearchQuery]);

  const INITIAL_TAG_LIMIT = 24;
  const displayedTags = React.useMemo(() => {
    if (tagSearchQuery.trim() || isTagsExpanded) {
      return filteredTags;
    }
    const base = filteredTags.slice(0, INITIAL_TAG_LIMIT);
    // If selectedTag is active and not in the initial slice, ensure it's displayed so user sees their active selection
    if (
      selectedTag !== 'all' &&
      !base.some((t) => t.toLowerCase() === selectedTag.toLowerCase()) &&
      availableTags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
    ) {
      return [selectedTag, ...base];
    }
    return base;
  }, [filteredTags, isTagsExpanded, tagSearchQuery, selectedTag, availableTags]);

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

      {/* Dynamic Tags row */}
      <div className="pt-3 border-t border-[#17222c] space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
              FILTER TAG:
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              ({availableTags.length} available)
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Quick Tag Search Input */}
            {availableTags.length > 8 && (
              <div className="relative inline-flex items-center">
                <Search className="w-3 h-3 text-gray-500 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Find tag (e.g. BackupOperators)..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-6 pr-5 py-1 rounded text-[11px] font-mono bg-[#0e151b] border border-[#22313f] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00ff66] w-36 sm:w-56 transition-all"
                />
                {tagSearchQuery && (
                  <button
                    onClick={() => setTagSearchQuery('')}
                    className="absolute right-1.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setTagSearchQuery('');
                  onReset();
                }}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 hover:text-red-300 underline"
              >
                <X className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Tags Chips Container */}
        <div
          className={`flex flex-wrap items-center gap-1.5 transition-all ${
            isTagsExpanded ? 'max-h-64 overflow-y-auto pr-1' : ''
          }`}
        >
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
              selectedTag === 'all'
                ? 'bg-white/10 text-white font-bold border border-white/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Tags
          </button>

          {displayedTags.map((tag) => {
            const isSelected = selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                  isSelected
                    ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/50 font-bold shadow-sm'
                    : 'bg-[#0e151b] text-gray-400 border border-[#22313f] hover:border-[#00ff66]/30 hover:text-gray-200'
                }`}
              >
                #{tag}
              </button>
            );
          })}

          {!tagSearchQuery.trim() && filteredTags.length > INITIAL_TAG_LIMIT && (
            <button
              onClick={() => setIsTagsExpanded((prev) => !prev)}
              className="px-2 py-0.5 rounded text-[11px] font-mono text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/30 hover:bg-[#00ff66]/20 transition-all font-semibold"
            >
              {isTagsExpanded ? 'Show Less' : `+${filteredTags.length - INITIAL_TAG_LIMIT} more`}
            </button>
          )}

          {tagSearchQuery.trim() && displayedTags.length === 0 && (
            <span className="text-[11px] font-mono text-gray-500 italic py-0.5">
              No tags matching &quot;{tagSearchQuery}&quot;
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
