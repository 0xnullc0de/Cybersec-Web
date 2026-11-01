'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Writeup } from '@/types';
import PlatformBadge from '@/components/ui/PlatformBadge';
import DifficultyBadge from '@/components/ui/DifficultyBadge';
import MarkdownRenderer from '@/components/writeups/MarkdownRenderer';
import TableOfContents from '@/components/writeups/TableOfContents';
import AttackFlowAndMitre from '@/components/writeups/AttackFlowAndMitre';
import RetirementGate from '@/components/writeups/RetirementGate';
import DownloadButtons from '@/components/writeups/DownloadButtons';
import { 
  ArrowLeft, 
  Calendar, 
  Server, 
  ShieldCheck, 
  Lock, 
  Unlock,
  CheckCircle2, 
  Terminal, 
  Compass,
  RotateCcw
} from 'lucide-react';

interface WriteupDetailViewProps {
  initialWriteup: Writeup;
  retiredNow: boolean;
  activeSafePreview: string;
}

export default function WriteupDetailView({
  initialWriteup,
  retiredNow,
  activeSafePreview,
}: WriteupDetailViewProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(retiredNow);
  const [unlockedContent, setUnlockedContent] = useState<string>(retiredNow ? initialWriteup.content : '');
  const [unlockedData, setUnlockedData] = useState<any>(null);

  // Restore unlocked session from sessionStorage so users don't have to re-enter passphrase on refresh/print
  useEffect(() => {
    if (retiredNow) return;
    try {
      const cached = sessionStorage.getItem(`unlocked_${initialWriteup.slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.fullContent) {
          setIsUnlocked(true);
          setUnlockedContent(parsed.fullContent);
          setUnlockedData(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to restore writeup unlock session:', err);
    }
  }, [initialWriteup.slug, retiredNow]);

  const handleUnlock = (fullContent: string, data?: any) => {
    setIsUnlocked(true);
    setUnlockedContent(fullContent);
    if (data) setUnlockedData(data);
    try {
      sessionStorage.setItem(
        `unlocked_${initialWriteup.slug}`,
        JSON.stringify({ fullContent, ...data })
      );
    } catch (err) {
      console.warn('Failed to save writeup unlock session:', err);
    }
  };

  const handleRelock = () => {
    try {
      sessionStorage.removeItem(`unlocked_${initialWriteup.slug}`);
    } catch {}
    setIsUnlocked(false);
    setUnlockedContent('');
    setUnlockedData(null);
  };

  const isEffectivelyRetired = retiredNow || isUnlocked;

  const effectiveWriteup: Writeup = useMemo(() => {
    return {
      ...initialWriteup,
      isRetired: isEffectivelyRetired,
      content: (isEffectivelyRetired ? (unlockedContent || initialWriteup.content) : activeSafePreview) || '',
      summary: unlockedData?.summary || initialWriteup.summary,
      initialAccessVector: unlockedData?.initialAccessVector || initialWriteup.initialAccessVector,
      privEscVector: unlockedData?.privEscVector || initialWriteup.privEscVector,
      tags: unlockedData?.tags || initialWriteup.tags,
      ipAddress: unlockedData?.ipAddress || initialWriteup.ipAddress,
    };
  }, [initialWriteup, isEffectivelyRetired, unlockedContent, activeSafePreview, unlockedData]);

  return (
    <article className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:p-0 print:m-0 print:max-w-none">
      {/* Back to writeups link */}
      <div className="mb-6 no-print print:hidden">
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
            <PlatformBadge platform={effectiveWriteup.platform} />
            <DifficultyBadge difficulty={effectiveWriteup.difficulty} />
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-[#141d26] text-gray-300 border border-[#22313f] flex items-center gap-1.5">
              <Server className="w-3 h-3 text-[#00ff66]" />
              <span>{effectiveWriteup.os}</span>
            </span>

            {retiredNow ? (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OFFICIALLY RETIRED</span>
              </span>
            ) : isUnlocked ? (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>ACTIVE LAB &bull; UNLOCKED VIA PASSPHRASE</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center gap-1 animate-pulse">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE LAB &bull; SPOILER GATED</span>
              </span>
            )}
          </div>

          {/* Download Buttons (Markdown & PDF) */}
          <DownloadButtons writeup={effectiveWriteup} isUnlocked={isEffectivelyRetired} />
        </div>

        {/* Machine Title */}
        <div className="space-y-2">
          <h1 className="font-mono text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            {effectiveWriteup.title} <span className="text-[#00ff66]">.HTB</span>
          </h1>
          {isEffectivelyRetired && effectiveWriteup.summary && (
            <p className="text-gray-400 text-sm sm:text-base font-sans leading-relaxed">
              {effectiveWriteup.summary}
            </p>
          )}
        </div>

        {/* Attack Vector Matrix - Shown when retired OR unlocked via passphrase */}
        {isEffectivelyRetired && (effectiveWriteup.initialAccessVector || effectiveWriteup.privEscVector) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {effectiveWriteup.initialAccessVector && (
              <div className="p-3.5 rounded-xl bg-[#080c0f] border border-[#18232c] font-mono text-xs">
                <div className="text-[#00ff66] font-bold mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>INITIAL FOOTHOLD VECTOR</span>
                </div>
                <p className="text-gray-300 font-sans text-xs sm:text-sm">
                  {effectiveWriteup.initialAccessVector}
                </p>
              </div>
            )}

            {effectiveWriteup.privEscVector && (
              <div className="p-3.5 rounded-xl bg-[#080c0f] border border-[#18232c] font-mono text-xs">
                <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PRIVILEGE ESCALATION CHAIN</span>
                </div>
                <p className="text-gray-300 font-sans text-xs sm:text-sm">
                  {effectiveWriteup.privEscVector}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metadata Footer: Date, Target IP, Tags */}
        <div className="pt-4 border-t border-[#17222c] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Published: <strong className="text-white">{effectiveWriteup.datePublished}</strong>
            </span>
            {effectiveWriteup.ipAddress && (
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gray-500" />
                Target IP: <strong className="text-[#00ff66]">{effectiveWriteup.ipAddress}</strong>
              </span>
            )}
            {effectiveWriteup.retirementDate && (
              <span>
                Retirement: <strong className="text-white">{effectiveWriteup.retirementDate}</strong>
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {effectiveWriteup.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] bg-[#121a22] text-gray-300 border border-[#202e3b]"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Visual Attack Flow & MITRE ATT&CK Matrix (Shown when retired OR unlocked) */}
        {isEffectivelyRetired && (
          <AttackFlowAndMitre writeup={effectiveWriteup} />
        )}
      </header>

      {/* 2-Column Responsive Layout: Main Article & Sticky Table of Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {/* Main Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 print:col-span-12 print:w-full bg-[#080c10] border border-[#17222c] rounded-2xl p-6 sm:p-10 shadow-xl print-clean min-w-0 print:p-4 print:border-none">
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

              <MarkdownRenderer content={effectiveWriteup.content} />
            </div>
          ) : isUnlocked ? (
            /* ACTIVE MACHINE: Unlocked via verified passphrase */
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-bold uppercase tracking-wider">
                    PASSPHRASE VERIFIED
                  </span>
                  <span className="text-gray-400">&bull; Full exploitation chain decrypted</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                    STATUS: UNLOCKED
                  </span>
                  <button
                    onClick={handleRelock}
                    className="no-print print:hidden text-gray-400 hover:text-red-400 text-[11px] font-mono flex items-center gap-1 transition-colors"
                    title="Lock writeup and re-engage spoiler protection"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>RE-LOCK</span>
                  </button>
                </div>
              </div>

              <MarkdownRenderer content={effectiveWriteup.content} />
            </div>
          ) : (
            /* ACTIVE MACHINE: Initial Recon Preview + Server-Gated RetirementGate */
            <div className="space-y-8">
              <MarkdownRenderer content={activeSafePreview} />

              <RetirementGate
                slug={initialWriteup.slug}
                previewContent={activeSafePreview}
                machineTitle={initialWriteup.title}
                retirementDate={initialWriteup.retirementDate}
                platform={initialWriteup.platform}
                onUnlock={handleUnlock}
              />
            </div>
          )}
        </div>

        {/* Right Sticky Sidebar: Navigation & Table of Contents (Automatically populated from decrypted content) */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 self-start no-print print:hidden">
          <TableOfContents content={isEffectivelyRetired ? effectiveWriteup.content : activeSafePreview} />
        </div>
      </div>

      {/* Writeup Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-[#1b2631] flex items-center justify-between no-print print:hidden">
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
