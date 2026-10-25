import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, mapDbToTool } from '@/lib/supabase';
import { fallbackTools } from '@/data/tools';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(fallbackTools, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return NextResponse.json(data.map(mapDbToTool), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('GET /api/tools error:', err);
    return NextResponse.json(fallbackTools);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      language = 'Python',
      category = 'Automation',
      tags = [],
      githubUrl = '',
      relatedWriteupSlug = '',
      displayOrder,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Required fields missing: name, description' },
        { status: 400 }
      );
    }

    let nextOrder = displayOrder;
    if (nextOrder === undefined || nextOrder === null) {
      const { data: latest } = await supabase
        .from('tools')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);
      nextOrder = (latest?.[0]?.display_order || 0) + 1;
    }

    const newRecord = {
      name: name.trim(),
      description: description.trim(),
      language: language.trim(),
      category: category.trim(),
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [],
      github_url: githubUrl.trim() || null,
      related_writeup_slug: relatedWriteupSlug.trim() || null,
      display_order: Number(nextOrder),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('tools')
      .insert(newRecord)
      .select()
      .single();

    if (error) {
      console.error('Insert tool error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToTool(data), { status: 201 });
  } catch (err: any) {
    console.error('POST /api/tools error:', err);
    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
