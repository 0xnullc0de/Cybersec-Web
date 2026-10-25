'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fallbackTools } from '@/data/tools';
import { Tool } from '@/types';
import SectionHeader from '@/components/ui/SectionHeader';
import { Search, Terminal, Code2, ExternalLink, ArrowRight, Wrench, Shield, Filter, X } from 'lucide-react';
import Link from 'next/link';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>(fallbackTools);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/tools')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTools(data);
        }
      })
      .catch((err) => console.error('Failed to load tools:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const raw = Array.from(new Set(tools.map((t) => t.category).filter(Boolean)));
    return ['All', ...raw];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = tool.name.toLowerCase().includes(q);
        const matchesDesc = tool.description.toLowerCase().includes(q);
        const matchesLang = tool.language.toLowerCase().includes(q);
        const matchesTags = tool.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesLang && !matchesTags) {
          return false;
        }
      }

      if (selectedCategory !== 'All' && tool.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [tools, searchQuery, selectedCategory]);

  const getLanguageColor = (lang: string) => {
    const lower = lang.toLowerCase();
    if (lower.includes('python')) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (lower.includes('bash') || lower.includes('sh')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (lower.includes('powershell') || lower.includes('ps1')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (lower.includes('go')) return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    if (lower.includes('rust')) return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    if (lower.includes('c') || lower.includes('c++')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    return 'text-gray-300 bg-gray-500/10 border-gray-500/20';
  };

  return (
    <div className="pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <SectionHeader
        badge="OFFENSIVE TOOLING & AUTOMATION"
        title="CUSTOM SECURITY TOOLS & SCRIPTS"
        description="Purpose-built exploit scripts, Active Directory privilege escalation helpers, and operational automation developed during red team engagements and Hack The Box labs."
      />

      {/* Filter & Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-xl space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-mono text-xs">
            <Search className="w-4 h-4 text-[#00ff66] mr-1.5" />
            <span className="text-gray-500 hidden sm:inline">$ which</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools by name, language, keyword, or exploit..."
            className="w-full pl-20 sm:pl-24 pr-4 py-2.5 rounded-lg bg-[#0e151b] border border-[#22313f] text-white placeholder-gray-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-[#00ff66] focus:ring-1 focus:ring-[#00ff66] transition-all"
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

        {/* Categories */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-mono transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#00ff66]/10 text-[#00ff66] border-[#00ff66]'
                  : 'bg-[#0e151b] text-gray-400 border-[#22313f] hover:text-white hover:border-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0a0f14] border border-[#1b2631]">
          <Terminal className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-white font-mono font-bold text-sm">No security tools match query</h3>
          <p className="text-gray-500 font-mono text-xs mt-1">Try clearing filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="group relative rounded-xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/40 transition-all duration-300 p-5 flex flex-col justify-between shadow-lg hover:shadow-[0_0_20px_rgba(0,255,102,0.07)]"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#0e151b] border border-[#22313f] text-[#00ff66] group-hover:border-[#00ff66]/50 transition-colors">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-mono font-bold text-white text-base group-hover:text-[#00ff66] transition-colors">
                        {tool.name}
                      </h3>
                      <span className="text-[11px] font-mono text-gray-500">{tool.category}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-semibold ${getLanguageColor(
                      tool.language
                    )}`}
                  >
                    {tool.language}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
                  {tool.description}
                </p>

                {/* Tags */}
                {tool.tags && tool.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0e151b] border border-[#1b2631] text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Links */}
              <div className="pt-4 mt-4 border-t border-[#1b2631] flex items-center justify-between gap-2">
                {tool.relatedWriteupSlug ? (
                  <Link
                    href={`/writeups/${tool.relatedWriteupSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Associated Writeup</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <div className="text-[11px] font-mono text-gray-600">Standalone Tool</div>
                )}

                {tool.githubUrl && (
                  <a
                    href={tool.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg bg-[#0e151b] border border-[#22313f] text-gray-300 hover:text-white hover:border-[#00ff66] transition-all"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-3 h-3 text-[#00ff66]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
