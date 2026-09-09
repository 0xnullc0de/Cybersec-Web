import React from 'react';
import { Certification } from '@/types';
import { Award, CheckCircle2, Clock, ExternalLink, ShieldCheck } from 'lucide-react';

interface CertCardProps {
  cert: Certification;
}

export default function CertCard({ cert }: CertCardProps) {
  const isEarned = cert.status === 'earned';

  return (
    <div className="group relative p-6 rounded-2xl bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/50 hover:bg-[#0e161e] transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden">
      {/* Top green accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-colors"
        style={{ backgroundColor: isEarned ? cert.badgeColor : '#f59e0b' }}
      />

      <div>
        {/* Header: Badge icon + Status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-base shadow-lg border"
            style={{
              backgroundColor: `${cert.badgeColor}15`,
              borderColor: `${cert.badgeColor}40`,
              color: cert.badgeColor,
            }}
          >
            {cert.name.split(' ')[0]}
          </div>

          {isEarned ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>VERIFIED EARNED</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>IN PROGRESS</span>
            </span>
          )}
        </div>

        {/* Cert Name & Issuer */}
        <div className="space-y-1 mb-3">
          <h3 className="font-mono text-xl font-bold text-white group-hover:text-[#00ff66] transition-colors">
            {cert.name}
          </h3>
          <p className="font-sans text-xs text-gray-400 font-semibold">
            {cert.fullName} &bull; <span className="text-gray-300">{cert.issuer}</span>
          </p>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-xs sm:text-sm font-sans leading-relaxed mb-4">
          {cert.description}
        </p>

        {/* Skills Tag Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {cert.skillsCovered.map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141d26] text-gray-300 border border-[#22313f]"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info: Date & Credential ID */}
      <div className="pt-3 border-t border-[#17222c] flex items-center justify-between text-xs font-mono text-gray-500">
        <span>Issued: <strong className="text-gray-300">{cert.date}</strong></span>
        {cert.credentialId && (
          <span className="text-gray-400">ID: {cert.credentialId}</span>
        )}
      </div>
    </div>
  );
}
