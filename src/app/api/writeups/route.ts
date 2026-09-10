import { NextResponse } from 'next/server';
import { supabase, mapDbToWriteup, isWriteupRetired } from '@/lib/supabase';
import { writeups as fallbackWriteups } from '@/data/writeups';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('writeups_public')
      .select('*')
      .order('date_published', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json(fallbackWriteups, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    const sanitized = data.map((row) => {
      const mapped = mapDbToWriteup(row);
      if (!isWriteupRetired(row)) mapped.content = '';
      return mapped;
    });

    return NextResponse.json(sanitized, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('API /api/writeups error:', err);
    return NextResponse.json(fallbackWriteups, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  }
}
