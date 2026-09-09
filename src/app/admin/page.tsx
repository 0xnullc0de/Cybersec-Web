'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Key, Lock, Unlock, Plus, RefreshCw, Check, Copy, 
  Trash2, Edit, ExternalLink, Terminal, AlertTriangle, FileText, 
  Award, Eye, EyeOff, CheckCircle2 
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
  const [loading, setLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      // Fetch Notion status
      const nRes = await fetch('/api/sync/notion/status');
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotionStatus(nData);
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

  const handleGeneratePassword = () => {
    const machine = newWriteup.title.replace(/[^a-zA-Z0-9]/g, '') || 'Machine';
    const randHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const generated = `HTB{${machine}_pwn3d_${randHex}_root!}`;
    setNewWriteup(prev => ({ ...prev, unlockPassword: generated }));
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
        body: JSON.stringify(newWriteup),
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

  const handleToggleRetirement = async (id: string, currentStatus: boolean, title: string) => {
    if (!confirm(`Are you sure you want to mark "${title}" as ${currentStatus ? 'ACTIVE (Locked)' : 'RETIRED (Public for all)'}?`)) return;

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
      <div className="min-h-screen bg-bg-dark text-text-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card-bg border border-neon-green/30 rounded-lg p-6 shadow-2xl shadow-neon-green/10">
          <div className="flex items-center gap-3 mb-6 border-b border-border-color pb-4">
            <div className="p-2 bg-neon-green/10 border border-neon-green/30 rounded">
              <Shield className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-bold text-neon-green">ROOT ACCESS CONTROL</h1>
              <p className="text-xs text-text-muted font-mono">Nulbyt3 Admin Vault & CMS</p>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded mb-4 text-xs font-mono border ${
              message.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-green-500/10 border-green-500/40 text-green-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); checkAuth(adminKey); }}>
            <div className="mb-4">
              <label className="block text-xs font-mono text-text-muted mb-2 uppercase tracking-wider">
                Administrative Passphrase
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-text-muted" />
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin password (default: nulbyt3-root)"
                  className="w-full bg-bg-dark border border-border-color rounded pl-10 pr-3 py-2 text-sm font-mono focus:border-neon-green focus:outline-none text-neon-green placeholder:text-text-muted/40"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neon-green text-bg-dark font-mono font-bold text-sm rounded hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
              AUTHENTICATE ROOT
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs font-mono text-text-muted hover:text-neon-green transition-colors">
              &larr; Return to Portfolio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED MANAGEMENT DASHBOARD
  const activeWriteups = writeups.filter(w => !w.is_retired);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-color pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse"></span>
              <h1 className="text-2xl font-mono font-bold text-neon-green">NULBYT3 VAULT CONSOLE</h1>
            </div>
            <p className="text-xs text-text-muted font-mono mt-1">
              Live Database: <span className="text-text-primary">Supabase EU-WEST</span> • Host: <span className="text-text-primary">Vercel Edge</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(adminKey)}
              disabled={loading}
              className="px-3 py-1.5 bg-card-bg border border-border-color hover:border-neon-green/50 text-xs font-mono rounded flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-neon-green' : ''}`} />
              Refresh Data
            </button>
            <Link
              href="/writeups"
              target="_blank"
              className="px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono rounded flex items-center gap-2 hover:bg-neon-green/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Live Site
            </Link>
            <button
              onClick={() => { sessionStorage.removeItem('admin_key'); setIsAuthenticated(false); }}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono rounded hover:bg-red-500/20 transition-all"
            >
              Lock Console
            </button>
          </div>
        </div>

        {/* Alerts & Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-mono border flex items-center justify-between ${
            message.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-neon-green/10 border-neon-green/40 text-neon-green'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs hover:underline ml-4 font-bold">DISMISS</button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-border-color mb-8 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('passwords')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'passwords'
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Key className="w-4 h-4 text-neon-green" />
            PASSWORD VAULT ({activeWriteups.length})
          </button>

          <button
            onClick={() => setActiveTab('writeups')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'writeups'
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText className="w-4 h-4" />
            ALL WRITEUPS ({writeups.length})
          </button>

          <button
            onClick={() => setActiveTab('new-writeup')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'new-writeup'
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Plus className="w-4 h-4" />
            + NEW WRITEUP
          </button>

          <button
            onClick={() => setActiveTab('notion')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'notion'
                ? 'border-neon-green text-neon-green bg-neon-green/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            NOTION SYNC HUB
          </button>
        </div>

        {/* TAB 1: PASSWORD VAULT (Resolves Item 6) */}
        {activeTab === 'passwords' && (
          <div>
            <div className="bg-card-bg border border-border-color rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Lock className="w-5 h-5 text-neon-green" />
                <h2 className="text-lg font-mono font-bold text-text-primary">ACTIVE MACHINE PASSPHRASE VAULT</h2>
              </div>
              <p className="text-xs text-text-muted font-mono">
                These are passwords for machines that have NOT yet retired. You do not need to memorize them. Click &quot;Copy&quot; whenever you want to test unlocking or view them.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeWriteups.map((w) => (
                <div key={w.slug} className="bg-card-bg border border-neon-green/30 rounded-lg p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-red-500/10 text-red-400 border border-red-500/30">
                        ACTIVE / LOCKED
                      </span>
                      <span className="text-xs font-mono text-text-muted">{w.platform} • {w.difficulty}</span>
                    </div>

                    <h3 className="text-base font-mono font-bold text-text-primary mb-1">{w.title}</h3>
                    <p className="text-xs text-text-muted font-mono mb-4">{w.summary || 'No summary available.'}</p>

                    <div className="bg-bg-dark border border-border-color rounded p-3 mb-4">
                      <div className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">
                        Unlock Passphrase (Saved in DB):
                      </div>
                      <div className="font-mono text-xs text-neon-green break-all select-all">
                        {w.unlock_password || '(No cleartext password recorded)'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-border-color">
                    <button
                      onClick={() => handleCopyPassword(w.slug, w.unlock_password || '')}
                      disabled={!w.unlock_password}
                      className="flex-1 py-2 bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/40 text-neon-green font-mono text-xs rounded flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copiedSlug === w.slug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedSlug === w.slug ? 'COPIED!' : 'COPY PASSPHRASE'}
                    </button>

                    <button
                      onClick={() => handleToggleRetirement(w.id, w.is_retired, w.title)}
                      className="px-3 py-2 bg-card-bg hover:bg-border-color border border-border-color text-text-muted hover:text-text-primary font-mono text-xs rounded transition-all"
                      title="Mark as Retired (Unlocks for everyone)"
                    >
                      Retire Now
                    </button>

                    <Link
                      href={`/writeups/${w.slug}`}
                      target="_blank"
                      className="px-3 py-2 bg-card-bg hover:bg-border-color border border-border-color text-text-muted hover:text-text-primary font-mono text-xs rounded transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}

              {activeWriteups.length === 0 && (
                <div className="col-span-2 text-center py-12 bg-card-bg border border-border-color rounded-lg">
                  <Unlock className="w-8 h-8 text-neon-green mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono text-text-muted">No active machines locked at this time. All writeups are retired and public!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL WRITEUPS (Edit / Delete / View) */}
        {activeTab === 'writeups' && (
          <div className="space-y-4">
            {writeups.map((w) => (
              <div key={w.slug} className="bg-card-bg border border-border-color hover:border-neon-green/30 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      w.is_retired 
                        ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {w.is_retired ? 'RETIRED (PUBLIC)' : 'ACTIVE (LOCKED)'}
                    </span>
                    <span className="text-xs font-mono text-text-muted">{w.platform} • {w.difficulty} • {w.os}</span>
                  </div>
                  <h3 className="text-base font-mono font-bold text-text-primary">{w.title}</h3>
                  <p className="text-xs text-text-muted font-mono line-clamp-1">{w.summary}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRetirement(w.id, w.is_retired, w.title)}
                    className="px-3 py-1.5 bg-card-bg hover:bg-border-color border border-border-color text-xs font-mono rounded text-text-muted hover:text-text-primary"
                  >
                    {w.is_retired ? 'Make Active' : 'Retire'}
                  </button>
                  <Link
                    href={`/writeups/${w.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-card-bg hover:bg-border-color border border-border-color text-xs font-mono rounded text-text-muted hover:text-text-primary flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  <button
                    onClick={() => handleDeleteWriteup(w.id, w.title)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: NEW WRITEUP CREATOR (Resolves Item 1 & Item 5) */}
        {activeTab === 'new-writeup' && (
          <div className="bg-card-bg border border-border-color rounded-lg p-6 max-w-4xl">
            <h2 className="text-lg font-mono font-bold text-neon-green mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5" /> POST NEW WRITEUP TO SUPABASE
            </h2>
            <p className="text-xs text-text-muted font-mono mb-6">
              Create and publish a new writeup directly. It will instantly appear on your site and database.
            </p>

            <form onSubmit={handleCreateWriteup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">Title / Machine Name *</label>
                  <input
                    type="text"
                    required
                    value={newWriteup.title}
                    onChange={(e) => setNewWriteup({ ...newWriteup, title: e.target.value })}
                    placeholder="e.g. Forest, Cicada, Resolute"
                    className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">Slug (URL identifier)</label>
                  <input
                    type="text"
                    value={newWriteup.slug}
                    onChange={(e) => setNewWriteup({ ...newWriteup, slug: e.target.value })}
                    placeholder="Leave empty to auto-generate (e.g. htb-forest)"
                    className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">Platform</label>
                  <select
                    value={newWriteup.platform}
                    onChange={(e) => setNewWriteup({ ...newWriteup, platform: e.target.value })}
                    className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  >
                    <option value="HTB">Hack The Box</option>
                    <option value="THM">TryHackMe</option>
                    <option value="Proving Grounds">Proving Grounds</option>
                    <option value="PortSwigger">PortSwigger</option>
                    <option value="Other">Other CTF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">Difficulty</label>
                  <select
                    value={newWriteup.difficulty}
                    onChange={(e) => setNewWriteup({ ...newWriteup, difficulty: e.target.value })}
                    className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Insane">Insane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">OS Architecture</label>
                  <select
                    value={newWriteup.os}
                    onChange={(e) => setNewWriteup({ ...newWriteup, os: e.target.value })}
                    className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  >
                    <option value="Linux">Linux</option>
                    <option value="Windows">Windows</option>
                    <option value="Active Directory">Active Directory</option>
                    <option value="Android">Android</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={newWriteup.tags}
                  onChange={(e) => setNewWriteup({ ...newWriteup, tags: e.target.value })}
                  placeholder="Active Directory, Kerberoasting, BloodHound, LAPS"
                  className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-text-muted uppercase mb-1">Summary / Executive Overview</label>
                <textarea
                  rows={2}
                  value={newWriteup.summary}
                  onChange={(e) => setNewWriteup({ ...newWriteup, summary: e.target.value })}
                  placeholder="One or two sentences summarizing the vulnerability and privilege escalation vector."
                  className="w-full bg-bg-dark border border-border-color rounded px-3 py-2 text-sm font-mono text-text-primary focus:border-neon-green focus:outline-none"
                />
              </div>

              {/* Status & Passphrase Section */}
              <div className="p-4 bg-bg-dark border border-border-color rounded-lg space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWriteup.isRetired}
                      onChange={(e) => setNewWriteup({ ...newWriteup, isRetired: e.target.checked })}
                      className="accent-neon-green w-4 h-4"
                    />
                    <span className="text-xs font-mono text-text-primary">Machine is RETIRED (Publicly viewable to all)</span>
                  </label>
                </div>

                {!newWriteup.isRetired && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-mono text-neon-green uppercase flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" /> Early Unlock Passphrase (Required for Active Box)
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] font-mono text-neon-green hover:underline flex items-center gap-1"
                      >
                        Auto-Generate Flag Format
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newWriteup.unlockPassword}
                      onChange={(e) => setNewWriteup({ ...newWriteup, unlockPassword: e.target.value })}
                      placeholder="e.g. HTB{MachineName_4D_pwn3d_2024!}"
                      className="w-full bg-card-bg border border-neon-green/40 rounded px-3 py-2 text-sm font-mono text-neon-green focus:border-neon-green focus:outline-none"
                    />
                    <p className="text-[11px] font-mono text-text-muted mt-1">
                      * This password is encrypted in Supabase and displayed in your Admin Password Vault so you never forget it.
                    </p>
                  </div>
                )}
              </div>

              {/* Content Areas */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                    Preview Content (Shown to everyone, even when locked)
                  </label>
                  <textarea
                    rows={4}
                    value={newWriteup.previewContent}
                    onChange={(e) => setNewWriteup({ ...newWriteup, previewContent: e.target.value })}
                    className="w-full bg-bg-dark border border-border-color rounded p-3 text-xs font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-text-muted uppercase mb-1">
                    Full Content (Exploitation Chain — Locked until unlocked or retired)
                  </label>
                  <textarea
                    rows={8}
                    value={newWriteup.fullContent}
                    onChange={(e) => setNewWriteup({ ...newWriteup, fullContent: e.target.value })}
                    className="w-full bg-bg-dark border border-border-color rounded p-3 text-xs font-mono text-text-primary focus:border-neon-green focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-neon-green text-bg-dark font-mono font-bold text-sm rounded hover:bg-neon-green/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                PUBLISH WRITEUP TO LIVE DATABASE
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: NOTION SYNC HUB (Resolves Item 7) */}
        {activeTab === 'notion' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-card-bg border border-border-color rounded-lg p-6">
              <h2 className="text-lg font-mono font-bold text-neon-green mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> NOTION INTEGRATION STATUS
              </h2>
              <p className="text-xs text-text-muted font-mono mb-6">
                Connect your Notion workspace so your machine notes sync automatically into your portfolio.
              </p>

              {notionStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-bg-dark border border-border-color rounded p-4">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Workspace</div>
                      <div className="text-sm font-mono font-bold text-text-primary mt-1">{notionStatus.workspace}</div>
                    </div>
                    <div className="bg-bg-dark border border-border-color rounded p-4">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Integration Bot</div>
                      <div className="text-sm font-mono font-bold text-neon-green mt-1">{notionStatus.bot}</div>
                    </div>
                    <div className="bg-bg-dark border border-border-color rounded p-4">
                      <div className="text-[10px] font-mono text-text-muted uppercase">Connected Pages</div>
                      <div className="text-sm font-mono font-bold text-text-primary mt-1">{notionStatus.connectedItemsCount}</div>
                    </div>
                  </div>

                  {notionStatus.connectedItemsCount === 0 ? (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-4 text-xs font-mono text-amber-300 space-y-2">
                      <div className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        HOW TO CONNECT YOUR NOTION WRITEUP PAGES (Takes 15 Seconds):
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-text-muted pl-2">
                        <li>Open Notion in your workspace <strong className="text-text-primary">&quot;{notionStatus.workspace}&quot;</strong>.</li>
                        <li>Navigate to your writeups page or database.</li>
                        <li>Click the <strong className="text-text-primary">&quot;...&quot;</strong> icon in the top right corner.</li>
                        <li>Scroll down and click <strong className="text-text-primary">Connections</strong> (or <strong className="text-text-primary">Add connections</strong>).</li>
                        <li>Search for and select <strong className="text-neon-green">&quot;{notionStatus.bot}&quot;</strong>.</li>
                      </ol>
                      <p className="text-[11px] text-amber-200 mt-2">
                        Once you connect it, refresh this page or click &quot;Trigger Sync&quot; below and your writeups will sync into Supabase!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-xs font-mono text-green-300">
                      <div className="font-bold flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        Found {notionStatus.connectedItemsCount} Connected Pages in Notion!
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-text-muted">
                        {notionStatus.items.map((it: any) => (
                          <li key={it.id}>{it.title} ({it.object})</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border-color">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        setMessage(null);
                        try {
                          const res = await fetch('/api/sync/notion', { method: 'POST' });
                          const data = await res.json();
                          if (res.ok) {
                            setMessage({ type: 'success', text: `Sync completed! Synced: ${data.pagesSynced || 0}, Images re-hosted: ${data.imagesRehosted || 0}` });
                            fetchData(adminKey);
                          } else {
                            setMessage({ type: 'error', text: data.message || 'Sync failed' });
                          }
                        } catch (e: any) {
                          setMessage({ type: 'error', text: e.message });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="px-6 py-2.5 bg-neon-green text-bg-dark font-mono font-bold text-xs rounded hover:bg-neon-green/90 transition-all flex items-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      TRIGGER NOTION SYNC NOW
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-text-muted">Checking Notion API connection...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
