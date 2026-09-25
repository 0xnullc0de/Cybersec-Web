'use client';

import React, { useState, useEffect } from 'react';
import CertCard from './CertCard';
import { Certification } from '@/types';
import { certifications as fallbackCerts } from '@/data/certifications';

interface CertificationsListProps {
  initialCerts?: Certification[];
}

export default function CertificationsList({ initialCerts = fallbackCerts }: CertificationsListProps) {
  const [certs, setCerts] = useState<Certification[]>(initialCerts);
  const [filter, setFilter] = useState<'all' | 'industry' | 'prolab'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch live certificates from Supabase API
    setLoading(true);
    fetch('/api/certificates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCerts(data);
        }
      })
      .catch((err) => console.error('Failed to fetch certificates:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredCerts = certs.filter((cert) => {
    if (filter === 'prolab') return Boolean(cert.isProLab);
    if (filter === 'industry') return !cert.isProLab;
    return true;
  });

  const proLabCount = certs.filter((c) => c.isProLab).length;
  const industryCount = certs.filter((c) => !c.isProLab).length;

  return (
    <div className="space-y-6">
      {/* Filter and Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0a0f14] border border-[#1b2631]">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#00ff66] text-black shadow-sm'
                : 'bg-[#121921] text-gray-300 hover:text-white border border-[#202e3b]'
            }`}
          >
            ALL CREDENTIALS ({certs.length})
          </button>

          <button
            onClick={() => setFilter('industry')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              filter === 'industry'
                ? 'bg-[#00ff66] text-black shadow-sm'
                : 'bg-[#121921] text-gray-300 hover:text-white border border-[#202e3b]'
            }`}
          >
            INDUSTRY CERTS ({industryCount})
          </button>

          <button
            onClick={() => setFilter('prolab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'prolab'
                ? 'bg-orange-500 text-black shadow-sm font-bold'
                : 'bg-[#121921] text-orange-400 hover:text-orange-300 border border-orange-500/30'
            }`}
          >
            <span>HTB PRO LABS</span>
            <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-[10px]">
              {proLabCount}
            </span>
          </button>
        </div>

        <div className="font-mono text-xs text-gray-400">
          <span>SHOWING:</span>{' '}
          <strong className="text-[#00ff66]">{filteredCerts.length}</strong> of{' '}
          <strong className="text-white">{certs.length}</strong>
        </div>
      </div>

      {/* Grid of Certs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCerts.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>
    </div>
  );
}
