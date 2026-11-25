import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import TilDetailView from '@/components/til/TilDetailView';
import { getTilNoteBySlug } from '@/lib/supabase';

interface TilDetailPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: TilDetailPageProps): Promise<Metadata> {
  const note = await getTilNoteBySlug(params.slug);
  if (!note) {
    return {
      title: 'Technique Not Found | 0xnullc0de',
    };
  }

  return {
    title: `${note.title} | TIL Notes & Techniques | 0xnullc0de`,
    description: note.summary || `${note.title} technical field note and offensive security reference.`,
  };
}

export default async function TilDetailPage({ params }: TilDetailPageProps) {
  const note = await getTilNoteBySlug(params.slug);

  if (!note) {
    notFound();
  }

  return <TilDetailView note={note} />;
}
