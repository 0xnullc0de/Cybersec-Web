'use client';

import React, { useState, useEffect } from 'react';
import CertCard from './CertCard';
import AddCertificateModal from './AddCertificateModal';
import { Certification } from '@/types';
import { certifications as fallbackCerts } from '@/data/certifications';

interface CertificationsListProps {
  initialCerts?: Certification[];
}

export default function CertificationsList({ initialCerts = fallbackCerts }: CertificationsListProps) {
  const [certs, setCerts] = useState<Certification[]>(initialCerts);
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

  const handleCertificateAdded = (newCert: Certification) => {
    setCerts((prev) => [newCert, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-gray-400">
          <span>STORED CREDENTIALS:</span>{' '}
          <strong className="text-[#00ff66]">{certs.length}</strong>
        </div>

        <AddCertificateModal onCertificateAdded={handleCertificateAdded} />
      </div>

      {/* Grid of Certs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certs.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>
    </div>
  );
}
