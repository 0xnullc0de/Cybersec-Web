'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Lock, Unlock, Plus, RefreshCw, Check, Copy, 
  Trash2, ExternalLink, Terminal, AlertTriangle, FileText, 
  Award, Eye, CheckCircle2, Server, Download, Globe, Sparkles, Folder, Edit3
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'passwords' | 'writeups' | 'new-writeup' | 'certs' | 'notion'>('passwords');
  
  // Data state
  const [writeups, setWriteups] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [notionStatus, setNotionStatus] = useState<any>(null);
  const [notionPages, setNotionPages] = useState<any[]>([]);
  const [notionCategoryFilter, setNotionCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Writeup Modal state
  const [editingWriteup, setEditingWriteup] = useState<any | null>(null);

  // Import Modal state
  const [selectedNotionPage, setSelectedNotionPage] = useState<any | null>(null);
  const [importConfig, setImportConfig] = useState({
    title: '',
    isProLab: false,
    platform: 'HTB',
    difficulty: 'Medium',
    os: 'Linux',
    tags: '',
    summary: '',
    initialAccessVector: '',
    privEscVector: '',
    unlockPassword: '',
  });

  // Certificate form state
  const [newCert, setNewCert] = useState({
    name: '',
    fullName: '',
    issuer: 'OffSec',
    date: '2024',
    status: 'earned',
    credentialId: '',
    badgeColor: '#00ff66',
    description: '',
    skillsCovered: '',
  });

  // New writeup form state
  const [newWriteup, setNewWriteup] = useState({
    title: '',
    slug: '',
    platform: 'HTB',
    difficulty: 'Medium',
    os: 'Linux',
    tags: 'Active Directory, PrivEsc, Web',
    summary: '',
    initialAccessVector: '',
    privEscVector: '',
    previewContent: '## 1. Initial Reconnaissance\n\nTarget IP: 10.10.11.x\n\n```bash:command\n$ nmap -sC -sV -p- -oN nmap/initial.txt 10.10.11.x\n```',
    fullContent: '## 2. Exploitation & Foothold\n\nExploitation steps here...\n\n## 3. Privilege Escalation\n\nRoot flag obtained:\n\n```bash:command\n# cat /root/root.txt\n```',
    isRetired: false,
    isProLab: false,
    unlockPassword: '',
    points: 30,
    ipAddress: '',
    featured: false,
  });

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_key');
    if (saved) {
      setAdminKey(saved);
      checkAuth(saved);
    }
  }, []);

  const checkAuth = async (key: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: key }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_key', key);
        fetchData(key);
      } else {
        setMessage({ type: 'error', text: 'Access Denied: Invalid Administrative Passphrase' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (key: string) => {
    setLoading(true);
    try {
      // Fetch writeups
      const wRes = await fetch('/api/admin/writeups', {
        headers: { 'x-admin-key': key },
      });
      if (wRes.ok) {
        const wData = await wRes.json();
        setWriteups(wData || []);
      }

      // Fetch certs
      const cRes = await fetch('/api/certificates');
      if (cRes.ok) {
        const cData = await cRes.json();
        setCerts(cData || []);
      }

      // Fetch Notion status & discoverable pages
      const nRes = await fetch('/api/sync/notion/status');
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotionStatus(nData);
      }

      const pRes = await fetch('/api/admin/notion/pages', {
        headers: { 'x-admin-key': key },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setNotionPages(pData.pages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = (slug: string, pw: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleGeneratePassword = (title: string, isProLab: boolean) => {
    const machine = (title || 'Target').replace(/[^a-zA-Z0-9]/g, '');
    const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    if (isProLab) {
      return `HTB{${machine}_ProLab_Enterprise_${randHex}!}`;
    }
    return `HTB{${machine}_pwn3d_${randHex}_root!}`;
  };

  const handleCreateWriteup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/writeups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          ...newWriteup,
          platform: newWriteup.isProLab ? 'HTB Pro Lab' : newWriteup.platform,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Writeup "${newWriteup.title}" published successfully to Supabase!` });
        fetchData(adminKey);
        setActiveTab('passwords');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create writeup' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImportNotionPage = async () => {
    if (!selectedNotionPage) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/notion/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          pageId: selectedNotionPage.id,
          overrides: {
            title: importConfig.title,
            isProLab: importConfig.isProLab,
            platform: importConfig.isProLab ? 'HTB Pro Lab' : importConfig.platform,
            difficulty: importConfig.difficulty,
            os: importConfig.os,
            tags: importConfig.tags,
            summary: importConfig.summary,
            initialAccessVector: importConfig.initialAccessVector,
            privEscVector: importConfig.privEscVector,
            unlockPassword: importConfig.unlockPassword,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ 
          type: 'success', 
          text: `Successfully imported "${importConfig.title}" from Notion! (${data.imagesRehosted} screenshots re-hosted to Supabase Storage, PDF created).` 
        });
        setSelectedNotionPage(null);
        fetchData(adminKey);
        setActiveTab('passwords');
      } else {
        setMessage({ type: 'error', text: data.error || 'Import failed' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWriteup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWriteup) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/writeups/${editingWriteup.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          title: editingWriteup.title,
          platform: editingWriteup.platform,
          difficulty: editingWriteup.difficulty,
          os: editingWriteup.os,
          summary: editingWriteup.summary,
          initialAccessVector: editingWriteup.initial_access_vector,
          privEscVector: editingWriteup.priv_esc_vector,
          tags: editingWriteup.tags,
          unlockPassword: editingWriteup.unlock_password,
          isProLab: editingWriteup.is_pro_lab,
          isRetired: editingWriteup.is_retired,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully updated writeup "${editingWriteup.title}"!` });
        setEditingWriteup(null);
        fetchData(adminKey);
      } else {
        setMessage({ type: 'error', text: data.error || 'Update failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCert = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCert),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Certificate "${newCert.name}" saved to Supabase!` });
        setNewCert({
          name: '',
          fullName: '',
          issuer: 'OffSec',
          date: '2024',
          status: 'earned',
          credentialId: '',
          badgeColor: '#00ff66',
          description: '',
          skillsCovered: '',
        });
        fetchData(adminKey);
      } else {
        const d = await res.json();
        setMessage({ type: 'error', text: d.error || 'Failed to save certificate' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCert = async (id: string, name: string) => {
    if (!confirm(`Delete certificate "${name}" from Supabase?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: `Deleted certificate "${name}"` });
        fetchData(adminKey);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRetirement = async (id: string, currentStatus: boolean, title: string) => {
    if (!confirm(`Mark "${title}" as ${currentStatus ? 'ACTIVE (Locked)' : 'RETIRED (Public for all)'}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/writeups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ isRetired: !currentStatus }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Updated "${title}" status to ${!currentStatus ? 'RETIRED' : 'ACTIVE'}` });
        fetchData(adminKey);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWriteup = async (id: string, title: string) => {
    if (!confirm(`DANGER: Permanently delete writeup "${title}" from Supabase?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/writeups/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Deleted "${title}"` });
        fetchData(adminKey);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // 1. AUTH SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050708] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0f14] border border-[#00ff66]/30 rounded-xl p-8 shadow-2xl shadow-[#00ff66]/10">
          <div className="flex items-center gap-3 mb-6 border-b border-[#1b2631] pb-4">
            <div className="p-2.5 bg-[#00ff66]/10 border border-[#00ff66]/40 rounded-lg">
              <Shield className="w-6 h-6 text-[#00ff66]" />
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold text-[#00ff66]">ROOT ACCESS CONTROL</h1>
              <p className="text-xs text-gray-400 font-mono">Nulbyt3 Vault Management Console</p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg mb-5 text-xs font-mono border ${
              message.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-green-500/10 border-green-500/40 text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); checkAuth(adminKey); }}>
            <div className="mb-5">
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-wider">
                Administrative Passphrase
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key (default: nulbyt3-root)"
                  className="w-full bg-[#050708] border border-[#1b2631] rounded-lg pl-10 pr-3 py-2.5 text-sm font-mono focus:border-[#00ff66] focus:outline-none text-[#00ff66] placeholder:text-gray-600"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00ff66] text-[#050708] font-mono font-bold text-sm rounded-lg hover:bg-[#00ff66]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00ff66]/20"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              AUTHENTICATE ROOT
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" className="text-xs font-mono text-gray-500 hover:text-[#00ff66] transition-colors">
              &larr; Return to Public Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filter groups
  const proLabWriteups = writeups.filter(w => w.is_pro_lab);
  const activeBoxWriteups = writeups.filter(w => !w.is_pro_lab && !w.is_retired);
  const retiredWriteups = writeups.filter(w => !w.is_pro_lab && w.is_retired);

  return (
    <div className="min-h-screen bg-[#050708] text-white pt-8 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Dedicated Admin Header Bar (Completely separate from public Navbar) */}
        <div className="bg-[#0a0f14] border border-[#1b2631] rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/30 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-[#00ff66]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-mono font-bold text-white tracking-wider">
                    NULBYT3 VAULT CONSOLE
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/30">
                    ROOT
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mt-1 flex flex-wrap items-center gap-3">
                  <span>DB: <strong className="text-gray-300">Supabase EU-WEST</strong></span>
                  <span className="text-gray-600">•</span>
                  <span>Host: <strong className="text-gray-300">Vercel Edge</strong></span>
                  <span className="text-gray-600">•</span>
                  <span>Notion: <strong className="text-purple-400">{notionStatus?.workspace || 'HTB MACHINES'}</strong></span>
                </p>
              </div>
            </div>

            {/* Action buttons (Cleanly spaced, no overlap) */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchData(adminKey)}
                disabled={loading}
                className="px-3.5 py-2 bg-[#0e141a] border border-[#1b2631] hover:border-[#00ff66]/50 text-xs font-mono rounded-lg flex items-center gap-2 text-gray-300 hover:text-white transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00ff66]' : ''}`} />
                Refresh
              </button>
              <Link
                href="/writeups"
                target="_blank"
                className="px-3.5 py-2 bg-[#00ff66]/10 border border-[#00ff66]/30 text-[#00ff66] hover:bg-[#00ff66]/20 text-xs font-mono rounded-lg flex items-center gap-2 transition-all font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Live Site
              </Link>
              <button
                onClick={() => { sessionStorage.removeItem('admin_key'); setIsAuthenticated(false); }}
                className="px-3.5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-mono rounded-lg transition-all"
              >
                Lock Console
              </button>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {message && (
          <div className={`p-4 rounded-xl mb-8 text-sm font-mono border flex items-center justify-between shadow-lg ${
            message.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66]'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs hover:underline ml-4 font-bold">
              DISMISS
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1b2631] mb-8 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('passwords')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'passwords'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-[#00ff66]" />
            PASSWORD VAULT ({proLabWriteups.length + activeBoxWriteups.length})
          </button>

          <button
            onClick={() => setActiveTab('writeups')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'writeups'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            ALL WRITEUPS ({writeups.length})
          </button>

          <button
            onClick={() => setActiveTab('new-writeup')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'new-writeup'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            + POST WRITEUP
          </button>

          <button
            onClick={() => setActiveTab('certs')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'certs'
                ? 'border-neon-green text-[#00ff66] bg-[#00ff66]/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-orange-400" />
            CERTIFICATIONS ({certs.length})
          </button>

          <button
            onClick={() => setActiveTab('notion')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'notion'
                ? 'border-[#00ff66] text-[#00ff66] bg-[#00ff66]/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-purple-400" />
            NOTION IMPORT HUB ({notionPages.length})
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: PASSWORD VAULT (Pro Labs + Active Machines)                       */}
        {/* ========================================================================= */}
        {activeTab === 'passwords' && (
          <div className="space-y-10">
            {/* Section A: HTB Pro Labs */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-purple-500/10 border border-purple-500/30">
                    <Server className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-mono font-bold text-white">HTB PRO LABS (LOCKED BY DEFAULT)</h2>
                    <p className="text-xs font-mono text-gray-400">
                      All Pro Lab writeups are locked by default with dedicated passphrases. They never auto-unlock.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-purple-400 font-bold px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/30">
                  {proLabWriteups.length} LABS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proLabWriteups.map((w) => (
                  <div key={w.slug} className="bg-[#0a0f14] border border-purple-500/30 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/15 text-purple-400 border border-purple-500/40 uppercase">
                          ENTERPRISE PRO LAB
                        </span>
                        <span className="text-xs font-mono text-gray-400">{w.difficulty} • {w.points || 100} pts</span>
                      </div>

                      <h3 className="text-base font-mono font-bold text-white mb-1">{w.title}</h3>
                      <p className="text-xs text-gray-400 font-mono mb-4">{w.summary}</p>

                      <div className="bg-[#050708] border border-[#1b2631] rounded-lg p-3 mb-4">
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          Pro Lab Unlock Passphrase:
                        </div>
                        <div className="font-mono text-xs text-purple-400 break-all select-all font-semibold">
                          {w.unlock_password || '(Password set in database)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#1b2631]">
                      <button
                        onClick={() => handleCopyPassword(w.slug, w.unlock_password || '')}
                        disabled={!w.unlock_password}
                        className="flex-1 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all font-semibold"
                      >
                        {copiedSlug === w.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSlug === w.slug ? 'COPIED TO CLIPBOARD!' : 'COPY PASSPHRASE'}
                      </button>

                      <Link
                        href={`/writeups/${w.slug}`}
                        target="_blank"
                        className="px-3 py-2 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] text-gray-300 hover:text-white font-mono text-xs rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}

                {proLabWriteups.length === 0 && (
                  <div className="col-span-2 text-center py-10 bg-[#0a0f14] border border-[#1b2631] rounded-xl">
                    <Server className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-mono text-gray-400">No HTB Pro Labs added yet.</p>
                    <button
                      onClick={() => setActiveTab('new-writeup')}
                      className="mt-3 px-4 py-1.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 font-mono text-xs rounded hover:bg-purple-500/25 transition-all"
                    >
                      + Add Pro Lab Writeup
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Active CTF Machines */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-red-500/10 border border-red-500/30">
                    <Lock className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-mono font-bold text-white">ACTIVE CTF MACHINES (EARLY ACCESS PASSPHRASE)</h2>
                    <p className="text-xs font-mono text-gray-400">
                      Active machines auto-unlock once retired, or early via these passphrases.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-red-400 font-bold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30">
                  {activeBoxWriteups.length} ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBoxWriteups.map((w) => (
                  <div key={w.slug} className="bg-[#0a0f14] border border-red-500/30 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-500/15 text-red-400 border border-red-500/40 uppercase">
                          ACTIVE / SEASONAL BOX
                        </span>
                        <span className="text-xs font-mono text-gray-400">{w.platform} • {w.difficulty}</span>
                      </div>

                      <h3 className="text-base font-mono font-bold text-white mb-1">{w.title}</h3>
                      <p className="text-xs text-gray-400 font-mono mb-4">{w.summary}</p>

                      <div className="bg-[#050708] border border-[#1b2631] rounded-lg p-3 mb-4">
                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                          Early Access Flag Passphrase:
                        </div>
                        <div className="font-mono text-xs text-[#00ff66] break-all select-all font-semibold">
                          {w.unlock_password || '(Encrypted in DB)'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#1b2631]">
                      <button
                        onClick={() => handleCopyPassword(w.slug, w.unlock_password || '')}
                        disabled={!w.unlock_password}
                        className="flex-1 py-2 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/40 text-[#00ff66] font-mono text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all font-semibold"
                      >
                        {copiedSlug === w.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSlug === w.slug ? 'COPIED TO CLIPBOARD!' : 'COPY PASSPHRASE'}
                      </button>

                      <button
                        onClick={() => handleToggleRetirement(w.id, w.is_retired, w.title)}
                        className="px-3 py-2 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] text-gray-300 hover:text-white font-mono text-xs rounded-lg transition-all"
                        title="Mark as Retired (Public for all)"
                      >
                        Retire
                      </button>

                      <Link
                        href={`/writeups/${w.slug}`}
                        target="_blank"
                        className="px-3 py-2 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] text-gray-300 hover:text-white font-mono text-xs rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL WRITEUPS (Edit, Retire, Delete)                                */}
        {/* ========================================================================= */}
        {activeTab === 'writeups' && (
          <div className="space-y-4">
            {writeups.map((w) => (
              <div key={w.slug} className="bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/30 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    {w.is_pro_lab ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        HTB PRO LAB
                      </span>
                    ) : w.is_retired ? (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30">
                        RETIRED (PUBLIC)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-red-500/10 text-red-400 border border-red-500/30">
                        ACTIVE (LOCKED)
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-400">{w.platform} • {w.difficulty} • {w.os}</span>
                  </div>
                  <h3 className="text-base font-mono font-bold text-white">{w.title}</h3>
                  <p className="text-xs text-gray-400 font-mono line-clamp-1">{w.summary}</p>

                  {/* Vectors & Tags */}
                  <div className="pt-2 border-t border-[#1b2631]/60 space-y-1 text-xs font-mono">
                    <div className="flex items-start gap-2">
                      <span className="text-[#00ff66] font-bold text-[11px] shrink-0">FOOTHOLD:</span>
                      <span className="text-gray-300 text-[11px] line-clamp-1">{w.initial_access_vector || 'Not specified'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold text-[11px] shrink-0">PRIVESC:</span>
                      <span className="text-gray-300 text-[11px] line-clamp-1">{w.priv_esc_vector || 'Not specified'}</span>
                    </div>
                    {w.tags && w.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(Array.isArray(w.tags) ? w.tags : []).map((t: string) => (
                          <span key={t} className="text-[10px] text-gray-400 bg-[#050708] px-2 py-0.5 rounded border border-[#1b2631]">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingWriteup({
                      ...w,
                      tags: Array.isArray(w.tags) ? w.tags.join(', ') : (w.tags || ''),
                    })}
                    className="px-3 py-1.5 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/30 text-[#00ff66] text-xs font-mono rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  {!w.is_pro_lab && (
                    <button
                      onClick={() => handleToggleRetirement(w.id, w.is_retired, w.title)}
                      className="px-3 py-1.5 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] text-xs font-mono rounded-lg text-gray-300 hover:text-white"
                    >
                      {w.is_retired ? 'Make Active' : 'Retire'}
                    </button>
                  )}
                  <Link
                    href={`/writeups/${w.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] text-xs font-mono rounded-lg text-gray-300 hover:text-white flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button
                    onClick={() => handleDeleteWriteup(w.id, w.title)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: NEW WRITEUP CREATOR                                                */}
        {/* ========================================================================= */}
        {activeTab === 'new-writeup' && (
          <div className="bg-[#0a0f14] border border-[#1b2631] rounded-xl p-8 max-w-4xl">
            <h2 className="text-lg font-mono font-bold text-[#00ff66] mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5" /> POST NEW WRITEUP TO SUPABASE
            </h2>
            <p className="text-xs text-gray-400 font-mono mb-6">
              Create and publish a machine or Pro Lab writeup. It will instantly appear on your site and database.
            </p>

            <form onSubmit={handleCreateWriteup} className="space-y-5">
              {/* Pro Lab Toggle */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-mono text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-400" />
                    THIS IS AN HTB PRO LAB WRITEUP
                  </div>
                  <p className="text-xs font-mono text-gray-400">
                    Pro Lab writeups are locked by default with dedicated passphrases.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={newWriteup.isProLab}
                  onChange={(e) => {
                    const isLab = e.target.checked;
                    setNewWriteup(prev => ({
                      ...prev,
                      isProLab: isLab,
                      platform: isLab ? 'HTB Pro Lab' : 'HTB',
                      unlockPassword: isLab && !prev.unlockPassword ? handleGeneratePassword(prev.title, true) : prev.unlockPassword,
                    }));
                  }}
                  className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Title / Machine Name *</label>
                  <input
                    type="text"
                    required
                    value={newWriteup.title}
                    onChange={(e) => setNewWriteup({ ...newWriteup, title: e.target.value })}
                    placeholder="e.g. Dante, Cicada, Zephyr, Blackfield"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={newWriteup.slug}
                    onChange={(e) => setNewWriteup({ ...newWriteup, slug: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Platform</label>
                  <select
                    value={newWriteup.platform}
                    onChange={(e) => setNewWriteup({ ...newWriteup, platform: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  >
                    <option value="HTB">Hack The Box</option>
                    <option value="HTB Pro Lab">HTB Pro Lab</option>
                    <option value="THM">TryHackMe</option>
                    <option value="Proving Grounds">Proving Grounds</option>
                    <option value="Other">Other CTF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Difficulty</label>
                  <select
                    value={newWriteup.difficulty}
                    onChange={(e) => setNewWriteup({ ...newWriteup, difficulty: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Insane">Insane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">OS / Architecture</label>
                  <select
                    value={newWriteup.os}
                    onChange={(e) => setNewWriteup({ ...newWriteup, os: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  >
                    <option value="Active Directory">Active Directory</option>
                    <option value="Linux">Linux</option>
                    <option value="Windows">Windows</option>
                    <option value="Multi">Multi-Tier Network</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newWriteup.tags}
                  onChange={(e) => setNewWriteup({ ...newWriteup, tags: e.target.value })}
                  placeholder="Active Directory, Pivoting, Kerberoasting, BloodHound"
                  className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Summary / Executive Overview</label>
                <textarea
                  rows={2}
                  value={newWriteup.summary}
                  onChange={(e) => setNewWriteup({ ...newWriteup, summary: e.target.value })}
                  placeholder="Executive summary of the attack path."
                  className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                />
              </div>

              {/* Passphrase & Status */}
              <div className="p-4 bg-[#050708] border border-[#1b2631] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#00ff66] uppercase flex items-center gap-1.5 font-bold">
                    <Key className="w-3.5 h-3.5" /> Unlock Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const generated = handleGeneratePassword(newWriteup.title, newWriteup.isProLab);
                      setNewWriteup(prev => ({ ...prev, unlockPassword: generated }));
                    }}
                    className="text-xs font-mono text-[#00ff66] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate Flag Format
                  </button>
                </div>
                <input
                  type="text"
                  value={newWriteup.unlockPassword}
                  onChange={(e) => setNewWriteup({ ...newWriteup, unlockPassword: e.target.value })}
                  placeholder="e.g. HTB{Dante_ProLab_Enterprise_Pwned!}"
                  className="w-full bg-[#0a0f14] border border-[#00ff66]/40 rounded-lg px-3.5 py-2.5 text-sm font-mono text-[#00ff66] focus:border-[#00ff66] focus:outline-none"
                />
              </div>

              {/* Markdown Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                    Preview Content (Shown to everyone)
                  </label>
                  <textarea
                    rows={4}
                    value={newWriteup.previewContent}
                    onChange={(e) => setNewWriteup({ ...newWriteup, previewContent: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg p-3.5 text-xs font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                    Full Content (Exploitation Chain — Server-Gated)
                  </label>
                  <textarea
                    rows={8}
                    value={newWriteup.fullContent}
                    onChange={(e) => setNewWriteup({ ...newWriteup, fullContent: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg p-3.5 text-xs font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#00ff66] text-[#050708] font-mono font-bold text-sm rounded-lg hover:bg-[#00ff66]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00ff66]/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                PUBLISH WRITEUP TO LIVE DATABASE
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CERTIFICATIONS (Admin Only)                                        */}
        {/* ========================================================================= */}
        {activeTab === 'certs' && (
          <div className="space-y-8 max-w-5xl">
            {/* Add Certificate Form */}
            <div className="bg-[#0a0f14] border border-[#1b2631] rounded-xl p-6">
              <h2 className="text-base font-mono font-bold text-orange-400 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" /> ADD NEW CERTIFICATION
              </h2>

              <form onSubmit={handleCreateCert} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Badge Acronym *</label>
                    <input
                      type="text"
                      required
                      value={newCert.name}
                      onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                      placeholder="e.g. CRTO, OSCP, BSCP"
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Full Certification Name *</label>
                    <input
                      type="text"
                      required
                      value={newCert.fullName}
                      onChange={(e) => setNewCert({ ...newCert, fullName: e.target.value })}
                      placeholder="e.g. Certified Red Team Operator"
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Issuer *</label>
                    <input
                      type="text"
                      required
                      value={newCert.issuer}
                      onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                      placeholder="e.g. Zero-Point Security, OffSec"
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Date / Month</label>
                    <input
                      type="text"
                      value={newCert.date}
                      onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                      placeholder="e.g. Oct 2024"
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Status</label>
                    <select
                      value={newCert.status}
                      onChange={(e) => setNewCert({ ...newCert, status: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="earned">Earned</option>
                      <option value="in-progress">In Progress</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Badge Color Hex</label>
                    <input
                      type="text"
                      value={newCert.badgeColor}
                      onChange={(e) => setNewCert({ ...newCert, badgeColor: e.target.value })}
                      placeholder="#00ff66"
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Skills Covered (Comma separated)</label>
                  <input
                    type="text"
                    value={newCert.skillsCovered}
                    onChange={(e) => setNewCert({ ...newCert, skillsCovered: e.target.value })}
                    placeholder="Cobalt Strike, Kerberos, Lateral Movement"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newCert.description}
                    onChange={(e) => setNewCert({ ...newCert, description: e.target.value })}
                    placeholder="Practical examination scope."
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-orange-500 text-black font-mono font-bold text-xs rounded-lg hover:bg-orange-400 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> SAVE CERTIFICATION TO LIVE DATABASE
                </button>
              </form>
            </div>

            {/* List of Certs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certs.map((c) => (
                <div key={c.id} className="bg-[#0a0f14] border border-[#1b2631] rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white">{c.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        c.status === 'earned' ? 'bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-300">{c.fullName}</p>
                    <p className="text-[11px] font-mono text-gray-500">{c.issuer} • {c.date}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteCert(c.id, c.name)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                    title="Delete certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: NOTION IMPORT HUB (Selective Import)                                */}
        {/* ========================================================================= */}
        {activeTab === 'notion' && (
          <div className="space-y-8 max-w-5xl">
            {/* Notion Status & Explanation */}
            <div className="bg-[#0a0f14] border border-[#1b2631] rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-mono font-bold text-purple-400 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" /> NOTION NOTES &amp; SELECTIVE IMPORT
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    Connected to workspace <strong className="text-white">{notionStatus?.workspace || 'HTB MACHINES'}</strong> under integration <strong className="text-purple-400">{notionStatus?.bot || 'website'}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchData(adminKey)}
                    className="px-4 py-2 bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono rounded-lg hover:bg-purple-500/25 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Notion Pages
                  </button>
                </div>
              </div>

              {/* Step by step note */}
              <div className="p-4 rounded-lg bg-[#050708] border border-[#1b2631] text-xs font-mono space-y-2">
                <div className="text-purple-300 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-400" />
                  How to make Easy, Insane, and new notes visible:
                </div>
                <p className="text-gray-400">
                  In your Notion Developers dashboard &rarr; integration <strong className="text-purple-400">website</strong> &rarr; <strong className="text-white">Content access</strong> tab: click <strong className="text-[#00ff66]">&quot;+ Add pages &amp; databases&quot;</strong> and add <strong className="text-white">🟢 Easy</strong> and <strong className="text-white">💥 Insane</strong>. Once added, click <strong className="text-purple-400">&quot;Refresh Notion Pages&quot;</strong> above!
                </p>
                <p className="text-gray-500 text-[11px]">
                  💡 <em>Note:</em> In Notion, <span className="text-amber-400">Hard</span>, <span className="text-yellow-400">Medium</span>, <span className="text-green-400">Easy</span>, and <span className="text-red-400">Insane</span> are category folders. Import individual machine pages inside each folder (e.g. <em>Flight</em>, <em>DARKZERORETURNS</em>) separately.
                </p>
              </div>
            </div>

            {/* Category Filter & Stats */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {['all', 'hard', 'medium', 'easy', 'insane'].map((cat) => {
                  const count = cat === 'all'
                    ? notionPages.filter(p => !p.isContainer).length
                    : notionPages.filter(p => !p.isContainer && p.category?.toLowerCase() === cat).length;
                  const active = notionCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setNotionCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        active
                          ? 'bg-[#00ff66] text-[#050708]'
                          : 'bg-[#0a0f14] border border-[#1b2631] text-gray-400 hover:text-white hover:border-gray-600'
                      }`}
                    >
                      {cat.toUpperCase()} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="text-xs font-mono text-gray-500">
                Showing {notionPages.filter(p => {
                  if (notionCategoryFilter === 'all') return true;
                  return p.category?.toLowerCase() === notionCategoryFilter.toLowerCase();
                }).length} item(s)
              </div>
            </div>

            {/* List of Pages in Notion */}
            <div>
              <div className="space-y-3">
                {notionPages
                  .filter(p => {
                    if (notionCategoryFilter === 'all') return true;
                    return p.category?.toLowerCase() === notionCategoryFilter.toLowerCase();
                  })
                  .map((p) => {
                    if (p.isContainer) {
                      return (
                        <div key={p.id} className="bg-[#050708] border border-[#1b2631] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-75">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-gray-300">{p.title}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-gray-800 text-gray-400 border border-gray-700">
                                  CATEGORY FOLDER
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                                Category container — select individual machine writeups below to import
                              </p>
                            </div>
                          </div>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] rounded-lg text-gray-400 hover:text-white transition-all self-end sm:self-auto"
                            title="Open in Notion"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    }

                    return (
                      <div key={p.id} className="bg-[#0a0f14] border border-[#1b2631] hover:border-[#00ff66]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white">{p.title}</span>
                            {p.category && (
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                p.category.toLowerCase() === 'hard'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                  : p.category.toLowerCase() === 'medium'
                                  ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                                  : p.category.toLowerCase() === 'easy'
                                  ? 'bg-green-500/10 text-[#00ff66] border border-[#00ff66]/30'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              }`}>
                                {p.category.toUpperCase()}
                              </span>
                            )}
                            {p.alreadySynced ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/30 flex items-center gap-1">
                                <Check className="w-3 h-3" /> SYNCED ON SITE
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                NEW IN NOTION
                              </span>
                            )}
                            {p.isProLab && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                                PRO LAB
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-gray-500">
                            {p.parentTitle ? `Folder: ${p.parentTitle} • ` : ''}Last edited: {p.lastEditedTime?.split('T')[0] || 'Recently'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setSelectedNotionPage(p);
                              const defaultDiff = ['Easy', 'Medium', 'Hard', 'Insane'].find(
                                d => d.toLowerCase() === p.category?.toLowerCase()
                              ) || 'Medium';
                              setImportConfig({
                                title: p.title,
                                isProLab: false,
                                platform: 'HTB',
                                difficulty: defaultDiff,
                                os: 'Linux',
                                tags: p.category ? `${p.category}, CTF` : 'CTF',
                                summary: `${p.title} walkthrough and machine exploitation report.`,
                                initialAccessVector: '',
                                privEscVector: '',
                                unlockPassword: handleGeneratePassword(p.title, false),
                              });
                            }}
                            className="px-4 py-2 bg-[#00ff66]/10 hover:bg-[#00ff66]/20 border border-[#00ff66]/30 text-[#00ff66] text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {p.alreadySynced ? 'RE-IMPORT / UPDATE' : 'IMPORT TO SITE'}
                          </button>

                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#0e141a] hover:bg-[#1b2631] border border-[#1b2631] rounded-lg text-gray-400 hover:text-white transition-all"
                            title="Open in Notion"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}

                {notionPages.length === 0 && (
                  <div className="text-center py-10 bg-[#0a0f14] border border-[#1b2631] rounded-xl">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-mono text-gray-400">No pages shared with integration &quot;website&quot; yet.</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">Share your Notion writeup pages by adding them in Content access under your integration.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: SELECTIVE NOTION PAGE IMPORT                                       */}
        {/* ========================================================================= */}
        {selectedNotionPage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0a0f14] border border-[#00ff66]/40 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#1b2631] pb-3">
                <div className="flex items-center gap-2.5">
                  <Download className="w-5 h-5 text-[#00ff66]" />
                  <h3 className="font-mono text-base font-bold text-white">
                    IMPORT WRITEUP FROM NOTION
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedNotionPage(null)}
                  className="text-gray-500 hover:text-white text-xs font-mono font-bold"
                >
                  ✕ CLOSE
                </button>
              </div>

              <div className="space-y-4">
                {/* Pro Lab Checkbox */}
                <div className="p-3.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-300 block">
                      IS THIS AN HTB PRO LAB?
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Pro Labs are locked by default and never auto-retire.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={importConfig.isProLab}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setImportConfig(prev => ({
                        ...prev,
                        isProLab: checked,
                        platform: checked ? 'HTB Pro Lab' : 'HTB',
                        unlockPassword: handleGeneratePassword(prev.title, checked),
                      }));
                    }}
                    className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Title / Machine Name</label>
                  <input
                    type="text"
                    value={importConfig.title}
                    onChange={(e) => setImportConfig({ ...importConfig, title: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Platform</label>
                    <select
                      value={importConfig.platform}
                      onChange={(e) => setImportConfig({ ...importConfig, platform: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="HTB">Hack The Box</option>
                      <option value="HTB Pro Lab">HTB Pro Lab</option>
                      <option value="THM">TryHackMe</option>
                      <option value="Proving Grounds">Proving Grounds</option>
                      <option value="Other">Other CTF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Difficulty</label>
                    <select
                      value={importConfig.difficulty}
                      onChange={(e) => setImportConfig({ ...importConfig, difficulty: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">OS / Architecture</label>
                    <select
                      value={importConfig.os}
                      onChange={(e) => setImportConfig({ ...importConfig, os: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="Linux">Linux</option>
                      <option value="Windows">Windows</option>
                      <option value="Active Directory">Active Directory</option>
                      <option value="Multi">Multi-Tier Network</option>
                    </select>
                  </div>
                </div>

                {/* FOOTHOLD VECTOR */}
                <div>
                  <label className="block text-xs font-mono text-[#00ff66] font-bold uppercase mb-1">
                    Foothold / Initial Access Vector
                  </label>
                  <input
                    type="text"
                    value={importConfig.initialAccessVector}
                    onChange={(e) => setImportConfig({ ...importConfig, initialAccessVector: e.target.value })}
                    placeholder="e.g. Guest access on SMB share revealing svc_apache credentials"
                    className="w-full bg-[#050708] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">Appears directly on the writeup card under FOOTHOLD.</p>
                </div>

                {/* PRIVESC VECTOR */}
                <div>
                  <label className="block text-xs font-mono text-amber-400 font-bold uppercase mb-1">
                    Privilege Escalation Vector
                  </label>
                  <input
                    type="text"
                    value={importConfig.privEscVector}
                    onChange={(e) => setImportConfig({ ...importConfig, privEscVector: e.target.value })}
                    placeholder="e.g. SeBackupPrivilege abuse leading to SAM/SYSTEM hive dump"
                    className="w-full bg-[#050708] border border-[#1b2631] focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">Appears directly on the writeup card under PRIVESC.</p>
                </div>

                {/* TAGS */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={importConfig.tags}
                    onChange={(e) => setImportConfig({ ...importConfig, tags: e.target.value })}
                    placeholder="e.g. Pivoting, Active Directory, Kerberoasting, BloodHound"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                {/* SUMMARY */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Summary</label>
                  <textarea
                    rows={2}
                    value={importConfig.summary}
                    onChange={(e) => setImportConfig({ ...importConfig, summary: e.target.value })}
                    placeholder="Brief overview of the machine"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-[#00ff66] uppercase font-bold">
                      Unlock Passphrase:
                    </label>
                    <button
                      type="button"
                      onClick={() => setImportConfig(prev => ({ ...prev, unlockPassword: handleGeneratePassword(prev.title, prev.isProLab) }))}
                      className="text-[11px] font-mono text-[#00ff66] hover:underline"
                    >
                      Regenerate Flag
                    </button>
                  </div>
                  <input
                    type="text"
                    value={importConfig.unlockPassword}
                    onChange={(e) => setImportConfig({ ...importConfig, unlockPassword: e.target.value })}
                    className="w-full bg-[#050708] border border-[#00ff66]/40 rounded-lg px-3 py-2 text-sm font-mono text-[#00ff66] focus:border-[#00ff66] focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-1">
                    Saved in your Password Vault so you can retrieve and copy it anytime.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1b2631] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedNotionPage(null)}
                  className="px-4 py-2 bg-[#0e141a] border border-[#1b2631] text-xs font-mono rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportNotionPage}
                  disabled={loading}
                  className="px-5 py-2 bg-[#00ff66] text-[#050708] font-mono font-bold text-xs rounded-lg hover:bg-[#00ff66]/90 transition-all flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  IMPORT &amp; REHOST SCREENSHOTS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: EDIT EXISTING WRITEUP                                              */}
        {/* ========================================================================= */}
        {editingWriteup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0f14] border border-[#00ff66]/40 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#1b2631] pb-3">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-5 h-5 text-[#00ff66]" />
                  <h3 className="font-mono text-base font-bold text-white">
                    EDIT WRITEUP: {editingWriteup.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setEditingWriteup(null)}
                  className="text-gray-500 hover:text-white text-xs font-mono font-bold"
                >
                  ✕ CLOSE
                </button>
              </div>

              <form onSubmit={handleUpdateWriteup} className="space-y-4">
                {/* Pro Lab Toggle */}
                <div className="p-3.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-300 block">
                      HTB PRO LAB
                    </span>
                    <span className="text-[11px] font-mono text-gray-400">
                      Pro Labs are locked by default and require custom passphrase.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(editingWriteup.is_pro_lab)}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, is_pro_lab: e.target.checked })}
                    className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Title</label>
                    <input
                      type="text"
                      value={editingWriteup.title || ''}
                      onChange={(e) => setEditingWriteup({ ...editingWriteup, title: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Platform</label>
                    <select
                      value={editingWriteup.platform || 'HTB'}
                      onChange={(e) => setEditingWriteup({ ...editingWriteup, platform: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="HTB">Hack The Box</option>
                      <option value="HTB Pro Lab">HTB Pro Lab</option>
                      <option value="THM">TryHackMe</option>
                      <option value="Proving Grounds">Proving Grounds</option>
                      <option value="Other">Other CTF</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Difficulty</label>
                    <select
                      value={editingWriteup.difficulty || 'Medium'}
                      onChange={(e) => setEditingWriteup({ ...editingWriteup, difficulty: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Insane">Insane</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase mb-1">OS / Architecture</label>
                    <select
                      value={editingWriteup.os || 'Linux'}
                      onChange={(e) => setEditingWriteup({ ...editingWriteup, os: e.target.value })}
                      className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                    >
                      <option value="Linux">Linux</option>
                      <option value="Windows">Windows</option>
                      <option value="Active Directory">Active Directory</option>
                      <option value="Multi">Multi-Tier Network</option>
                    </select>
                  </div>
                </div>

                {/* FOOTHOLD VECTOR */}
                <div>
                  <label className="block text-xs font-mono text-[#00ff66] font-bold uppercase mb-1">
                    Foothold / Initial Access Vector *
                  </label>
                  <input
                    type="text"
                    value={editingWriteup.initial_access_vector || ''}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, initial_access_vector: e.target.value })}
                    placeholder="e.g. Anonymous SMB share access revealing svc credentials"
                    className="w-full bg-[#050708] border border-[#1b2631] focus:border-[#00ff66] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">Displayed prominently on the writeup card under FOOTHOLD.</p>
                </div>

                {/* PRIVESC VECTOR */}
                <div>
                  <label className="block text-xs font-mono text-amber-400 font-bold uppercase mb-1">
                    Privilege Escalation Vector *
                  </label>
                  <input
                    type="text"
                    value={editingWriteup.priv_esc_vector || ''}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, priv_esc_vector: e.target.value })}
                    placeholder="e.g. SeBackupPrivilege abuse leading to SYSTEM hash dump"
                    className="w-full bg-[#050708] border border-[#1b2631] focus:border-amber-400 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">Displayed prominently on the writeup card under PRIVESC.</p>
                </div>

                {/* TAGS */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editingWriteup.tags || ''}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, tags: e.target.value })}
                    placeholder="e.g. Pivoting, Active Directory, Kerberoasting, BloodHound"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-gray-500 mt-0.5">Rendered as badge tags (e.g. #Pivoting, #ActiveDirectory).</p>
                </div>

                {/* SUMMARY */}
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Summary</label>
                  <textarea
                    rows={2}
                    value={editingWriteup.summary || ''}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, summary: e.target.value })}
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                {/* UNLOCK PASSWORD */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono text-[#00ff66] uppercase font-bold">
                      Unlock Passphrase
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingWriteup({ ...editingWriteup, unlock_password: handleGeneratePassword(editingWriteup.title, editingWriteup.is_pro_lab) })}
                      className="text-[11px] font-mono text-[#00ff66] hover:underline"
                    >
                      Generate Flag
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingWriteup.unlock_password || ''}
                    onChange={(e) => setEditingWriteup({ ...editingWriteup, unlock_password: e.target.value })}
                    placeholder="Leave empty or set flag password"
                    className="w-full bg-[#050708] border border-[#1b2631] rounded-lg px-3 py-2 text-sm font-mono text-[#00ff66] focus:border-[#00ff66] focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-[#1b2631] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingWriteup(null)}
                    className="px-4 py-2 bg-[#0e141a] border border-[#1b2631] text-xs font-mono rounded-lg text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-[#00ff66] text-[#050708] font-mono font-bold text-xs rounded-lg hover:bg-[#00ff66]/90 transition-all flex items-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
