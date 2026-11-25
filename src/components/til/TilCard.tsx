'use client';

import React, { useState, useEffect } from 'react';
import { TilNote } from '@/types';
import MarkdownRenderer from '@/components/writeups/MarkdownRenderer';
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Share2,
  Check,
  Tag,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Terminal,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface TilCardProps {
  note: TilNote;
}

export default function TilCard({ note }: TilCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Locked Note State
  const [passphrase, setPassphrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Check sessionStorage for previously unlocked note in this session
  useEffect(() => {
    if (note.isLocked && note.id) {
      try {
        const cached = sessionStorage.getItem(`til_unlocked_${note.id}`);
        if (cached) {
          setUnlockedContent(cached);
        }
      } catch (e) {
        // Ignore sessionStorage restrictions if disabled
      }
    }
  }, [note.isLocked, note.id]);

  const isEffectivelyLocked = note.isLocked && !unlockedContent && !note.content;

  const handleShare = () => {
    const url = `${window.location.origin}/til#${note.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setUnlockError(null);

    try {
      const res = await fetch(`/api/til/${note.id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passphrase.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.content) {
        setUnlockedContent(data.content);
        try {
          sessionStorage.setItem(`til_unlocked_${note.id}`, data.content);
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
      sessionStorage.removeItem(`til_unlocked_${note.id}`);
    } catch (e) {}
    setUnlockedContent(null);
    setPassphrase('');
    setUnlockError(null);
  };

  const displayContent = unlockedContent || note.content || '';

  return (
    <article
      id={note.slug}
      className="relative pl-6 sm:pl-10 pb-12 group scroll-mt-28"
    >
      {/* Timeline vertical connector line */}
      <div className="absolute left-[7px] sm:left-[11px] top-6 bottom-0 w-[2px] bg-[#1a2530] group-last:hidden" />

      {/* Glowing Timeline Marker Dot */}
      <div
        className={`absolute left-0 sm:left-1 top-2.5 w-4 h-4 rounded-full bg-[#090d10] border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${
          note.isLocked
            ? isEffectivelyLocked
              ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'border-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.5)]'
            : 'border-[#00ff66] shadow-glow'
        }`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            note.isLocked && isEffectivelyLocked ? 'bg-amber-500' : 'bg-[#00ff66]'
          }`}
        />
      </div>

      {/* Note Card Container */}
      <div
        className={`p-6 sm:p-8 rounded-2xl bg-[#0a0f14] border transition-all shadow-xl space-y-4 ${
          note.isLocked && isEffectivelyLocked
            ? 'border-amber-500/30 group-hover:border-amber-500/60 bg-gradient-to-b from-[#0e1217] to-[#0a0f14]'
            : 'border-[#1b2631] group-hover:border-[#00ff66]/40'
        }`}
      >
        {/* Card Header: Category + Date + Lock Status + Share */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[#00ff66]/10 text-[#00ff66] font-semibold border border-[#00ff66]/25">
              {note.category}
            </span>

            {/* Locked Vault Badge */}
            {note.isLocked && (
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

          <div className="flex items-center gap-2">
            {note.isLocked && !isEffectivelyLocked && (
              <button
                onClick={handleRelock}
                className="px-2 py-1 rounded bg-[#121921] hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 text-[11px] font-mono border border-[#1e2a36] flex items-center gap-1 transition-colors"
                title="Lock note again"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Relock</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-1.5 rounded bg-[#121921] hover:bg-[#1a2430] text-gray-400 hover:text-white transition-colors"
              title="Copy link to note"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00ff66]" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded bg-[#121921] hover:bg-[#1a2430] text-gray-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse note' : 'Expand note'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h2 className="font-mono text-xl sm:text-2xl font-bold text-white group-hover:text-[#00ff66] transition-colors flex items-center gap-2">
          {note.isLocked && (
            <Lock className={`w-5 h-5 shrink-0 ${isEffectivelyLocked ? 'text-amber-400' : 'text-emerald-400'}`} />
          )}
          <a href={`#${note.slug}`} className="hover:underline">
            {note.title}
          </a>
        </h2>

        {/* Short Summary */}
        <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed">
          {note.summary}
        </p>

        {/* Note Body or Locked Gate */}
        {isExpanded && (
          <div className="pt-4 border-t border-[#17222c]">
            {isEffectivelyLocked ? (
              /* Locked Passphrase Gate */
              <div className={`p-5 sm:p-6 rounded-xl bg-[#070b0e] border border-amber-500/30 space-y-4 ${shake ? 'animate-shake' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                      <span>CONFIDENTIAL RED TEAM FIELD NOTE</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-normal">
                        ENCRYPTED
                      </span>
                    </h3>
                    <p className="text-gray-400 text-xs font-sans">
                      This technical note contains sensitive operational tradecraft, internal payloads, or proprietary research. Submit the correct access passphrase to decrypt and inspect the full technique.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUnlock} className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Terminal className="w-4 h-4 text-amber-400/80" />
                    </div>
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter note decryption passphrase..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#0c1218] border border-[#233342] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-gray-500 font-mono text-xs sm:text-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !passphrase.trim()}
                    className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4" />
                        Decrypt Technique
                      </>
                    )}
                  </button>
                </form>

                {unlockError && (
                  <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{unlockError}</span>
                  </div>
                )}
              </div>
            ) : (
              /* Decrypted / Public Content */
              <div className="space-y-4">
                {note.isLocked && unlockedContent && (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>VAULT NOTE DECRYPTED &bull; Full technical walkthrough unlocked</span>
                    </div>
                  </div>
                )}
                <MarkdownRenderer content={displayContent} />
              </div>
            )}
          </div>
        )}

        {/* Tags Row */}
        <div className="pt-3 border-t border-[#17222c] flex flex-wrap items-center gap-1.5">
          <Tag className="w-3 h-3 text-gray-600 mr-1" />
          {note.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#111820] text-gray-400 border border-[#1e2a36]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

