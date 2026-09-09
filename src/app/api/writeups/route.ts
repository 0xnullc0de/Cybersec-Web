import { NextResponse } from 'next/server';
import { supabase, mapDbToWriteup } from '@/lib/supabase';
import { writeups as fallbackWriteups } from '@/data/writeups';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('writeups_public')
      .select('*')
      .order('date_published', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json(fallbackWriteups);
    }

    const sanitized = data.map((row) => {
      const mapped = mapDbToWriteup(row);
      if (!row.is_retired && (!row.retirement_date || new Date(row.retirement_date) > new Date())) mapped.content = '';
      return mapped;
    });
    return NextResponse.json(sanitized);
  } catch (err: any) {
    console.error('API /api/writeups error:', err);
    return NextResponse.json(fallbackWriteups);
  }
}
