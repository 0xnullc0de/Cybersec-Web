'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  Terminal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface RetirementGateProps {
  slug: string;
  previewContent: string;
  machineTitle: string;
  retirementDate: string | null;
  platform: string;
}

const MAX_ATTEMPTS = 5;

export default function RetirementGate({
  slug,
  previewContent,
  machineTitle,
  retirementDate,
  platform,
}: RetirementGateProps) {
  const [input, setInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockedContent, setUnlockedContent] = useState<string | null>(null);
  const [unlockedReason, setUnlockedReason] = useState<'passphrase' | 'retired' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(30);
  const [lines, setLines] = useState<string[]>([
    `> SYSTEM: Encrypted writeup vault initialised`,
    `> TARGET: ${machineTitle.toUpperCase()}`,
    `> STATUS: ACTIVE LAB — FULL CHAIN ENCRYPTED ON SERVER`,
    `> AUTH REQUIRED: Submit access passphrase to unlock`,
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const termBodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal lines on update
  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockout) return;
    const interval = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setLockout(false);
          setAttempts(0);
          setFailed(false);
          setLines((prev) => [
            ...prev,
            `> SYSTEM: Lockout expired. Auth window re-opened.`,
          ]);
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]);

  const pushLine = useCallback((line: string) => {
    setLines((prev) => [...prev, line]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockout || isSubmitting || !input.trim()) return;

    const guess = input.trim();
    setInput('');
    setIsSubmitting(true);

    pushLine(`> INPUT: ${'*'.repeat(Math.min(guess.length, 36))}`);
    pushLine(`> VERIFYING... querying server hash validation`);

    try {
      const res = await fetch(`/api/writeups/${slug}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: guess }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.fullContent) {
        pushLine(`> AUTH: Passphrase verified server-side ✓`);
        pushLine(`> DECRYPTING... █████████████████████ 100%`);
        pushLine(`> ACCESS GRANTED — full exploitation chain decrypted`);
        setUnlockedContent(data.fullContent);
        setUnlockedReason(data.unlockedReason);
        setFailed(false);
        setTimeout(() => setUnlocked(true), 800);
      } else {
        const remaining = Math.max(0, MAX_ATTEMPTS - (attempts + 1));
        pushLine(`> AUTH: Incorrect passphrase ✗ [${remaining} attempts remaining]`);
        setAttempts((a) => a + 1);
        setFailed(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);

        if (attempts + 1 >= MAX_ATTEMPTS) {
          pushLine(`> SYSTEM: Maximum failed attempts exceeded. Lockout engaged.`);
          setLockout(true);
          setLockoutSeconds(30);
        }
      }
    } catch (err) {
      pushLine(`> ERROR: Network verification failure. Please retry.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Unlocked state: render decrypted full content ────────────────────────
  if (unlocked && unlockedContent) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-bold uppercase tracking-wider">
              {unlockedReason === 'retired' ? 'MACHINE RETIRED' : 'PASSPHRASE VERIFIED'}
            </span>
            <span className="text-gray-400">&bull; Full exploitation chain decrypted</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
            STATUS: UNLOCKED
          </span>
        </div>

        <MarkdownRenderer content={unlockedContent} />
      </div>
    );
  }

  // ─── Locked state: cyber password prompt ──────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Alert banner */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121008] border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5 sm:mt-0">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="font-mono font-bold text-white uppercase flex items-center gap-2">
              <span>ACTIVE LAB MACHINE &bull; SPOILER PROTECTION ACTIVE</span>
            </div>
            <p className="text-amber-300/80 font-sans leading-relaxed">
              In accordance with {platform} community guidelines and CTF ethics,
              full exploitation vectors and flag captures remain server-side encrypted until{' '}
              <strong className="text-white">{machineTitle}</strong> is
              officially retired. Enter the writeup passphrase to decrypt early.
            </p>
            {retirementDate && (
              <div className="text-[11px] font-mono text-amber-400 font-semibold">
                Scheduled Retirement: {retirementDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blurred ghost container with live terminal password prompt */}
      <div className="relative rounded-2xl border border-dashed border-[#22313f] bg-[#070b0e] overflow-hidden select-none">
        {/* Fake blurred background lines */}
        <div className="filter blur-sm opacity-20 pointer-events-none space-y-4 font-mono text-sm p-6 sm:p-10">
          <div className="h-5 w-1/3 bg-gray-500 rounded" />
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-gray-600 rounded" />
            <div className="h-3.5 w-5/6 bg-gray-600 rounded" />
            <div className="h-3.5 w-4/6 bg-gray-600 rounded" />
          </div>
          <div className="p-4 rounded bg-black/40 border border-gray-800 space-y-2">
            <div className="h-3 w-1/2 bg-[#00ff66]/40 rounded" />
            <div className="h-3 w-3/4 bg-[#00ff66]/40 rounded" />
            <div className="h-3 w-2/3 bg-[#00ff66]/40 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-gray-600 rounded" />
            <div className="h-3.5 w-3/4 bg-gray-600 rounded" />
          </div>
          <div className="h-5 w-1/4 bg-amber-500/40 rounded" />
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-gray-600 rounded" />
            <div className="h-3.5 w-5/6 bg-gray-600 rounded" />
          </div>
          <div className="p-4 rounded bg-black/40 border border-gray-800 space-y-2">
            <div className="h-3 w-2/3 bg-[#00ff66]/40 rounded" />
            <div className="h-3 w-1/2 bg-[#00ff66]/40 rounded" />
          </div>
        </div>

        {/* Centered password prompt modal overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-t from-[#06090c] via-[#06090c]/85 to-[#06090c]/40">
          <div
            className={`max-w-lg w-full rounded-2xl bg-[#0a1015]/98 border shadow-2xl backdrop-blur-xl transition-all duration-150 ${
              shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
            } ${
              failed && !shake
                ? 'border-red-500/50 shadow-red-900/20'
                : 'border-amber-500/40'
            }`}
          >
            {/* Terminal title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1b2631] bg-[#06090c] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-gray-500 tracking-widest uppercase">
                  vault-decrypt — {machineTitle.toLowerCase().replace(/ /g, '-')}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                LOCKED
              </span>
            </div>

            {/* Terminal output stream */}
            <div
              ref={termBodyRef}
              className="p-4 h-36 sm:h-40 overflow-y-auto font-mono text-[11px] text-gray-400 space-y-1 bg-[#06090c]/85"
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={`leading-snug ${
                    line.includes('AUTH: Passphrase verified') ||
                    line.includes('ACCESS GRANTED')
                      ? 'text-[#00ff66]'
                      : line.includes('✗') ||
                          line.includes('ERROR') ||
                          line.includes('exceeded') ||
                          line.includes('Lockout engaged')
                        ? 'text-red-400'
                        : line.includes('DECRYPTING') || line.includes('VERIFYING')
                          ? 'text-amber-300'
                          : ''
                  }`}
                >
                  {line}
                </div>
              ))}
              <div className="text-[#00ff66] inline-flex items-center gap-1">
                <span>{'>'}</span>
                <span className="w-2 h-3.5 bg-[#00ff66] animate-pulse inline-block ml-1" />
              </div>
            </div>

            {/* Password input form */}
            <div className="p-5 space-y-4 border-t border-[#1b2631]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs text-gray-500 uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Access Passphrase</span>
                  {failed && !lockout && (
                    <span className="ml-auto text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Invalid Passphrase
                    </span>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={lockout || isSubmitting}
                      placeholder={
                        lockout
                          ? `Locked — ${lockoutSeconds}s remaining`
                          : isSubmitting
                            ? 'Validating server hash...'
                            : 'Enter passphrase (e.g. HTB{...})'
                      }
                      autoComplete="off"
                      spellCheck={false}
                      className={`w-full bg-[#06090c] border rounded-lg pl-9 pr-9 py-2.5 font-mono text-sm text-white placeholder-gray-600 outline-none transition-colors focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                        failed && !lockout
                          ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                          : 'border-[#1b2631] focus:border-[#00ff66]/60 focus:ring-[#00ff66]/20'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={lockout || isSubmitting || !input.trim()}
                    className="px-4 py-2.5 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black font-mono text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap shadow-glow"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5" />
                    )}
                    <span>{isSubmitting ? 'Verifying' : 'Decrypt'}</span>
                  </button>
                </form>
              </div>

              {/* Status and pips */}
              <div className="flex items-center justify-between font-mono text-[10px] text-gray-600">
                <span className="flex items-center gap-1">
                  {lockout ? (
                    <>
                      <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                      <span className="text-amber-400">
                        Lockout: {lockoutSeconds}s
                      </span>
                    </>
                  ) : (
                    <>
                      Attempts:{' '}
                      <span
                        className={
                          attempts >= 3 ? 'text-red-400' : 'text-gray-400'
                        }
                      >
                        {attempts}/{MAX_ATTEMPTS}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-gray-600">
                  SERVER-SIDE BCRYPT VALIDATION
                </span>
              </div>

              {/* Attempt indicators */}
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < attempts
                        ? 'bg-red-500'
                        : i === attempts && failed
                          ? 'bg-amber-500'
                          : 'bg-[#1b2631]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
