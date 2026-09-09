'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Crosshair, Terminal, Lock } from 'lucide-react';

export default function CyberFingerprint() {
  const [scanPercent, setScanPercent] = useState(94);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanPercent((prev) => (prev >= 99 ? 93 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-full max-w-[420px] lg:max-w-[480px] aspect-square flex items-center justify-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background glow radial halo */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#00ff66]/10 via-[#005522]/5 to-transparent blur-3xl transition-opacity duration-700 ${isHovered ? 'opacity-90 scale-105' : 'opacity-60'}`} />

      {/* Outer spinning radar reticle ring */}
      <div className="absolute inset-4 rounded-full border border-[#00ff66]/15 border-dashed animate-[spin_40s_linear_infinite]" />
      <div className="absolute inset-10 rounded-full border border-white/5" />
      <div className="absolute inset-16 rounded-full border border-[#00ff66]/10 animate-[spin_25s_linear_infinite_reverse]" />

      {/* Target Crosshairs / HUD Markers */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[9px] font-mono text-[#00ff66]/70 tracking-widest uppercase">
        <Crosshair className="w-3 h-3 text-[#00ff66]" />
        <span>SYS://BIOMETRIC_TARGET_VERIFIED</span>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-mono text-gray-300">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse" />
          MATCH: <strong className="text-white">{scanPercent}%</strong>
        </span>
        <span className="text-gray-600">|</span>
        <span className="text-gray-400">LATENCY: 14ms</span>
        <span className="text-gray-600">|</span>
        <span className="text-[#00ff66]">OPSEC: SECURE</span>
      </div>

      {/* The Central Cyber Biometric Fingerprint Graphic */}
      <div className="relative w-[78%] h-[78%] flex items-center justify-center">
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(0,255,102,0.25)] transition-transform duration-500 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Biometric Ridges (Fingerprint simulation) */}
          <g stroke="currentColor" strokeLinecap="round">
            {/* Core loop */}
            <path
              d="M100 110 C 95 105, 95 95, 100 90 C 105 85, 110 95, 105 110 C 102 120, 98 125, 100 135"
              stroke="#00ff66"
              strokeWidth="2.5"
              className="opacity-95"
            />

            {/* Loop 1 */}
            <path
              d="M90 120 C 85 100, 85 85, 100 78 C 115 85, 115 105, 112 125 C 110 138, 106 148, 104 158"
              stroke="#c5d1db"
              strokeWidth="2.2"
              className="opacity-75"
            />

            {/* Loop 2 */}
            <path
              d="M80 130 C 75 100, 75 75, 100 66 C 125 75, 125 100, 120 130 C 118 145, 114 160, 110 175"
              stroke="#e2ecf4"
              strokeWidth="2.2"
              className="opacity-85"
            />

            {/* Loop 3 */}
            <path
              d="M70 140 C 65 95, 68 62, 100 54 C 132 62, 135 95, 128 140 C 125 155, 120 172, 115 190"
              stroke="#00ff66"
              strokeWidth="2"
              className="opacity-70"
            />

            {/* Loop 4 */}
            <path
              d="M60 150 C 55 90, 58 50, 100 42 C 142 50, 145 90, 136 150 C 132 170, 126 188, 120 205"
              stroke="#94a3b8"
              strokeWidth="2"
              className="opacity-60"
            />

            {/* Loop 5 */}
            <path
              d="M50 160 C 45 85, 48 38, 100 30 C 152 38, 155 85, 144 160 C 139 180, 132 200, 125 218"
              stroke="#c5d1db"
              strokeWidth="1.8"
              className="opacity-50"
            />

            {/* Loop 6 */}
            <path
              d="M40 170 C 35 80, 38 26, 100 18 C 162 26, 165 80, 152 170 C 146 195, 138 215, 130 230"
              stroke="#00ff66"
              strokeWidth="1.8"
              className="opacity-40"
            />

            {/* Outer Arch 7 */}
            <path
              d="M32 180 C 26 75, 30 14, 100 8 C 170 14, 174 75, 160 180"
              stroke="#64748b"
              strokeWidth="1.6"
              className="opacity-30"
            />

            {/* Delta details (left & right triradius) */}
            <path d="M45 130 Q 55 135 60 145" stroke="#00ff66" strokeWidth="2" className="opacity-80" />
            <path d="M155 130 Q 145 135 140 145" stroke="#00ff66" strokeWidth="2" className="opacity-80" />
            <path d="M92 100 L 92 110" stroke="#00ff66" strokeWidth="2.5" className="opacity-90" />
            <path d="M108 100 L 108 110" stroke="#00ff66" strokeWidth="2.5" className="opacity-90" />
          </g>

          {/* Glowing Scanning Horizontal Laser Line */}
          <line
            x1="10"
            y1="120"
            x2="190"
            y2="120"
            stroke="#00ff66"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="animate-scan opacity-90 filter drop-shadow-[0_0_8px_#00ff66]"
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 -90; 0 100; 0 -90"
              dur="4s"
              repeatCount="indefinite"
            />
          </line>
        </svg>

        {/* Floating Cyber Badges around scanner */}
        <div className="absolute -top-3 -right-2 px-2.5 py-1 rounded bg-[#090d10]/90 border border-[#00ff66]/30 text-[10px] font-mono text-[#00ff66] shadow-lg flex items-center gap-1.5 backdrop-blur-md">
          <Shield className="w-3 h-3 text-[#00ff66]" />
          <span>FINGERPRINT_ID: #0x9F4A</span>
        </div>

        <div className="absolute -bottom-3 -left-2 px-2.5 py-1 rounded bg-[#090d10]/90 border border-white/10 text-[10px] font-mono text-gray-300 shadow-lg flex items-center gap-1.5 backdrop-blur-md">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>AES-256 ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
