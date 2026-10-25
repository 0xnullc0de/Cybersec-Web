import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, mapDbToTool } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.language !== undefined) updates.language = body.language.trim();
    if (body.category !== undefined) updates.category = body.category.trim();
    if (body.tags !== undefined) {
      updates.tags = Array.isArray(body.tags)
        ? body.tags
        : typeof body.tags === 'string'
        ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
    }
    if (body.githubUrl !== undefined) updates.github_url = body.githubUrl.trim() || null;
    if (body.relatedWriteupSlug !== undefined) {
      updates.related_writeup_slug = body.relatedWriteupSlug.trim() || null;
    }
    if (body.displayOrder !== undefined) updates.display_order = Number(body.displayOrder);
    updates.updated_at = new Date().toISOString();

    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update tool error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToTool(data));
  } catch (err: any) {
    console.error('PATCH /api/tools/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from('tools')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete tool error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('DELETE /api/tools/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
