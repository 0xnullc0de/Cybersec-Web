'use client';

import React, { useState } from 'react';
import { Writeup } from '@/types';
import { Download, FileDown, FileText, Check, Lock, ShieldAlert } from 'lucide-react';
import { siteConfig } from '@/data/siteConfig';

interface DownloadButtonsProps {
  writeup: Writeup;
}

export default function DownloadButtons({ writeup }: DownloadButtonsProps) {
  const [downloadedMd, setDownloadedMd] = useState(false);

  const retiredNow = writeup.isRetired || Boolean(writeup.retirementDate && new Date(writeup.retirementDate).getTime() <= Date.now());
  // If the machine is active, downloading writeups is completely forbidden
  if (!retiredNow) {
    return (
      <div 
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-semibold select-none shadow-sm"
        title="Downloads are disabled for active lab machines to comply with CTF anti-cheat rules and prevent spoiler distribution."
      >
        <Lock className="w-3.5 h-3.5 text-amber-400" />
        <span>DOWNLOADS LOCKED (ACTIVE LAB)</span>
      </div>
    );
  }

  const handleDownloadMarkdown = () => {
    if (!retiredNow) return;

    const markdownContent = `---
title: "${writeup.title}"
platform: "${writeup.platform}"
difficulty: "${writeup.difficulty}"
os: "${writeup.os}"
tags: [${writeup.tags.map((t) => `"${t}"`).join(', ')}]
datePublished: "${writeup.datePublished}"
retirementDate: "${writeup.retirementDate || 'N/A'}"
author: "${siteConfig.name}"
foothold: "${writeup.initialAccessVector}"
privesc: "${writeup.privEscVector}"
---

# ${writeup.title} - ${writeup.platform} (${writeup.difficulty})

> **Summary:** ${writeup.summary}
> **Target IP:** ${writeup.ipAddress || '10.10.x.x'}
> **OS:** ${writeup.os}

${writeup.content}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${writeup.platform.toLowerCase()}-${writeup.slug}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedMd(true);
    setTimeout(() => setDownloadedMd(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!retiredNow) return;
    // Triggers browser print dialog in full cyberpunk dark mode
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 no-print">
      {/* Download Markdown */}
      <button
        onClick={handleDownloadMarkdown}
        className="px-3.5 py-2 rounded-lg bg-[#0e161c] border border-[#1e2a36] text-gray-200 font-mono text-xs font-semibold hover:border-[#00ff66]/50 hover:text-[#00ff66] hover:bg-[#121c24] transition-all flex items-center gap-2 shadow-sm"
        title="Download raw Markdown document"
      >
        {downloadedMd ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#00ff66]" />
            <span className="text-[#00ff66]">SAVED (.MD)</span>
          </>
        ) : (
          <>
            <FileText className="w-3.5 h-3.5 text-[#00ff66]" />
            <span>DOWNLOAD MD</span>
          </>
        )}
      </button>

      {/* Download PDF / Print Clean Report (Dark Mode) */}
      <button
        onClick={handleDownloadPdf}
        className="px-3.5 py-2 rounded-lg bg-[#00ff66] text-black font-mono text-xs font-bold hover:bg-[#00e55b] hover:shadow-glow transition-all flex items-center gap-2 shadow-sm"
        title="Export writeup as dark mode PDF dossier"
      >
        <FileDown className="w-3.5 h-3.5 text-black" />
        <span>EXPORT AS PDF</span>
      </button>
    </div>
  );
}
