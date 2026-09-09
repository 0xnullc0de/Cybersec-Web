'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Shield, FileText, Award, BookOpen, User, Sun, Moon, Menu, X, ExternalLink } from 'lucide-react';
import { siteConfig } from '@/data/siteConfig';

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const navLinks = [
    { name: 'Writeups', href: '/writeups', icon: FileText },
    { name: 'Certifications', href: '/about#certifications', icon: Award },
    { name: 'TIL Notes', href: '/til', icon: BookOpen },
    { name: 'About / Whoami', href: '/about', icon: User },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050708]/90 dark:bg-[#050708]/90 light:bg-white/90 backdrop-blur-md border-b border-[#1b2631] dark:border-[#1b2631] shadow-lg shadow-black/40 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Handle */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0e141a] border border-[#00ff66]/40 flex items-center justify-center group-hover:border-[#00ff66] group-hover:shadow-glow transition-all duration-300">
              <Terminal className="w-5 h-5 text-[#00ff66]" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-white group-hover:text-[#00ff66] transition-colors">
                {siteConfig.handle}<span className="text-[#00ff66] animate-blink">_</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase -mt-1">
                RED TEAM LABS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-md font-mono text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/30 shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00ff66]' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Status Dot */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#0a1015] border border-[#1b2631] text-[11px] font-mono text-gray-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff66] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff66]"></span>
              </span>
              <span>PWNING</span>
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg bg-[#0e141a] border border-[#1e2933] text-gray-300 hover:text-[#00ff66] hover:border-[#00ff66]/50 transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Glowing CTA Button */}
            <Link
              href="/writeups"
              className="px-4 py-2 rounded-md bg-[#00ff66] text-black font-mono font-bold text-xs tracking-wider uppercase hover:bg-[#00e55b] hover:shadow-glow transition-all duration-300 flex items-center gap-1.5"
            >
              <span>ACCESS VAULT</span>
              <Shield className="w-3.5 h-3.5 text-black" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-lg bg-[#0e141a] border border-[#1e2933] text-gray-300"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#0e141a] border border-[#1e2933] text-white hover:text-[#00ff66]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 rounded-xl bg-[#090d10] border border-[#1e2933] shadow-2xl flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-mono text-gray-200 hover:text-[#00ff66] hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#00ff66]" />
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-[#1e2933] flex items-center justify-between">
              <span className="text-xs font-mono text-gray-400">STATUS: READY TO HACK</span>
              <Link
                href="/writeups"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#00ff66] text-black font-mono font-bold text-xs tracking-wider uppercase"
              >
                ACCESS VAULT
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
