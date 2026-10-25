'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, Command, ExternalLink, Image as ImageIcon, CheckCheck } from 'lucide-react';
import { slugifyHeading } from './TableOfContents';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    // Clean prompt symbols like leading '$ ', '# ', or '> ' for seamless terminal pasting
    const lines = text.split('\n');
    const cleaned = lines
      .map((l) => {
        const trimmed = l.trim();
        if (trimmed.startsWith('$ ')) return trimmed.slice(2);
        if (trimmed.startsWith('# ')) return trimmed.slice(2);
        if (trimmed.startsWith('> ')) return trimmed.slice(2);
        return l;
      })
      .join('\n')
      .trim();

    navigator.clipboard.writeText(cleaned || text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Ensure any dangling/unclosed code fences are automatically closed
  let sanitizedContent = content || '';
  const backtickCount = (sanitizedContent.match(/```/g) || []).length;
  if (backtickCount % 2 !== 0) {
    sanitizedContent += '\n```';
  }

  // Split by fenced code blocks to preserve them accurately
  const parts = sanitizedContent.split(/(```[\s\S]*?```)/g);
  let codeBlockCounter = 0;

  return (
    <div className="space-y-6 font-sans text-gray-300 leading-relaxed text-sm sm:text-base">
      {parts.map((part, index) => {
        if (!part) return null;

        // Fenced code / command block
        if (part.startsWith('```')) {
          codeBlockCounter++;
          const blockId = codeBlockCounter;
          const isCopied = copiedIndex === blockId;
          // Match language with optional :command tag (e.g. ```bash:command, ```javascript, etc.)
          const match = part.match(/^```([a-zA-Z0-9_:-]*)[ \t]*\r?\n([\s\S]*?)```$/);
          let fullLang = 'bash';
          let rawCode = '';

          if (match) {
            fullLang = match[1] || 'bash';
            rawCode = match[2];
          } else {
            // Fallback for non-standard line endings or formatting
            const inner = part.slice(3, -3);
            const firstNewline = inner.search(/\r?\n/);
            if (firstNewline !== -1) {
              const firstLine = inner.slice(0, firstNewline).trim();
              if (/^[a-zA-Z0-9_:-]+$/.test(firstLine)) {
                fullLang = firstLine;
                rawCode = inner.slice(firstNewline + 1).replace(/^\r?\n/, '');
              } else {
                rawCode = inner;
              }
            } else {
              rawCode = inner;
            }
          }

          const isExplicitCommand = fullLang.includes(':command') || fullLang.includes(':terminal');
          const lang = fullLang.split(':')[0] || 'bash';

          return (
            <div
              key={index}
              className={`my-6 rounded-xl overflow-hidden font-mono text-xs sm:text-sm shadow-2xl transition-all duration-300 ${
                isCopied
                  ? 'border-2 border-[#00ff66] shadow-[0_0_25px_rgba(0,255,102,0.3)] ring-1 ring-[#00ff66]/50 bg-[#04080a]'
                  : isExplicitCommand
                  ? 'bg-[#040608] border-2 border-[#00ff66]/40 shadow-[0_0_20px_rgba(0,255,102,0.12)]'
                  : 'bg-[#06090c] border border-[#1b2631]'
              }`}
            >
              {/* Terminal Title Bar */}
              <div
                className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors ${
                  isCopied
                    ? 'bg-[#08170e] border-[#00ff66]/60 text-[#00ff66]'
                    : isExplicitCommand
                    ? 'bg-[#09110d] border-[#00ff66]/30 text-[#00ff66]'
                    : 'bg-[#0d141b] border-[#1b2631] text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isCopied ? 'bg-[#00ff66] animate-pulse' : 'bg-red-500/70'}`} />
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

                {/* Enhanced One-Click Copy Button with Terminal Feedback */}
                <button
                  onClick={() => copyToClipboard(rawCode.trim(), blockId)}
                  className={`px-3 py-1 rounded transition-all duration-200 flex items-center gap-1.5 text-[11px] font-mono font-bold ${
                    isCopied
                      ? 'bg-[#00ff66] text-black shadow-[0_0_12px_rgba(0,255,102,0.8)]'
                      : 'bg-[#151f28] hover:bg-[#1c2936] text-gray-300 hover:text-white border border-[#22313f] hover:border-[#00ff66]/40'
                  }`}
                  title="Copy command to clipboard (strips leading prompts automatically)"
                >
                  {isCopied ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-black animate-pulse" />
                      <span>$ COPIED!</span>
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
                      <div
                        key={lineIdx}
                        className={`font-mono leading-relaxed ${
                          isPrompt
                            ? 'text-[#00ff66] font-bold'
                            : isSuccess
                            ? 'text-emerald-400 font-semibold'
                            : isKey
                            ? 'text-amber-300 font-bold'
                            : 'text-gray-300'
                        }`}
                      >
                        {line || ' '}
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

              // H2 Header with Anchor ID for Table of Contents
              if (trimmed.startsWith('## ')) {
                const headingText = trimmed.replace('## ', '').trim();
                const headingId = slugifyHeading(headingText);

                return (
                  <h2
                    key={lIdx}
                    id={headingId}
                    className="font-mono text-xl sm:text-2xl font-bold text-white pt-6 pb-2 border-b border-[#1b2631] flex items-center gap-2 scroll-mt-28 group"
                  >
                    <span className="text-[#00ff66]">#</span>
                    <span>{headingText}</span>
                    <a
                      href={`#${headingId}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-[#00ff66] text-sm ml-1"
                      aria-label={`Link to ${headingText}`}
                    >
                      #
                    </a>
                  </h2>
                );
              }

              // H3 Header with Anchor ID for Table of Contents
              if (trimmed.startsWith('### ')) {
                const headingText = trimmed.replace('### ', '').trim();
                const headingId = slugifyHeading(headingText);

                return (
                  <h3
                    key={lIdx}
                    id={headingId}
                    className="font-mono text-lg font-semibold text-[#00ff66] pt-4 flex items-center gap-1.5 scroll-mt-28 group"
                  >
                    <span>&gt;&gt;</span>
                    <span>{headingText}</span>
                    <a
                      href={`#${headingId}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-[#00ff66] text-xs ml-1"
                      aria-label={`Link to ${headingText}`}
                    >
                      #
                    </a>
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
