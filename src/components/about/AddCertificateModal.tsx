'use client';

import React, { useState } from 'react';
import { Plus, X, Award, CheckCircle2, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { Certification } from '@/types';

interface AddCertificateModalProps {
  onCertificateAdded: (cert: Certification) => void;
}

const PRESET_COLORS = [
  { name: 'Cyber Green', hex: '#00ff66' },
  { name: 'Red Team Red', hex: '#ff4757' },
  { name: 'OffSec Orange', hex: '#ff7f50' },
  { name: 'Cobalt Blue', hex: '#3742fa' },
  { name: 'Purple Cyber', hex: '#a55eea' },
  { name: 'Emerald', hex: '#2ed573' },
];

export default function AddCertificateModal({ onCertificateAdded }: AddCertificateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [date, setDate] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState<'earned' | 'in-progress'>('earned');
  const [credentialId, setCredentialId] = useState('');
  const [badgeColor, setBadgeColor] = useState('#00ff66');
  const [description, setDescription] = useState('');
  const [skillsString, setSkillsString] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');

  const resetForm = () => {
    setName('');
    setFullName('');
    setIssuer('');
    setDate(new Date().getFullYear().toString());
    setStatus('earned');
    setCredentialId('');
    setBadgeColor('#00ff66');
    setDescription('');
    setSkillsString('');
    setVerificationUrl('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !fullName || !issuer || !date) {
      setError('Please fill in all required fields (Name, Full Name, Issuer, Date).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const skills = skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          fullName,
          issuer,
          date,
          status,
          credentialId: credentialId || undefined,
          badgeColor,
          description,
          skillsCovered: skills,
          verificationUrl: verificationUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add certificate');
      }

      onCertificateAdded(data);
      resetForm();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error creating certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0e1620] hover:bg-[#14202c] border border-[#00ff66]/40 hover:border-[#00ff66] text-[#00ff66] font-mono text-xs font-bold transition-all shadow-sm group"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
        <span>ADD CERTIFICATE</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0f14] border border-[#1b2631] shadow-2xl text-left">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[#1b2631] bg-[#0a0f14]/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-bold text-white uppercase tracking-tight">
                    Add Credential &bull; Supabase Store
                  </h3>
                  <p className="text-xs text-gray-400 font-sans">
                    Instantly save verified certification to database
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                  &gt; ERROR: {error}
                </div>
              )}

              {/* Row 1: Short Name & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Cert Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CRTP, OSEP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-mono text-xs text-white outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Full Certification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Certified Red Team Professional"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-sans text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Issuer & Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Issuer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Altered Security"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-sans text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Date Earned / Target *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Oct 2024"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-mono text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-mono text-xs text-white outline-none"
                  >
                    <option value="earned">Earned (Completed)</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Credential ID & Verification URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Credential / Badge ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CERT-90218"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-mono text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                    Verification URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://badgr.com/..."
                    value={verificationUrl}
                    onChange={(e) => setVerificationUrl(e.target.value)}
                    className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-sans text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block font-mono text-[11px] text-gray-400 mb-1.5 uppercase">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setBadgeColor(col.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        badgeColor === col.hex
                          ? 'scale-110 border-white shadow-lg'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    />
                  ))}
                  <input
                    type="text"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-24 ml-2 bg-[#06090c] border border-[#1b2631] rounded-lg px-2 py-1 font-mono text-xs text-white outline-none text-center"
                  />
                </div>
              </div>

              {/* Skills covered */}
              <div>
                <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                  Skills Tested (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Active Directory, Kerberos, DCSync, Mimikatz, BloodHound"
                  value={skillsString}
                  onChange={(e) => setSkillsString(e.target.value)}
                  className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-sans text-xs text-white outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[11px] text-gray-400 mb-1 uppercase">
                  Description / Exam Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief synopsis of exam hands-on difficulty and methodologies covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#06090c] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 font-sans text-xs text-white outline-none resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#1b2631] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg font-mono text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#00ff66] hover:bg-[#00e65c] text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 shadow-glow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Credential</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
