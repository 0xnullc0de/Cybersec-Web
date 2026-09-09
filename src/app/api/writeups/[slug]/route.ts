import { NextRequest, NextResponse } from 'next/server';
import { supabase, mapDbToWriteup, isWriteupRetired } from '@/lib/supabase';
import { writeups as fallbackWriteups } from '@/data/writeups';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const { data, error } = await supabase
      .from('writeups_public')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      const fallback = fallbackWriteups.find((w) => w.slug === slug);
      if (!fallback) {
        return NextResponse.json({ error: 'Writeup not found' }, { status: 404 });
      }
      // Sanitize active machine fallback content
      if (!fallback.isRetired) {
        return NextResponse.json({ ...fallback, content: '' });
      }
      return NextResponse.json(fallback);
    }

    const mapped = mapDbToWriteup(data);
    if (!isWriteupRetired(data)) mapped.content = '';
    return NextResponse.json(mapped);
  } catch (err: any) {
    console.error(`API /api/writeups/${params.slug} error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
