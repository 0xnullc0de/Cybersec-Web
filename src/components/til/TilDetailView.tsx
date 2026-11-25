'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { TilNote } from '@/types';
import MarkdownRenderer from '@/components/writeups/MarkdownRenderer';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  Unlock,
  KeyRound,
  Terminal,
  Share2,
  Check,
  Tag,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

interface TilDetailViewProps {
  note: TilNote;
}

export default function TilDetailView({ note }: TilDetailViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Restore unlocked session from sessionStorage
  useEffect(() => {
    if (note.isLocked && note.id) {
      try {
        const cached = sessionStorage.getItem(`til_unlocked_${note.id}`);
        if (cached) {
          setUnlockedContent(cached);
        }
      } catch (e) {}
    }
  }, [note.isLocked, note.id]);

  const isEffectivelyLocked = note.isLocked && !unlockedContent && !note.content;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setUnlockError(null);

    try {
      const res = await fetch(`/api/til/${note.id || note.slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passphrase.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.fullContent) {
        setUnlockedContent(data.fullContent);
        try {
          if (note.id) sessionStorage.setItem(`til_unlocked_${note.id}`, data.fullContent);
          sessionStorage.setItem(`til_unlocked_${note.slug}`, data.fullContent);
        } catch (e) {}
        setPassphrase('');
        setUnlockError(null);
      } else {
        setUnlockError(data.error || 'Access Denied: Invalid Passphrase');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err: any) {
      setUnlockError('Network failure during verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelock = () => {
    try {
      if (note.id) sessionStorage.removeItem(`til_unlocked_${note.id}`);
      sessionStorage.removeItem(`til_unlocked_${note.slug}`);
    } catch (e) {}
    setUnlockedContent(null);
    setPassphrase('');
    setUnlockError(null);
  };

  const displayContent = unlockedContent || note.content || '';

  return (
    <article className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb Navigation */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/til"
          className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-[#00ff66] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>&larr; BACK TO TIL NOTES</span>
        </Link>

        <div className="flex items-center gap-2">
          {note.isLocked && !isEffectivelyLocked && (
            <button
              onClick={handleRelock}
              className="px-2.5 py-1 rounded bg-[#121921] hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 text-xs font-mono border border-[#1e2a36] flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Relock Note</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="px-3 py-1 rounded bg-[#0e161d] hover:bg-[#16232e] text-gray-300 hover:text-[#00ff66] text-xs font-mono border border-[#1e2a36] flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ff66]" />
                <span className="text-[#00ff66]">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Note Header Box */}
      <div
        className={`p-6 sm:p-8 rounded-2xl bg-[#0a0f14] border shadow-2xl space-y-5 mb-8 ${
          note.isLocked && isEffectivelyLocked
            ? 'border-amber-500/30 bg-gradient-to-b from-[#0e1217] to-[#0a0f14]'
            : 'border-[#1b2631]'
        }`}
      >
        {/* Badges: Category + Vault Status + Date + Read Time */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#00ff66]/10 text-[#00ff66] font-semibold border border-[#00ff66]/25">
              {note.category}
            </span>

            {note.isLocked ? (
              isEffectivelyLocked ? (
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/30 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-400" />
                  VAULT PROTECTED
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  DECRYPTED
                </span>
              )
            ) : (
              <span className="px-2 py-0.5 rounded bg-gray-800/60 text-gray-400 text-[11px] border border-gray-700/50">
                PUBLIC
              </span>
            )}

            <span className="text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {note.date}
            </span>
            <span className="text-gray-500 hidden sm:inline">&bull;</span>
            <span className="text-gray-500 hidden sm:inline flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {note.readTime}
            </span>
          </div>
        </div>

        {/* Note Title */}
        <h1 className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          {note.isLocked && (
            <Lock className={`w-6 h-6 shrink-0 ${isEffectivelyLocked ? 'text-amber-400' : 'text-emerald-400'}`} />
          )}
          <span>{note.title}</span>
        </h1>

        {/* Note Summary */}
        {note.summary && (
          <p className="text-gray-300 text-sm sm:text-base font-sans leading-relaxed border-l-2 border-[#00ff66]/40 pl-4 py-0.5 bg-[#080d12]/60 rounded-r-lg">
            {note.summary}
          </p>
        )}

        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#17212a]">
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#111922] text-gray-300 border border-[#22313f]"
              >
                #{tag.replace(/^#/, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Body: Markdown Content or Passphrase Gate */}
      <div className="p-6 sm:p-10 rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-xl">
        {isEffectivelyLocked ? (
          /* Locked Passphrase Gate */
          <div className={`p-6 sm:p-8 rounded-xl bg-[#070b0e] border border-amber-500/30 space-y-6 ${shake ? 'animate-shake' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
                  <span>CONFIDENTIAL RED TEAM FIELD NOTE</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                    ENCRYPTED
                  </span>
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
                  This note contains restricted operational attack tradecraft or sensitive payload parameters. Submit the decryption passphrase to inspect the technique.
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Terminal className="w-4 h-4 text-amber-400/80" />
                </div>
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter note decryption passphrase..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0c1218] border border-[#233342] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-gray-500 font-mono text-xs sm:text-sm transition-all"
                  autoFocus
                />
              </div>

              {unlockError && (
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !passphrase.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-mono text-xs font-bold uppercase transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Decrypt Note</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : displayContent ? (
          <div className="prose prose-invert max-w-none">
            <MarkdownRenderer content={displayContent} />
          </div>
        ) : (
          <div className="text-center py-12 font-mono text-xs text-gray-500">
            No note content recorded.
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="mt-10 pt-6 border-t border-[#17212a] flex items-center justify-between">
        <Link
          href="/til"
          className="text-xs font-mono text-gray-400 hover:text-[#00ff66] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Techniques</span>
        </Link>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs font-mono text-gray-400 hover:text-[#00ff66] transition-colors"
        >
          &uarr; Back to Top
        </button>
      </div>
    </article>
  );
}
