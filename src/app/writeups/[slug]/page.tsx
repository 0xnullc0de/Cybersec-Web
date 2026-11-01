import React from 'react';
import { notFound } from 'next/navigation';
import WriteupDetailView from '@/components/writeups/WriteupDetailView';
import { getWriteupBySlug, isWriteupRetired } from '@/lib/supabase';

interface WriteupPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WriteupDetailPage({ params }: WriteupPageProps) {
  const writeup = await getWriteupBySlug(params.slug);

  if (!writeup) {
    notFound();
  }

  const retiredNow = isWriteupRetired(writeup);

  // For active machines, strip out Introduction and pre-recon spoilers from previewContent
  const activeSafePreview = !retiredNow && writeup.previewContent
    ? writeup.previewContent
        .replace(/(?:^|\n)#{1,3}\s+Introduction[\s\S]*?(?=(?:\n#{1,3}\s+[^\n]+|\n---|$))/i, '')
        .trim()
    : (writeup.previewContent || '');

  return (
    <WriteupDetailView
      initialWriteup={writeup}
      retiredNow={retiredNow}
      activeSafePreview={activeSafePreview}
    />
  );
}
