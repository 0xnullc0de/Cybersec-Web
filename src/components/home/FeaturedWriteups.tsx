import React from 'react';
import Link from 'next/link';
import { getWriteups } from '@/lib/supabase';
import WriteupCard from '@/components/writeups/WriteupCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { ArrowRight } from 'lucide-react';

export default async function FeaturedWriteups() {
  const writeupsList = await getWriteups();
  const featured = writeupsList.filter(w => w.featured).length > 0
    ? writeupsList.filter(w => w.featured).slice(0, 3)
    : writeupsList.slice(0, 3);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <SectionHeader
          badge="FEATURED RESEARCH"
          title="LATEST ROOT EXPLOITATION WRITEUPS"
          description="Detailed walkthroughs of realistic HTB & THM targets covering Active Directory domain breaches, KeePass memory forensics, and network pivoting."
        />

        <Link
          href="/writeups"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0e151b] border border-[#1b2631] text-gray-200 font-mono text-xs font-semibold hover:border-[#00ff66]/50 hover:text-[#00ff66] transition-all self-start md:self-auto"
        >
          <span>VIEW ALL 24 WRITEUPS</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featured.map((writeup) => (
          <WriteupCard key={writeup.slug} writeup={writeup} />
        ))}
      </div>
    </section>
  );
}
