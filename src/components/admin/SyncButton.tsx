'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, X, Terminal, Database, FileText, Image as ImageIcon } from 'lucide-react';

interface SyncButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export default function SyncButton({ onSyncComplete, className = '' }: SyncButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const runSync = async () => {
    setIsSyncing(true);
    setResult(null);
    setLogs([
      '> INITIATING VAULT SYNCHRONIZATION...',
      '> CONNECTING TO NOTION CMS...',
      '> FETCHING WRITEUP PAGES & CODE BLOCKS...',
    ]);

    try {
      const res = await fetch('/api/sync/notion', { method: 'POST' });
      const data = await res.json();
      setResult(data);

      if (data.success) {
        setLogs((prev) => [
          ...prev,
          `> FOUND: ${data.pagesFound} pages in Notion workspace`,
          `> REHOSTED: ${data.imagesRehosted} images to Supabase Storage`,
          `> GENERATED: ${data.pdfsGenerated} dark-mode PDF walkthroughs`,
          `> UPSERTED: ${data.pagesSynced} writeup records in Supabase`,
          '> STATUS: VAULT SYNCHRONIZATION COMPLETE ✓',
        ]);
        if (onSyncComplete) onSyncComplete();
      } else {
        setLogs((prev) => [
          ...prev,
          `> NOTION STATUS: ${data.message}`,
          ...(data.errors || []).map((e: string) => `> ERROR: ${e}`),
          '> Note: Fallback and seed records in Supabase remain active.',
        ]);
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `> FATAL NETWORK ERROR: ${err.message || 'Sync failed'}`,
      ]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    runSync();
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        disabled={isSyncing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e171f] hover:bg-[#152330] border border-[#00ff66]/30 hover:border-[#00ff66] text-[#00ff66] font-mono text-xs font-semibold transition-all shadow-sm ${className}`}
        title="Pull latest writeups from Notion and sync to Supabase"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>SYNC NOTION</span>
      </button>

      {/* Sync Status Terminal Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a1015] border border-[#1b2631] shadow-2xl overflow-hidden text-left">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1b2631] bg-[#06090c]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <span className="ml-2 font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Notion &bull; Supabase Sync Engine
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Terminal Log Output */}
            <div className="p-4 h-52 overflow-y-auto font-mono text-xs text-gray-300 space-y-1.5 bg-[#05070a]">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`${
                    log.includes('COMPLETE ✓') || log.includes('REHOSTED:') || log.includes('GENERATED:')
                      ? 'text-[#00ff66]'
                      : log.includes('ERROR') || log.includes('FATAL')
                      ? 'text-amber-400'
                      : log.includes('FOUND:')
                      ? 'text-blue-400'
                      : 'text-gray-400'
                  }`}
                >
                  {log}
                </div>
              ))}
              {isSyncing && (
                <div className="text-[#00ff66] flex items-center gap-2 animate-pulse pt-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Executing pipeline (downloading images, compiling PDFs, hashing keys)...</span>
                </div>
              )}
            </div>

            {/* Stats Summary Bar */}
            {result && (
              <div className="p-4 border-t border-[#1b2631] bg-[#0d141b] grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="p-2 rounded bg-[#06090c] border border-[#1b2631]">
                  <div className="text-gray-500 text-[10px]">PAGES SYNCED</div>
                  <div className="text-white font-bold text-sm">{result.pagesSynced || 0}</div>
                </div>
                <div className="p-2 rounded bg-[#06090c] border border-[#1b2631]">
                  <div className="text-gray-500 text-[10px]">IMAGES HOSTED</div>
                  <div className="text-[#00ff66] font-bold text-sm">{result.imagesRehosted || 0}</div>
                </div>
                <div className="p-2 rounded bg-[#06090c] border border-[#1b2631]">
                  <div className="text-gray-500 text-[10px]">PDFS BUILT</div>
                  <div className="text-amber-400 font-bold text-sm">{result.pdfsGenerated || 0}</div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="p-4 border-t border-[#1b2631] flex items-center justify-between bg-[#06090c]">
              <span className="font-mono text-[10px] text-gray-500">
                TRIGGERABLE VIA CLI: npm run sync:notion
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={runSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded bg-[#16222d] hover:bg-[#1d2d3c] text-gray-300 hover:text-white font-mono text-xs transition-colors disabled:opacity-50"
                >
                  Retry Sync
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded bg-[#00ff66] hover:bg-[#00e65c] text-black font-mono text-xs font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
