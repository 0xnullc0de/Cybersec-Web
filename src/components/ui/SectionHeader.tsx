import React from 'react';

interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

export default function SectionHeader({
  badge,
  title,
  description,
  align = 'left',
}: SectionHeaderProps) {
  return (
    <div className={`mb-10 sm:mb-12 ${align === 'center' ? 'text-center mx-auto max-w-2xl' : 'max-w-3xl'}`}>
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff66]/10 border border-[#00ff66]/25 text-[#00ff66] font-mono text-xs font-semibold tracking-wider uppercase mb-3 ${align === 'center' ? 'mx-auto' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
          <span>{badge}</span>
        </div>
      )}
      <h2 className="font-mono text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-gray-400 text-sm sm:text-base font-sans leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
