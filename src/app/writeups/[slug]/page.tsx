import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { writeups } from '@/data/writeups';
import PlatformBadge from '@/components/ui/PlatformBadge';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import MarkdownRenderer from '@/components/writeups/MarkdownRenderer';
import RetirementGate from '@/components/writeups/RetirementGate';
import DownloadButtons from '@/components/writeups/DownloadButtons';
import { 
  ArrowLeft, 
  Calendar, 
  Server, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Hash, 
  Terminal, 
  Compass,
  AlertTriangle
} from 'lucide-react';

import { getWriteupBySlug, isWriteupRetired } from '@/lib/supabase';

interface WriteupPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WriteupDetailPage({ params }: WriteupPageProps) {
  const writeup = await getWriteupBySlug(params.slug);

  if (!writeup) {
    notFound();
  }


  const retiredNow = isWriteupRetired(writeup);

  return (
    <article className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back to writeups link */}
      <div className="mb-6 no-print">
        <Link
          href="/writeups"
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#00ff66] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&lt;&lt; BACK TO WRITEUPS VAULT</span>
        </Link>
      </div>

      {/* Metadata Header Box */}
      <header className="p-6 sm:p-8 rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-2xl mb-10 space-y-6">
        {/* Top Badges & Download Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={writeup.platform} />
            <DifficultyBadge difficulty={writeup.difficulty} />
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-[#141d26] text-gray-300 border border-[#22313f] flex items-center gap-1.5">
              <Server className="w-3 h-3 text-[#00ff66]" />
              <span>{writeup.os}</span>
            </span>

            {retiredNow ? (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OFFICIALLY RETIRED</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1 animate-pulse">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE LAB &bull; SPOILER GATED</span>
              </span>
            )}
          </div>

          {/* Download Buttons */}
          <DownloadButtons writeup={writeup} />
        </div>

        {/* Machine Title */}
        <div className="space-y-2">
          <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            {writeup.title} <span className="text-[#00ff66]">.HTB</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-sans leading-relaxed">
            {writeup.summary}
          </p>
        </div>

        {/* Attack Vector Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#080c0f] border border-[#18232c] font-mono text-xs">
            <div className="text-[#00ff66] font-bold mb-1 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>INITIAL FOOTHOLD VECTOR</span>
            </div>
            <p className="text-gray-300 font-sans text-xs sm:text-sm">
              {writeup.initialAccessVector}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#080c0f] border border-[#18232c] font-mono text-xs">
            <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PRIVILEGE ESCALATION CHAIN</span>
            </div>
            <p className="text-gray-300 font-sans text-xs sm:text-sm">
              {writeup.privEscVector}
            </p>
          </div>
        </div>

        {/* Metadata Footer: Date, Target IP, Tags */}
        <div className="pt-4 border-t border-[#17222c] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Published: <strong className="text-white">{writeup.datePublished}</strong>
            </span>
            {writeup.ipAddress && (
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gray-500" />
                Target IP: <strong className="text-[#00ff66]">{writeup.ipAddress}</strong>
              </span>
            )}
            {writeup.retirementDate && (
              <span>
                Retirement: <strong className="text-white">{writeup.retirementDate}</strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {writeup.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] bg-[#121a22] text-gray-300 border border-[#202e3b]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="bg-[#080c10] border border-[#17222c] rounded-2xl p-6 sm:p-10 shadow-xl print-clean">
        {retiredNow ? (
          /* RETIRED MACHINE: Full unhindered content */
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#1b2631] pb-4">
              <div className="font-mono text-xs text-[#00ff66] uppercase font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
                <span>UNRESTRICTED CTF DOCUMENTATION // FULL CHAIN VERIFIED</span>
              </div>
              <span className="text-gray-500 text-xs font-mono">MD5 VERIFIED</span>
            </div>

            <MarkdownRenderer content={writeup.content} />
          </div>
        ) : (
          /* ACTIVE MACHINE: Initial Recon Preview + Server-Gated RetirementGate */
          <div className="space-y-8">
            <MarkdownRenderer content={writeup.previewContent || ''} />

            <RetirementGate
              slug={writeup.slug}
              previewContent={writeup.previewContent || ''}
              machineTitle={writeup.title}
              retirementDate={writeup.retirementDate}
              platform={writeup.platform}
            />
          </div>
        )}
      </div>


      {/* Writeup Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-[#1b2631] flex items-center justify-between no-print">
        <Link
          href="/writeups"
          className="font-mono text-xs text-gray-400 hover:text-[#00ff66] transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO WRITEUPS INDEX</span>
        </Link>
        <Link
          href="/til"
          className="font-mono text-xs text-[#00ff66] hover:underline flex items-center gap-1"
        >
          <span>VIEW TIL TECHNIQUES &gt;&gt;</span>
        </Link>
      </div>
    </article>
  );
}
