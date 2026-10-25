import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, mapDbToTool } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // If ID is not a valid UUID (e.g. from static fallback data), check if it exists by name or insert it as new
    if (!UUID_REGEX.test(id)) {
      if (body.name) {
        const { data: existing } = await client
          .from('tools')
          .select('id')
          .eq('name', body.name.trim())
          .maybeSingle();

        if (existing?.id) {
          const { data: updated, error: updateErr } = await client
            .from('tools')
            .update(updates)
            .eq('id', existing.id)
            .select()
            .single();

          if (!updateErr && updated) {
            return NextResponse.json(mapDbToTool(updated));
          }
        }
      }

      // If not existing, insert as a new record in Supabase
      const { data: inserted, error: insertErr } = await client
        .from('tools')
        .insert({
          ...updates,
          name: body.name || 'Custom Tool',
          description: body.description || '',
          language: body.language || 'Python',
          category: body.category || 'AD Exploitation',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Insert tool fallback error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json(mapDbToTool(inserted));
    }

    // Normal valid UUID update
    const { data, error } = await client
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Update tool error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no row found to update, insert as new record
    if (!data) {
      const { data: inserted, error: insertErr } = await client
        .from('tools')
        .insert({
          ...updates,
          name: body.name || 'Custom Tool',
          description: body.description || '',
          language: body.language || 'Python',
          category: body.category || 'AD Exploitation',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json(mapDbToTool(inserted));
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

    // If ID is not a valid UUID (e.g. static fallback ID), report success cleanly
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json({ success: true, id });
    }

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
