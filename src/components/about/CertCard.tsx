'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Certification } from '@/types';
import { Award, CheckCircle2, Clock, ExternalLink, ShieldCheck, Lock, ArrowRight, Eye, X } from 'lucide-react';

interface CertCardProps {
  cert: Certification;
}

export default function CertCard({ cert }: CertCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const isEarned = cert.status === 'earned';
  const isProLab = Boolean(cert.isProLab);

  return (
    <>
      <div className={`group relative p-6 rounded-2xl bg-[#0a0f14] border transition-all duration-300 shadow-xl flex flex-col justify-between overflow-hidden ${
        isProLab
          ? 'border-orange-500/40 hover:border-orange-400 bg-gradient-to-b from-[#120d08]/40 to-[#0a0f14]'
          : 'border-[#1b2631] hover:border-[#00ff66]/50 hover:bg-[#0e161e]'
      }`}>
        {/* Top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px] transition-colors"
          style={{ backgroundColor: isProLab ? '#ff6b00' : isEarned ? cert.badgeColor : '#f59e0b' }}
        />

        <div>
          {/* Header: Badge icon + Status */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-base shadow-lg border"
              style={{
                backgroundColor: `${cert.badgeColor || '#00ff66'}15`,
                borderColor: `${cert.badgeColor || '#00ff66'}40`,
                color: cert.badgeColor || '#00ff66',
              }}
            >
              {cert.name.split(' ')[0]}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {isProLab && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                  <ShieldCheck className="w-3 h-3 text-orange-400" />
                  <span>HTB PRO LAB</span>
                </span>
              )}

              {isEarned ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>IN PROGRESS</span>
                </span>
              )}
            </div>
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

          {/* Image & Locked Writeup Link Actions */}
          <div className="space-y-2 mb-4">
            {cert.badgeImagePath && (
              <button
                type="button"
                onClick={() => setShowImageModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-[#0e161f] border border-[#202e3b] hover:border-gray-400 text-gray-300 hover:text-white text-xs font-mono transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5 text-[#00ff66]" />
                <span>VIEW VERIFIED CERTIFICATE</span>
              </button>
            )}

            {cert.writeupSlug && (
              <Link
                href={`/writeups/${cert.writeupSlug}`}
                className="w-full py-2 px-3 rounded-lg bg-[#0f171e] border border-amber-500/40 hover:border-amber-400 hover:bg-[#15202a] text-amber-400 hover:text-amber-300 text-xs font-mono font-semibold transition-all flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>LOCKED PRO LAB WRITEUP</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
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

      {/* Certificate Image Lightbox Modal */}
      {showImageModal && cert.badgeImagePath && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#0a0f14] border border-[#1b2631] rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2631]">
              <div className="font-mono text-sm text-white font-bold flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00ff66]" />
                <span>{cert.fullName} ({cert.name})</span>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1.5 rounded-lg bg-[#141d26] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-xl bg-black border border-[#1b2631] flex items-center justify-center min-h-[50vh] max-h-[75vh] w-full">
              {cert.badgeImagePath.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={cert.badgeImagePath}
                  title={cert.fullName}
                  className="w-full h-[75vh] border-0 rounded-xl"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={cert.badgeImagePath}
                  alt={cert.fullName}
                  className="w-full h-auto object-contain max-h-[75vh]"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-1">
              <span>Verified Credential: <strong className="text-[#00ff66]">{cert.credentialId || cert.name}</strong></span>
              <div className="flex items-center gap-3">
                <a
                  href={cert.badgeImagePath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00ff66] hover:underline flex items-center gap-1"
                >
                  <span>{cert.badgeImagePath.toLowerCase().endsWith('.pdf') ? 'OPEN ORIGINAL PDF' : 'OPEN FULL SIZE'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
