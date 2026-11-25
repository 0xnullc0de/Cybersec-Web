'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GitBranch, Copy, Check, Eye } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function renderMermaid() {
      if (!chart.trim()) return;
      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import Mermaid from CDN ESM to keep client bundle ultra-lean
        // @ts-ignore
        const mermaid = (await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          themeVariables: {
            darkMode: true,
            background: '#06090c',
            primaryColor: '#0f241a',
            primaryBorderColor: '#00ff66',
            primaryTextColor: '#e2e8f0',
            lineColor: '#00ff66',
            secondaryColor: '#14202c',
            tertiaryColor: '#0a0f14',
            actorBorder: '#00ff66',
            actorBkg: '#0a1612',
            actorTextColor: '#e2e8f0',
            actorLineColor: '#00ff66',
            signalColor: '#00ff66',
            signalTextColor: '#e2e8f0',
            labelBoxBkgColor: '#0d151c',
            labelBoxBorderColor: '#223242',
            labelTextColor: '#00ff66',
            loopTextColor: '#e2e8f0',
            noteBorderColor: '#f59e0b',
            noteBkgColor: '#1a180d',
            noteTextColor: '#fbbf24',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());

        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to render diagram syntax');
          setIsLoading(false);
        }
      }
    }

    renderMermaid();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden bg-[#06090c] border border-[#1b2631] shadow-2xl">
      {/* Title Bar */}
      <div className="px-4 py-2 bg-[#0d141b] border-b border-[#1b2631] flex items-center justify-between text-xs font-mono text-gray-400">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#00ff66]" />
          <span className="text-[#00ff66] font-semibold">DIAGRAM // PROTOCOL & ATTACK FLOW</span>
        </div>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors flex items-center gap-1.5"
          title="Copy diagram definition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00ff66]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Source'}</span>
        </button>
      </div>

      {/* Diagram Body */}
      <div className="p-4 sm:p-6 overflow-x-auto flex justify-center items-center min-h-[140px] bg-[#070b0e]">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-gray-500 py-6">
            <span className="w-2 h-2 rounded-full bg-[#00ff66] animate-ping" />
            <span>Compiling flow diagram...</span>
          </div>
        ) : error ? (
          <div className="w-full space-y-2">
            <div className="text-xs font-mono text-amber-400">
              Note: Diagram syntax error ({error}). Displaying raw flow source below:
            </div>
            <pre className="p-3 rounded bg-[#0a0f14] text-xs font-mono text-gray-300 overflow-x-auto">
              {chart}
            </pre>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
