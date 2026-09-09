'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, Command, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by fenced code blocks to preserve them accurately
  const parts = content.split(/(```[\s\S]*?```)/g);
  let codeBlockCounter = 0;

  return (
    <div className="space-y-6 font-sans text-gray-300 leading-relaxed text-sm sm:text-base">
      {parts.map((part, index) => {
        if (!part) return null;

        // Fenced code / command block
        if (part.startsWith('```')) {
          codeBlockCounter++;
          const blockId = codeBlockCounter;
          // Match language with optional :command tag (e.g. ```bash:command or ```bash)
          const match = part.match(/^```([a-zA-Z0-9_:-]*)\n([\s\S]*?)```$/);
          const fullLang = match ? match[1] || 'bash' : 'bash';
          const isExplicitCommand = fullLang.includes(':command') || fullLang.includes(':terminal');
          const lang = fullLang.split(':')[0] || 'bash';
          const rawCode = match ? match[2] : part.slice(3, -3);

          return (
            <div
              key={index}
              className={`my-6 rounded-xl overflow-hidden font-mono text-xs sm:text-sm shadow-2xl transition-all ${
                isExplicitCommand
                  ? 'bg-[#040608] border-2 border-[#00ff66]/40 shadow-[0_0_20px_rgba(0,255,102,0.12)]'
                  : 'bg-[#06090c] border border-[#1b2631]'
              }`}
            >
              {/* Terminal Title Bar */}
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between ${
                  isExplicitCommand
                    ? 'bg-[#09110d] border-[#00ff66]/30 text-[#00ff66]'
                    : 'bg-[#0d141b] border-[#1b2631] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                  </div>

                  <span className="text-xs font-semibold ml-2 flex items-center gap-1.5 font-mono">
                    {isExplicitCommand ? (
                      <>
                        <Command className="w-3.5 h-3.5 text-[#00ff66]" />
                        <span className="text-[#00ff66] tracking-wider font-bold">
                          TERMINAL COMMAND [{lang.toUpperCase()}]
                        </span>
                      </>
                    ) : (
                      <>
                        <Terminal className="w-3.5 h-3.5 text-[#00ff66]" />
                        <span className="text-gray-300 font-semibold">{lang.toUpperCase()}</span>
                      </>
                    )}
                  </span>
                </div>

                <button
                  onClick={() => copyToClipboard(rawCode.trim(), blockId)}
                  className="px-2.5 py-1 rounded bg-[#151f28] hover:bg-[#1c2936] text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 text-[11px] font-mono"
                  title="Copy command"
                >
                  {copiedIndex === blockId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00ff66]" />
                      <span className="text-[#00ff66] font-bold">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Body */}
              <div className="p-4 overflow-x-auto text-[#e6edf3] bg-[#05070a]">
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {rawCode.split('\n').map((line, lineIdx) => {
                    const isPrompt =
                      line.trim().startsWith('$') ||
                      line.trim().startsWith('#') ||
                      line.trim().startsWith('>') ||
                      line.trim().startsWith('*Evil-WinRM*') ||
                      line.trim().startsWith('root@') ||
                      line.trim().startsWith('smb:');
                    const isSuccess = line.includes('[+]') || line.includes('open') || line.includes('SUCCESS');
                    const isKey = line.includes('UserName:') || line.includes('Password:') || line.includes('FLAG') || line.includes('HTB{');

                    return (
                      <div key={lineIdx} className="table-row">
                        <span className="table-cell pr-4 text-right select-none text-gray-600 text-[11px] w-8 font-mono">
                          {lineIdx + 1}
                        </span>
                        <span
                          className={`table-cell font-mono ${
                            isPrompt
                              ? 'text-[#00ff66] font-bold'
                              : isSuccess
                              ? 'text-emerald-400 font-semibold'
                              : isKey
                              ? 'text-amber-300 font-bold'
                              : 'text-gray-300'
                          }`}
                        >
                          {line}
                        </span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>
          );
        }

        // Regular markdown text paragraphs, headings, blockquotes, images
        const lines = part.split('\n');

        return (
          <div key={index} className="space-y-4">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Image syntax: ![alt](url)
              const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
              if (imgMatch) {
                const altText = imgMatch[1] || 'Screenshot';
                const imgUrl = imgMatch[2];

                return (
                  <div key={lIdx} className="my-6 rounded-xl border border-[#1b2631] bg-[#070b0e] p-2 sm:p-3 overflow-hidden shadow-xl">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-2 border-b border-[#1b2631] text-xs font-mono text-gray-400">
                      <ImageIcon className="w-3.5 h-3.5 text-[#00ff66]" />
                      <span className="text-white font-medium">{altText}</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={altText}
                      loading="lazy"
                      className="w-full h-auto rounded-lg border border-[#151f28] object-cover"
                    />
                  </div>
                );
              }

              // H2 Header
              if (trimmed.startsWith('## ')) {
                return (
                  <h2
                    key={lIdx}
                    className="font-mono text-xl sm:text-2xl font-bold text-white pt-6 pb-2 border-b border-[#1b2631] flex items-center gap-2"
                  >
                    <span className="text-[#00ff66]">#</span>
                    <span>{trimmed.replace('## ', '')}</span>
                  </h2>
                );
              }

              // H3 Header
              if (trimmed.startsWith('### ')) {
                return (
                  <h3
                    key={lIdx}
                    className="font-mono text-lg font-semibold text-[#00ff66] pt-4 flex items-center gap-1.5"
                  >
                    <span>&gt;&gt;</span>
                    <span>{trimmed.replace('### ', '')}</span>
                  </h3>
                );
              }

              // Horizontal Rule
              if (trimmed === '---') {
                return <hr key={lIdx} className="my-8 border-[#1b2631]" />;
              }

              // Blockquote / Callout
              if (trimmed.startsWith('> ')) {
                return (
                  <div
                    key={lIdx}
                    className="p-4 rounded-xl bg-[#0a1117] border-l-4 border-[#00ff66] text-gray-300 font-mono text-xs sm:text-sm my-4 shadow-sm"
                  >
                    {trimmed.replace('> ', '')}
                  </div>
                );
              }

              // Unordered List
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-4 text-gray-300">
                    <span className="text-[#00ff66] font-bold">&bull;</span>
                    <span>{trimmed.substring(2)}</span>
                  </div>
                );
              }

              // Regular paragraph with inline code formatting
              return (
                <p key={lIdx} className="leading-relaxed text-gray-300 font-sans">
                  {renderInlineCode(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Helper to render inline code like `nmap` or `keeper.htb`
function renderInlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((chunk, i) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-[#111921] border border-[#22313f] text-[#00ff66] font-mono text-xs font-semibold mx-0.5"
        >
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return chunk;
  });
}
