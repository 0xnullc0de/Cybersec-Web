'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ListFilter, ChevronDown, ChevronRight, Compass, Clock, BookOpen, Check } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Parse headings from markdown content
  const headings = useMemo<TocItem[]>(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const items: TocItem[] = [];

    // Filter out code blocks to avoid extracting headings from scripts/output
    let insideCodeFence = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('```')) {
        insideCodeFence = !insideCodeFence;
        continue;
      }
      if (insideCodeFence) continue;

      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace('## ', '').trim();
        if (text) {
          items.push({
            id: slugifyHeading(text),
            text,
            level: 2,
          });
        }
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace('### ', '').trim();
        if (text) {
          items.push({
            id: slugifyHeading(text),
            text,
            level: 3,
          });
        }
      }
    }

    return items;
  }, [content]);

  // Calculate estimated reading time
  const readingTime = useMemo(() => {
    if (!content) return '1 min read';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  }, [content]);

  // IntersectionObserver to highlight current active heading
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting heading
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry) {
          setActiveId(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0.1,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Keep active heading visible inside the TOC nav container
  useEffect(() => {
    if (!activeId) return;
    const itemEl = document.getElementById(`toc-item-${activeId}`);
    if (itemEl) {
      itemEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // offset for fixed navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveId(id);
      setIsOpenMobile(false);
    }
  };

  return (
    <>
      {/* Mobile Collapsible Drawer */}
      <div className="lg:hidden mb-6 rounded-xl bg-[#0a0f14] border border-[#1b2631] overflow-hidden no-print">
        <button
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="w-full px-4 py-3 flex items-center justify-between font-mono text-xs text-gray-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-[#00ff66]" />
            <span className="font-semibold text-white uppercase tracking-wider">
              TABLE OF CONTENTS
            </span>
            <span className="text-gray-500 text-[10px]">({headings.length} sections)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-sans flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#00ff66]" />
              {readingTime}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpenMobile ? 'rotate-180 text-[#00ff66]' : ''
              }`}
            />
          </div>
        </button>

        {isOpenMobile && (
          <div className="px-4 pb-4 pt-1 border-t border-[#17222c] space-y-1 max-h-72 overflow-y-auto">
            {headings.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`w-full text-left font-mono text-xs py-1.5 px-2.5 rounded transition-all flex items-center gap-2 ${
                    item.level === 3 ? 'pl-6 text-[11px]' : ''
                  } ${
                    isActive
                      ? 'bg-[#00ff66]/15 text-[#00ff66] font-bold border border-[#00ff66]/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={isActive ? 'text-[#00ff66]' : 'text-gray-600'}>
                    {item.level === 2 ? '#' : '>>'}
                  </span>
                  <span className="truncate">{item.text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col rounded-2xl bg-[#0a0f14] border border-[#1b2631] p-4 sm:p-5 shadow-2xl no-print max-h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#17222c] pb-3 shrink-0 mb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-white font-bold tracking-wider uppercase">
            <Compass className="w-4 h-4 text-[#00ff66]" />
            <span>NAVIGATION MATRIX</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#00ff66]" />
            {readingTime}
          </span>
        </div>

        {/* Headings List - Strictly contained with internal scroll */}
        <nav className="space-y-1 overflow-y-auto pr-1.5 scrollbar-thin flex-1 min-h-0 py-1">
          {headings.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                id={`toc-item-${item.id}`}
                onClick={() => scrollToHeading(item.id)}
                className={`w-full text-left font-mono transition-all rounded py-1.5 px-2 flex items-center gap-2 ${
                  item.level === 3 ? 'pl-5 text-[11px]' : 'text-xs'
                } ${
                  isActive
                    ? 'bg-[#00ff66]/15 text-[#00ff66] font-bold border-l-2 border-[#00ff66] shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]'
                }`}
              >
                <span className={isActive ? 'text-[#00ff66] font-bold' : 'text-gray-600'}>
                  {item.level === 2 ? '#' : '·'}
                </span>
                <span className="truncate leading-snug">{item.text}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="pt-3 mt-3 border-t border-[#17222c] flex items-center justify-between text-[10px] font-mono text-gray-500 shrink-0">
          <span>{headings.length} SECTIONS</span>
          <span className="text-[#00ff66]">INTERACTIVE TOC</span>
        </div>
      </aside>
    </>
  );
}
