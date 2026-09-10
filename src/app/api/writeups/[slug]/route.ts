import { NextRequest, NextResponse } from 'next/server';
import { supabase, mapDbToWriteup, isWriteupRetired } from '@/lib/supabase';
import { writeups as fallbackWriteups } from '@/data/writeups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        return NextResponse.json({ ...fallback, content: '' }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        });
      }
      return NextResponse.json(fallback, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    const mapped = mapDbToWriteup(data);
    if (!isWriteupRetired(data)) mapped.content = '';
    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error(`API /api/writeups/${params.slug} error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
