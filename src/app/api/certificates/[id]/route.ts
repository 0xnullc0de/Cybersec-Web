import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, mapDbToCert } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const client = supabaseAdmin || supabase;

    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.fullName !== undefined) updates.full_name = body.fullName;
    if (body.issuer !== undefined) updates.issuer = body.issuer;
    if (body.date !== undefined) updates.date = body.date;
    if (body.status !== undefined) updates.status = body.status;
    if (body.credentialId !== undefined) updates.credential_id = body.credentialId;
    if (body.badgeColor !== undefined) updates.badge_color = body.badgeColor;
    if (body.description !== undefined) updates.description = body.description;
    if (body.skillsCovered !== undefined) {
      updates.skills_covered = Array.isArray(body.skillsCovered)
        ? body.skillsCovered
        : typeof body.skillsCovered === 'string'
        ? body.skillsCovered.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
    }
    if (body.verificationUrl !== undefined) updates.verification_url = body.verificationUrl;
    if (body.isProLab !== undefined) updates.is_pro_lab = Boolean(body.isProLab);
    if (body.writeupSlug !== undefined) updates.writeup_slug = body.writeupSlug ? body.writeupSlug.trim() : null;
    if (body.badgeImagePath !== undefined) updates.badge_image_path = body.badgeImagePath ? body.badgeImagePath.trim() : null;
    updates.updated_at = new Date().toISOString();

    // If ID is not a valid UUID (e.g. static fallback ID), find by name or insert new
    if (!UUID_REGEX.test(id)) {
      const targetName = body.name || id;
      const { data: existing } = await client
        .from('certificates')
        .select('*')
        .ilike('name', targetName)
        .limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await client
          .from('certificates')
          .update(updates)
          .eq('id', existing[0].id)
          .select()
          .single();

        if (error) {
          console.error('Update certificate error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(mapDbToCert(data));
      } else {
        const newRecord = {
          name: (body.name || id).trim(),
          full_name: (body.fullName || body.name || id).trim(),
          issuer: (body.issuer || 'OffSec').trim(),
          date: (body.date || '2024').trim(),
          status: body.status === 'in-progress' ? 'in-progress' : 'earned',
          ...updates,
        };

        const { data, error } = await client
          .from('certificates')
          .insert([newRecord])
          .select()
          .single();

        if (error) {
          console.error('Insert promoted certificate error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(mapDbToCert(data));
      }
    }

    const { data, error } = await client
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update certificate error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(mapDbToCert(data));
  } catch (err: any) {
    console.error('PATCH /api/certificates/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update certificate' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = supabaseAdmin || supabase;

    // If ID is not a valid UUID (e.g. static fallback ID), also delete by name if row exists
    if (!UUID_REGEX.test(id)) {
      const { data: matching } = await client
        .from('certificates')
        .select('id')
        .ilike('name', id.replace(/[-_]/g, '%'))
        .limit(1);

      if (matching && matching.length > 0) {
        await client.from('certificates').delete().eq('id', matching[0].id);
      }

      return NextResponse.json({ success: true, message: 'Certificate deleted' });
    }

    const { error } = await client
      .from('certificates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete certificate error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Certificate deleted' });
  } catch (err: any) {
    console.error('DELETE /api/certificates/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete certificate' }, { status: 500 });
  }
}
